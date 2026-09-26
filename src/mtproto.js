/**
 * mtproto.js — پروکسی MTProto تلگرام (ترنسپورت مبهم‌سازی‌شده با secret)
 *
 * این فایل همون ترنسپورت "obfuscated2" تلگرام رو پیاده می‌کنه — روشی که
 * خودِ اپ تلگرام برای اتصال به پروکسی‌های secret-based استفاده می‌کنه
 * (لینک‌های tg://proxy?server=...&port=...&secret=...). فقط از secretهای
 * معمولی/امن (۱۶ بایت، هگز، با یا بدون پیشوند dd) پشتیبانی می‌شه — حالت
 * fake-TLS (پیشوند ee + دامنه) عمداً پیاده نشده، چون نیاز به شبیه‌سازیِ
 * کاملِ هندشیکِ TLS داره و نیمه‌کاره بودنش یعنی «پروکسی‌ای که به کلاینت‌های
 * fake-TLS وصل نمی‌شه»، نه فقط ضعیف‌تر.
 *
 * منطق (مطابق با پیاده‌سازی رسمی MTProxy و پیاده‌سازی‌های شناخته‌شده‌ی
 * دیگه مثل mtprotoproxy):
 *  ۱. کلاینت اولین ۶۴ بایت رو رندوم می‌فرسته («هدر مبهم»).
 *  ۲. سرور از روی این ۶۴ بایت + secret، دو جفت کلید/IV می‌سازه: یکی برای
 *     رمزگشاییِ جهت کلاینت→سرور، و یکی (از روی بایت‌های معکوس‌شده‌ی همون
 *     هدر) برای رمزگذاریِ جهت سرور→کلاینت — هر دو AES-256-CTR.
 *  ۳. خودِ هدر ۶۴ بایتی هم با کلید رمزگشایی، رمزگشایی می‌شه تا «تگ
 *     پروتکل» (۴ بایت) و «dc_id» موردنظر کلاینت به دست بیاد.
 *  ۴. سرور یک اتصال TCP ساده به همون دیتاسنتر واقعی تلگرام باز می‌کنه، تگ
 *     پروتکل رو عیناً به‌عنوان اولین بایت‌ها می‌فرسته، و از اون به بعد فقط
 *     بایت رد و بدل می‌کنه (استریمِ کلاینت از دیسایفر رد می‌شه و به سمت
 *     دیتاسنتر می‌ره؛ استریمِ دیتاسنتر از سایفر رد می‌شه و به کلاینت
 *     برمی‌گرده) — بدون این‌که خودش معنای فریم‌های MTProto رو بفهمه.
 *
 * ⚠️ این یک پیاده‌سازیِ از-صفرِ یک پروتکلِ رمزنگاریِ باینریه؛ قبل از تکیه
 * کردن روش برای کاربرهای واقعی، حتماً با اپ رسمی تلگرام تست کن.
 */
import net from "node:net";
import crypto from "node:crypto";

const HEADER_LEN = 64;

// آی‌پیِ رسمیِ دیتاسنترهای production تلگرام (IPv4). این آدرس‌ها به‌ندرت
// عوض می‌شن؛ اگه یه‌روزی عوض شدن، فقط همین جدول باید به‌روز بشه.
const DC_ADDRESSES = {
  1: { host: "149.154.175.53", port: 443 },
  2: { host: "149.154.167.51", port: 443 },
  3: { host: "149.154.175.100", port: 443 },
  4: { host: "149.154.167.91", port: 443 },
  5: { host: "91.108.56.130", port: 443 },
};
const DEFAULT_DC = 2;

