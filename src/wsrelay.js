/**
 * wsrelay.js — موتور ترنسپورت VLESS+WS برای Chop روی Vercel Functions
 *
 * برخلاف Cloudflare Workers (که یک اتصال WebSocket برای همیشه به همون
 * اجرای Worker پین می‌مونه)، اینجا از WebSocket بومی جدید Vercel Functions
 * (Beta، مبتنی بر کتابخانه‌ی `ws`) استفاده می‌کنیم. هر اتصال حداکثر تا
 * سقف maxDuration پروژه (که در vercel.json روی ۳۰ دقیقه ست شده) باز
 * می‌مونه و بعدش کلاینت باید خودش دوباره وصل بشه — این محدودیت پلتفرم
 * Vercel است، نه چیزی که این کد بتونه دور بزنه.
 *
 * منطق runSession عیناً همون منطق نسخه‌ی Cloudflare است، چون کتابخانه‌ی
 * `ws` هم رابط addEventListener/binaryType/send/close سازگار با استاندارد
 * WebSocket مرورگر رو پیاده‌سازی می‌کنه.
 */
import { parseVlessHeader, buildResponseHeader, VlessParseError } from "./vless.js";
import { getStore } from "./store.js";
import { connectUpstream } from "./proxyconn.js";
import { isBlocked } from "./blocklist.js";

const HANDSHAKE_TIMEOUT_MS = 10_000;