// اگه بایت‌های اولِ هدر با این الگوها یکی باشن، یعنی این یه کلاینتِ MTProto
// واقعی نیست (احتمالاً یه اسکنر/DPI که داره پروتکل رو حدس می‌زنه یا یه
// هندشیکِ TLS واقعیه) — رد می‌کنیم بدون پاسخ، دقیقاً مثل پیاده‌سازی‌های
// شناخته‌شده‌ی دیگه.
const BAD_HEADER_PREFIXES4 = [
  Buffer.from([0x16, 0x03, 0x01, 0x02]), // TLS ClientHello واقعی
  Buffer.from([0xdd, 0xdd, 0xdd, 0xdd]),
  Buffer.from([0xee, 0xee, 0xee, 0xee]),
  Buffer.from("HEAD"),
  Buffer.from("POST"),
  Buffer.from("GET "),
  Buffer.from([0x00, 0x00, 0x00, 0x00]),
];

function isValidHeader(header) {
  if (header[0] === 0xef) return false; // مارکِ پروتکلِ abridged خام (بدون مبهم‌سازی)
  const first4 = header.subarray(0, 4);
  return !BAD_HEADER_PREFIXES4.some((bad) => first4.equals(bad));
}

/**
 * secretِ ورودی (هگز؛ با یا بدون پیشوندِ نوعِ ۱ بایتی مثلِ dd) رو به ۱۶ بایتِ
 * خامِ موردنیاز برای مشتق‌سازیِ کلید تبدیل می‌کنه.
 */
export function parseSecret(hex) {
  const clean = String(hex || "")
    .trim()
    .toLowerCase()
    .replace(/^0x/, "");
  if (!/^[0-9a-f]+$/.test(clean) || clean.length % 2 !== 0) {
    throw new Error("secret باید رشته‌ی هگزادسیمال معتبر باشد");
  }
  let bytes = Buffer.from(clean, "hex");
  // پیشوندهای ۱ بایتیِ نوع (dd = حالت امن، ee = fake-TLS که اینجا پشتیبانی
  // نمی‌شه) رو کنار می‌ذاریم؛ فقط ۱۶ بایتِ secretِ خام برای رمزنگاری لازمه.
  if (bytes.length >= 17 && (bytes[0] === 0xdd || bytes[0] === 0xee)) {
    bytes = bytes.subarray(1);
  }
  if (bytes.length < 16) throw new Error("secret باید حداقل ۱۶ بایت (۳۲ کاراکتر هگز) باشد");
  return bytes.subarray(0, 16);
}

/** یک secretِ تصادفیِ جدید در حالت «امن» (پیشوند dd) می‌سازه. */
export function generateSecretHex() {
  return "dd" + crypto.randomBytes(16).toString("hex");
}

/** لینک‌های tg://proxy و t.me/proxy رو از روی سرور/پورت/secret می‌سازه. */
export function buildTelegramProxyLink({ server, port, secret }) {
  let rawSecretHex;
  try {
    rawSecretHex = parseSecret(secret).toString("hex");
  } catch {
    rawSecretHex = String(secret || "").replace(/^(dd|ee)/i, "");
  }
  const params = `server=${encodeURIComponent(server)}&port=${port}&secret=${rawSecretHex}`;
  return {
    tg: `tg://proxy?${params}`,
    tme: `https://t.me/proxy?${params}`,
  };
}

function deriveKeys(header, secretBytes) {
  // جهتِ کلاینت→سرور: مستقیم از بایت‌های ۸ تا ۴۰ (کلید) و ۴۰ تا ۵۶ (IV)
  const decKeyMaterial = header.subarray(8, 40);
  const decIv = Buffer.from(header.subarray(40, 56));
  // جهتِ سرور→کلاینت: همون بازه‌ها ولی از انتها به ابتدا (معکوس)
  const encKeyMaterial = Buffer.from(header.subarray(24, 56)).reverse();
  const encIv = Buffer.from(header.subarray(16, 32)).reverse();

  const decKey = crypto.createHash("sha256").update(Buffer.concat([decKeyMaterial, secretBytes])).digest();
  const encKey = crypto.createHash("sha256").update(Buffer.concat([encKeyMaterial, secretBytes])).digest();

  return { decKey, decIv, encKey, encIv };
}

/** دقیقاً n بایت از یک net.Socket می‌خونه، بدون این‌که بایت‌های بعدی رو مصرف کنه. */
function readExactly(socket, n) {
  return new Promise((resolve, reject) => {
    function tryRead() {
      const chunk = socket.read(n);
      if (chunk) {
        cleanup();
        resolve(chunk);
      }
    }
    function onEnd() {
      cleanup();
      reject(new Error("اتصال قبل از تکمیل هندشیک بسته شد"));
    }
    function onError(e) {
      cleanup();
      reject(e);
    }
    function cleanup() {
      socket.removeListener("readable", tryRead);
      socket.removeListener("end", onEnd);
      socket.removeListener("error", onError);
    }
    socket.on("readable", tryRead);
    socket.on("end", onEnd);
    socket.on("error", onError);
    tryRead();
  });
}

async function handleClient(socket, secretBytes, onStats) {
  socket.setNoDelay(true);

  let header;
  try {
    header = await readExactly(socket, HEADER_LEN);
  } catch {
    socket.destroy();
    return;
  }
  if (!isValidHeader(header)) {
    socket.destroy();
    return;
  }

  let decipher, cipher, decryptedHeader;
  try {
    const { decKey, decIv, encKey, encIv } = deriveKeys(header, secretBytes);
    decipher = crypto.createDecipheriv("aes-256-ctr", decKey, decIv);
    cipher = crypto.createCipheriv("aes-256-ctr", encKey, encIv);
    // رمزگشاییِ خودِ هدر هم لازمه — هم برای گرفتنِ تگِ پروتکل/dc_id، هم
    // چون جریانِ AES-CTR باید از بایتِ صفرِ هدر جلو بره (نه از بایتِ ۶۴)
    // تا با چیزی که کلاینت حساب کرده هم‌تراز بمونه.
    decryptedHeader = decipher.update(header);
  } catch {
    socket.destroy();
    return;
  }

  const dcIdRaw = decryptedHeader.readInt16LE(60);
  const dcId = DC_ADDRESSES[Math.abs(dcIdRaw)] ? Math.abs(dcIdRaw) : DEFAULT_DC;
  const protocolTag = Buffer.from(decryptedHeader.subarray(56, 60));
  const dc = DC_ADDRESSES[dcId];

  const upstream = net.connect({ host: dc.host, port: dc.port });
  upstream.setNoDelay(true);

  const cleanup = () => {
    socket.destroy();
    upstream.destroy();
  };
  upstream.once("error", cleanup);
  socket.once("error", cleanup);
  socket.once("close", cleanup);
  upstream.once("close", cleanup);

  upstream.once("connect", () => {
    upstream.write(protocolTag);
    // از این‌جا به بعد فقط بایتِ رمزگشایی/رمزگذاری‌شده رد و بدل می‌شه —
    // پروکسی خودش هیچ فریمی از MTProto رو نمی‌فهمه و نیازی هم نداره.
    socket.pipe(decipher).pipe(upstream);
    upstream.pipe(cipher).pipe(socket);
    if (typeof onStats === "function") onStats({ dcId });
  });
}

// ── مدیریتِ لیسنرها (یک TCP سرور به ازای هر پروکسی/پورت) ─────────────────
const activeServers = new Map(); // id -> net.Server

export function startProxyListener(id, port, secretHex, onListenError) {
  stopProxyListener(id);
  let secretBytes;
  try {
    secretBytes = parseSecret(secretHex);
  } catch (e) {
    if (typeof onListenError === "function") onListenError(e);
    return;
  }
  const server = net.createServer((socket) => {
    handleClient(socket, secretBytes).catch(() => socket.destroy());
  });
  server.on("error", (e) => {
    console.error(`mtproto[${id}] خطای پورت ${port}:`, e.message);
    if (typeof onListenError === "function") onListenError(e);
  });
  server.listen(port, "0.0.0.0");
  activeServers.set(id, server);
}

export function stopProxyListener(id) {
  const s = activeServers.get(id);
  if (s) {
    try {
      s.close();
    } catch {
      /* ignore */
    }
    activeServers.delete(id);
  }
}

export function stopAllListeners() {
  for (const id of [...activeServers.keys()]) stopProxyListener(id);
}

export function isListening(id) {
  return activeServers.has(id);
}