function concatBytes(a, b) {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// اگه bufferedAmount زیاد بشه یعنی کلاینت داره کندتر از upstream می‌خونه؛
// بدون این چک، pumpUpstreamToClient بدون توقف می‌خونه و می‌فرسته و حافظه‌ی
// بافرشده روی سرور بی‌رویه بزرگ می‌شه (فشار GC میاره و عملاً کندتر می‌شه).
// یه سقف ساده می‌ذاریم و قبل از خوندن chunk بعدی صبر می‌کنیم تا خالی بشه.
const HIGH_WATERMARK = 1 << 20; // 1MB
async function waitForDrain(ws) {
  let waited = 0;
  while ((ws.bufferedAmount || 0) > HIGH_WATERMARK && waited < 5000) {
    await delay(20);
    waited += 20;
  }
}

async function toUint8(data) {
  if (typeof data === "string") return new TextEncoder().encode(data);
  if (typeof Blob !== "undefined" && data instanceof Blob) {
    return new Uint8Array(await data.arrayBuffer());
  }
  // کتابخانه‌ی ws معمولاً یک Buffer برمی‌گردونه. new Uint8Array(buffer) این رو
  // element-by-element کپی می‌کنه (یه ArrayBuffer کاملاً جدید می‌سازه) که برای
  // پروکسیِ پرترافیک هزینه‌ی CPU/GC غیرضروریه؛ به‌جاش یک view روی همون حافظه‌ی
  // موجود می‌سازیم — بدون کپی.
  if (data && data.buffer instanceof ArrayBuffer && typeof data.byteOffset === "number" && typeof data.byteLength === "number") {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  }
  return new Uint8Array(data);
}

/** آی‌پی واقعی کلاینت را از هدرهای پراکسی Vercel/Node استخراج می‌کند */
export function clientIpFromNodeRequest(req) {
  const xff = req.headers["x-forwarded-for"];
  if (xff) return String(xff).split(",")[0].trim();
  if (req.headers["x-real-ip"]) return String(req.headers["x-real-ip"]).trim();
  return req.socket?.remoteAddress || "unknown";
}

export async function runSession(ws, clientIp) {
  const store = getStore();

  let handshakeDone = false;
  let handshakeTimer = setTimeout(() => {
    if (!handshakeDone) {
      try {
        ws.close(1002, "handshake timeout");
      } catch {
        /* ignore */
      }
    }
  }, HANDSHAKE_TIMEOUT_MS);

  let socket = null;
  let writer = null;
  let config = null;
  let parsed = null;
  const counters = { up: 0, down: 0 };
  let finalized = false;

  async function finalize() {
    if (finalized) return;
    finalized = true;
    clearTimeout(handshakeTimer);
    try {
      writer && (await writer.close());
    } catch {
      /* ignore */
    }
    try {
      socket && (await socket.close());
    } catch {
      /* ignore */
    }
    const total = counters.up + counters.down;
    if (config && total > 0) {
      try {
        await Promise.all([
          store.bumpUsage(config.id, total),
          store.recordTrafficBucket(total),
          store.logConnection(config.id, config.name, clientIp, parsed?.address, parsed?.port, total),
        ]);
      } catch {
        /* بهتره اتصال به‌خاطر شکست ثبت آمار قطع نشه */
      }
    }
  }

  async function pumpUpstreamToClient() {
    const reader = socket.readable.getReader();
    let sentHeader = false;
    try {
      while (true) {
        await waitForDrain(ws);
        const { value, done } = await reader.read();
        if (done) break;
        const out = sentHeader ? value : concatBytes(buildResponseHeader(), value);
        sentHeader = true;
        try {
          ws.send(out);
        } catch {
          break;
        }
        counters.down += value.length;
      }
    } catch {
      /* اتصال مقصد بسته/قطع شده */
    } finally {
      if (!sentHeader) {
        try {
          ws.send(buildResponseHeader());
        } catch {
          /* ignore */
        }
      }
      try {
        ws.close(1000, "upstream closed");
      } catch {
        /* ignore */
      }
    }
  }

  ws.addEventListener("message", async (event) => {
    try {
      const buf = await toUint8(event.data);

      if (!handshakeDone) {
        clearTimeout(handshakeTimer);

        try {
          parsed = parseVlessHeader(buf);
        } catch (e) {
          if (e instanceof VlessParseError) {
            ws.close(1002, "bad vless header");
            return;
          }
          throw e;
        }

        config = await store.getConfigByUuid(parsed.clientUuid);
        if (!config || config.enabled === false) {
          ws.close(1008, "unknown or disabled config");
          return;
        }

        const trafficLimit = config.traffic_limit_bytes || 0;
        if (trafficLimit && (config.used_bytes || 0) >= trafficLimit) {
          ws.close(1008, "quota exceeded");
          return;
        }

        // چک لیستِ مسدودی قبل از هر کار دیگه‌ای (حتی قبل از رفت‌وبرگشتِ
        // Redis برای چک IP) — چون کاملاً محلیه و فوریه، هم سریع‌تره هم از
        // هدر رفتنِ یه تلاشِ اتصال TCP به مقصدِ مسدودشده جلوگیری می‌کنه.
        if (isBlocked(parsed.address, config.blocklist)) {
          ws.close(1008, "destination blocked");
          return;
        }

        // این دو کار به هم وابسته نیستن (چک محدودیت IP فقط رفت‌وبرگشت به
        // Redis می‌خواد، اتصال upstream فقط handshake TCP می‌خواد)، پس
        // به‌جای پشتِ‌سرِ‌هم، همزمان انجامشون می‌دیم — یعنی هندشیک TCP به
        // مقصد از همون لحظه شروع می‌شه، نه بعد از برگشتنِ جواب Redis. این
        // یه رفت‌وبرگشتِ کامل از latency اتصال (که کاربر به‌عنوان تأخیرِ
        // برقراری اتصال حس می‌کنه) کم می‌کنه.
        const limitPromise = store.isIpWithinLimit(config, clientIp);
        const connectPromise = connectUpstream(config, parsed.address, parsed.port).catch((e) => e);

        const withinLimit = await limitPromise;
        if (!withinLimit) {
          const maybeSocket = await connectPromise;
          if (maybeSocket && !(maybeSocket instanceof Error)) {
            try {
              await maybeSocket.close();
            } catch {
              /* ignore */
            }
          }
          ws.close(1008, "ip limit exceeded");
          return;
        }

        const connectResult = await connectPromise;
        if (connectResult instanceof Error) {
          ws.close(1011, "upstream connect failed");
          return;
        }
        socket = connectResult;
        writer = socket.writable.getWriter();

        pumpUpstreamToClient().finally(finalize);

        store.markOnline(config.id, clientIp).catch(() => {});
        handshakeDone = true;

        const initialPayload = buf.subarray(parsed.headerLen);
        if (initialPayload.length > 0) {
          await writer.write(initialPayload);
          counters.up += initialPayload.length;
        }
        return;
      }

      if (writer) {
        await writer.write(buf);
        counters.up += buf.length;
      }
    } catch {
      try {
        ws.close(1011, "relay error");
      } catch {
        /* ignore */
      }
      await finalize();
    }
  });

  ws.addEventListener("close", () => {
    finalize();
  });

  ws.addEventListener("error", () => {
    finalize();
  });
}
