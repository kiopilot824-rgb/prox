/**
 * store.js — لایه‌ی ذخیره‌سازی Chop روی Redis (نسخه‌ی Vercel)
 *
 * روی Cloudflare این پروژه از Durable Objects استفاده می‌کرد (یک شیء تکی و
 * strongly-consistent). Vercel Functions معادلی برای Durable Objects ندارد؛
 * هر function instance مستقل و بی‌حافظه‌ست، پس باید حالت مشترک روی یک
 * سرویس بیرونی (Redis) نگه داشته بشه — همون چیزی که خودِ مستندات
 * WebSocketهای Vercel هم توصیه می‌کنن.
 *
 * این کلاس عمداً همون متدها و امضاهای Cloudflare-store رو داره تا index.js
 * و bot.js تقریباً بدون تغییر روی هردو پلتفرم کار کنن.
 */
import Redis from "ioredis";

const LOG_MAX_ALL = 1000;
const ONLINE_TTL_SECONDS = 120;
const ONLINE_ACTIVE_WINDOW = 90;
const CONFIG_CACHE_MS = 5000;

function newId() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

let _redis = null;
function redisClient() {
  if (_redis) return _redis;
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error(
      "REDIS_URL تنظیم نشده — از Vercel Marketplace یک دیتابیس Redis وصل کن (یا هر Redis دیگه) و REDIS_URL رو در Environment Variables بذار."
    );
  }
  _redis = new Redis(url, { maxRetriesPerRequest: 3, lazyConnect: false });
  return _redis;
}

export class ChopStore {
  constructor() {
    this.r = redisClient();
    this._cfgCache = new Map();
    this._reqMem = null;
  }

  // ---------------------------------------------------------------- configs
  async listConfigs() {
    const all = await this.r.hgetall("configs"); // { id: jsonString }
    const usage = await this.r.hgetall("usage"); // { id: bytesString }
    const out = Object.entries(all).map(([id, raw]) => {
      const cfg = JSON.parse(raw);
      return { ...cfg, used_bytes: parseFloat(usage[id] || "0") };
    });
    out.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
    return out;
  }

  async getConfig(id) {
    const raw = await this.r.hget("configs", id);
    if (!raw) return null;
    const cfg = JSON.parse(raw);
    const used = parseFloat((await this.r.hget("usage", id)) || "0");
    return { ...cfg, used_bytes: used };
  }

  async getConfigByUuid(uuid) {
    const cached = this._cfgCache.get(uuid);
    if (cached && Date.now() - cached.ts < CONFIG_CACHE_MS) return cached.value;

    const id = await this.r.hget("uuidx", uuid);
    if (id) {
      const cfg = await this.getConfig(id);
      if (cfg && cfg.uuid === uuid) {
        this._cfgCache.set(uuid, { value: cfg, ts: Date.now() });
        return cfg;
      }
    }
    // fallback + self-heal ایندکس (برای دیتای وارد‌شده از بکاپ که ممکنه uuidx نداشته باشه)
    const all = await this.r.hgetall("configs");
    for (const [cid, raw] of Object.entries(all)) {
      const cfg = JSON.parse(raw);
      if (cfg.uuid === uuid) {
        await this.r.hset("uuidx", uuid, cid);
        const used = parseFloat((await this.r.hget("usage", cid)) || "0");
        const full = { ...cfg, used_bytes: used };
        this._cfgCache.set(uuid, { value: full, ts: Date.now() });
        return full;
      }
    }
    return null;
  }

  async saveConfig(config) {
    await this.r.hset("configs", config.id, JSON.stringify(config));
    if (config.uuid) {
      await this.r.hset("uuidx", config.uuid, config.id);
      this._cfgCache.delete(config.uuid);
    }
    return true;
  }

  async deleteConfig(id) {
    const raw = await this.r.hget("configs", id);
    const existing = raw ? JSON.parse(raw) : null;
    await this.r.hdel("configs", id);
    await this.r.hdel("usage", id);
    // فقط ورودی‌های online مربوط به همین configId رو پاک کن (نه کل مجموعه)
    const members = await this.r.zrange("online", 0, -1);
    const toRemove = members.filter((m) => m.startsWith(`${id}:`));
    if (toRemove.length) await this.r.zrem("online", ...toRemove);
    if (existing && existing.uuid) {
      await this.r.hdel("uuidx", existing.uuid);
      this._cfgCache.delete(existing.uuid);
    }
    return true;
  }

  async resetUsage(id) {
    await this.r.hdel("usage", id);
    return true;
  }

  async getUsage(id) {
    return parseFloat((await this.r.hget("usage", id)) || "0");
  }

  async bumpUsage(id, amount) {
    return await this.r.hincrbyfloat("usage", id, amount);
  }

  // ---------------------------------------------------------------- traffic
  async recordTrafficBucket(nbytes) {
    const bucket = Math.floor(Date.now() / 1000 / 3600) * 3600;
    await this.r.hincrby("traffic", String(bucket), nbytes);
    return true;
  }

  async getTrafficSeries(hours = 24) {
    const now = Math.floor(Date.now() / 1000);
    const nowBucket = Math.floor(now / 3600) * 3600;
    const buckets = [];
    for (let i = hours - 1; i >= 0; i--) buckets.push(String(nowBucket - i * 3600));
    // یه HMGET به‌جای N تا HGET جدا — روی Upstash هر دستور جدا (حتی توی
    // یه حلقه) جزو سهمِ ماهانه حساب می‌شه، پس این تفاوت ۲۴ برابری داره.
    const vals = buckets.length ? await this.r.hmget("traffic", ...buckets) : [];
    return buckets.map((bucket, idx) => ({ hour: Number(bucket), bytes: parseInt(vals[idx] || "0", 10) }));
  }

  // ------------------------------------------------------------------ online
  async markOnline(configId, clientIp) {
    await this.r.zadd("online", Date.now() / 1000, `${configId}:${clientIp}`);
    return true;
  }

  async _activeOnlineMembers(configId) {
    const now = Date.now() / 1000;
    // پاک‌سازی lazy ورودی‌های خیلی قدیمی (کل مجموعه، سبک چون فقط timestamp عضوهاست)
    await this.r.zremrangebyscore("online", "-inf", now - ONLINE_TTL_SECONDS);
    const prefix = `${configId}:`;
    const members = await this.r.zrangebyscore("online", now - ONLINE_ACTIVE_WINDOW, "+inf");
    return members.filter((m) => m.startsWith(prefix)).map((m) => m.slice(prefix.length));
  }

  async onlineIpCount(configId) {
    const ips = await this._activeOnlineMembers(configId);
    return new Set(ips).size;
  }

  async onlineIpCountsForAll() {
    const now = Date.now() / 1000;
    await this.r.zremrangebyscore("online", "-inf", now - ONLINE_TTL_SECONDS);
    const members = await this.r.zrangebyscore("online", now - ONLINE_ACTIVE_WINDOW, "+inf");
    const counts = {};
    for (const m of members) {
      const sep = m.indexOf(":");
      if (sep === -1) continue;
      const configId = m.slice(0, sep);
      counts[configId] = (counts[configId] || 0) + 1;
    }
    return counts;
  }

  async isIpWithinLimit(config, clientIp) {
    const limit = config.ip_limit || 0;
    if (!limit) return true;
    const ips = await this._activeOnlineMembers(config.id);
    const set = new Set(ips);
    return set.has(clientIp) || set.size < limit;
  }

  // -------------------------------------------------------------------- logs
  // قبلاً هر اتصال ۴ تا دستور مصرف می‌کرد (lpush+ltrim برای لاگ اختصاصیِ
  // کانفیگ، و دوباره lpush+ltrim برای لاگ کلی). چون این دو لیست عملاً همون
  // دیتا رو دوبار ذخیره می‌کردن، فقط یه لیستِ کلی نگه می‌داریم و نمای
  // «لاگِ یه کانفیگ خاص» رو موقع خوندن (که خیلی کمتر از نوشتن اتفاق
  // می‌افته) فیلتر می‌کنیم. LTRIM هم دیگه هر بار اجرا نمی‌شه — چون فقط
  // کارش جلوگیری از رشدِ بی‌حدِ لیسته، لازم نیست هر لاگ اجرا بشه؛ به‌طور
  // میانگین هر ۱۰ لاگ یه بار کافیه.
  async logConnection(configId, configName, clientIp, address, port, nbytes) {
    const entry = {
      config_id: configId,
      config_name: configName,
      ip: clientIp,
      address,
      port,
      bytes: nbytes,
      ts: Date.now() / 1000,
    };
    const json = JSON.stringify(entry);
    if (Math.random() < 0.1) {
      const pipe = this.r.pipeline();
      pipe.lpush("logall", json);
      pipe.ltrim("logall", 0, LOG_MAX_ALL - 1);
      await pipe.exec();
    } else {
      await this.r.lpush("logall", json);
    }
    return true;
  }

  async getLogs(configId, limit = 100) {
    // برای «همه‌ی لاگ‌ها» یه LRANGE ساده کافیه. برای لاگِ یه کانفیگ خاص،
    // چون دیگه لیستِ جدا نداریم، یه بازه‌ی بزرگ‌تر از لیستِ کلی می‌خونیم و
    // خودمون فیلتر می‌کنیم — همچنان فقط ۱ دستور Redis، فقط خوندنش یه‌کم
    // بزرگ‌تره (که چون خوندن لاگ کمیابه، به‌صرفه‌ست).
    if (!configId) {
      const raw = await this.r.lrange("logall", 0, limit - 1);
      return raw.map((s) => JSON.parse(s));
    }
    const raw = await this.r.lrange("logall", 0, LOG_MAX_ALL - 1);
    const out = [];
    for (const s of raw) {
      const entry = JSON.parse(s);
      if (entry.config_id === configId) {
        out.push(entry);
        if (out.length >= limit) break;
      }
    }
    return out;
  }

  // ------------------------------------------------------- mtproto (تلگرام)
  async listMtprotoProxies() {
    const all = await this.r.hgetall("mtproto");
    const out = Object.values(all).map((raw) => JSON.parse(raw));
    out.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
    return out;
  }

  async getMtprotoProxy(id) {
    const raw = await this.r.hget("mtproto", id);
    return raw ? JSON.parse(raw) : null;
  }

  async saveMtprotoProxy(proxy) {
    await this.r.hset("mtproto", proxy.id, JSON.stringify(proxy));
    return true;
  }

  async deleteMtprotoProxy(id) {
    await this.r.hdel("mtproto", id);
    return true;
  }

  // --------------------------------------------------------------- bot config
  async getBotSettings() {
    const [token, enabled, secret] = await this.r.hmget("bot:settings", "token", "enabled", "secret");
    return { token: token || "", enabled: enabled === "1", secret: secret || "" };
  }

  async saveBotSettings(token, enabled, secret) {
    const fields = ["token", token || ""];
    if (secret) fields.push("secret", secret);
    fields.push("enabled", enabled ? "1" : "0");
    await this.r.hmset("bot:settings", ...fields);
    return true;
  }

  async listBotAdmins() {
    const all = await this.r.hgetall("bot:admins");
    const admins = Object.values(all).map((v) => JSON.parse(v));
    admins.sort((a, b) => (a.added_at || 0) - (b.added_at || 0));
    return admins;
  }

  async isBotAdmin(tgId) {
    return !!(await this.r.hexists("bot:admins", String(tgId)));
  }

  async addBotAdmin(tgId, addedBy = "") {
    await this.r.hset(
      "bot:admins",
      String(tgId),
      JSON.stringify({ id: String(tgId), added_at: Date.now() / 1000, added_by: addedBy })
    );
    return true;
  }

  async removeBotAdmin(tgId) {
    await this.r.hdel("bot:admins", String(tgId));
    return true;
  }

  async upsertBotMember(tgId, username, firstName) {
    const now = Date.now() / 1000;
    const key = String(tgId);
    const existingRaw = await this.r.hget("bot:members", key);
    const existing = existingRaw ? JSON.parse(existingRaw) : null;
    const data = existing
      ? { ...existing, username, first_name: firstName, last_seen: now }
      : { id: key, username, first_name: firstName, joined_at: now, last_seen: now };
    await this.r.hset("bot:members", key, JSON.stringify(data));
    return true;
  }

  async listBotMembers() {
    const all = await this.r.hgetall("bot:members");
    const members = Object.values(all).map((v) => JSON.parse(v));
    members.sort((a, b) => (b.last_seen || 0) - (a.last_seen || 0));
    return members;
  }

  async removeBotMember(tgId) {
    await this.r.hdel("bot:members", String(tgId));
    return true;
  }

  async setBotPending(tgId, data) {
    await this.r.hset("bot:pending", String(tgId), JSON.stringify(data));
    return true;
  }

  async getBotPending(tgId) {
    const raw = await this.r.hget("bot:pending", String(tgId));
    return raw ? JSON.parse(raw) : null;
  }

  async clearBotPending(tgId) {
    await this.r.hdel("bot:pending", String(tgId));
    return true;
  }

  // ------------------------------------------------------------------ settings (generic key/value)
  async getSetting(key) {
    const v = await this.r.hget("settings", key);
    return v === null || v === undefined ? null : v;
  }

  async setSetting(key, value) {
    await this.r.hset("settings", key, value);
    return true;
  }

  // ------------------------------------------------------------ request counter
  _utcDay() {
    return new Date().toISOString().slice(0, 10);
  }

  async bumpRequestCounter() {
    const day = this._utcDay();
    const key = `reqcount:${day}`;
    const val = await this.r.incr(key);
    await this.r.expire(key, 3 * 86400); // بعد از ۳ روز خودش پاک بشه
    return val;
  }

  async getRequestCounter() {
    return parseInt((await this.r.get(`reqcount:${this._utcDay()}`)) || "0", 10);
  }

  async getRequestCounterHistory(days = 7) {
    const now = new Date();
    const dayKeys = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000).toISOString().slice(0, 10);
      dayKeys.push(d);
    }
    const keys = dayKeys.map((d) => `reqcount:${d}`);
    // یه MGET به‌جای N تا GET جدا — همون دلیل getTrafficSeries.
    const vals = keys.length ? await this.r.mget(...keys) : [];
    return dayKeys.map((day, idx) => ({ day, count: parseInt(vals[idx] || "0", 10) }));
  }

  // ------------------------------------------------------------------ misc
  async newId() {
    return newId();
  }

  async healthBackend() {
    return "redis (vercel)";
  }

  // --------------------------------------------------------- backup/restore
  async exportAll() {
    const configsRaw = await this.r.hgetall("configs");
    const configs = Object.fromEntries(Object.entries(configsRaw).map(([k, v]) => [k, JSON.parse(v)]));
    const usageRaw = await this.r.hgetall("usage");
    const usage = Object.fromEntries(Object.entries(usageRaw).map(([k, v]) => [k, parseFloat(v)]));
    const trafficRaw = await this.r.hgetall("traffic");
    const trafficHourly = Object.fromEntries(Object.entries(trafficRaw).map(([k, v]) => [k, parseInt(v, 10)]));
    const botSettings = await this.getBotSettings();
    const adminsRaw = await this.r.hgetall("bot:admins");
    const botAdmins = Object.fromEntries(Object.entries(adminsRaw).map(([k, v]) => [k, JSON.parse(v)]));
    const membersRaw = await this.r.hgetall("bot:members");
    const botMembers = Object.fromEntries(Object.entries(membersRaw).map(([k, v]) => [k, JSON.parse(v)]));
    const logsAll = (await this.r.lrange("logall", 0, LOG_MAX_ALL - 1)).map((s) => JSON.parse(s));
    const mtprotoRaw = await this.r.hgetall("mtproto");
    const mtproto = Object.fromEntries(Object.entries(mtprotoRaw).map(([k, v]) => [k, JSON.parse(v)]));

    return {
      version: 1,
      app: "chop",
      exported_at: Date.now() / 1000,
      configs,
      usage,
      traffic_hourly: trafficHourly,
      bot_settings: botSettings,
      bot_admins: botAdmins,
      bot_members: botMembers,
      logs_all: logsAll,
      mtproto,
    };
  }

  async importAll(data, mode = "replace") {
    if (!data || typeof data !== "object" || !("configs" in data)) {
      throw new Error("فایل بکاپ معتبر نیست");
    }

    if (mode === "replace") {
      await this.r.del(
        "configs",
        "usage",
        "uuidx",
        "traffic",
        "bot:admins",
        "bot:members",
        "logall",
        "online",
        "mtproto"
      );
      this._cfgCache.clear();
    }

    const counters = { configs: 0, admins: 0, members: 0, mtproto: 0 };

    for (const [configId, cfg] of Object.entries(data.configs || {})) {
      await this.r.hset("configs", configId, JSON.stringify(cfg));
      if (cfg && cfg.uuid) await this.r.hset("uuidx", cfg.uuid, configId);
      counters.configs++;
    }
    for (const [configId, used] of Object.entries(data.usage || {})) {
      await this.r.hset("usage", configId, String(used));
    }
    for (const [bucket, val] of Object.entries(data.traffic_hourly || {})) {
      await this.r.hset("traffic", bucket, String(val));
    }

    const botSettings = data.bot_settings || {};
    if (botSettings.token) {
      await this.saveBotSettings(botSettings.token || "", !!botSettings.enabled, botSettings.secret || "");
    }

    for (const [tgId, admin] of Object.entries(data.bot_admins || {})) {
      await this.r.hset("bot:admins", tgId, JSON.stringify(admin));
      counters.admins++;
    }
    for (const [tgId, member] of Object.entries(data.bot_members || {})) {
      await this.r.hset("bot:members", tgId, JSON.stringify(member));
      counters.members++;
    }

    // logs_all رو مستقیم ریستور کن؛ برای بکاپ‌های قدیمی‌تر که logs_per_config
    // داشتن (قبل از این‌که به یه لیستِ کلی تبدیل بشه)، اون ورودی‌ها رو هم
    // با همون لیست کلی merge می‌کنیم تا داده گم نشه.
    const allLogEntries = [...(data.logs_all || [])];
    for (const entries of Object.values(data.logs_per_config || {})) {
      if (Array.isArray(entries)) allLogEntries.push(...entries);
    }
    if (allLogEntries.length) {
      const pipe = this.r.pipeline();
      for (const entry of allLogEntries) pipe.rpush("logall", JSON.stringify(entry));
      pipe.ltrim("logall", 0, LOG_MAX_ALL - 1);
      await pipe.exec();
    }

    for (const [id, proxy] of Object.entries(data.mtproto || {})) {
      await this.r.hset("mtproto", id, JSON.stringify(proxy));
      counters.mtproto++;
    }

    return counters;
  }
}

/** singleton سراسری، درست مثل getStore(env) نسخه‌ی Cloudflare */
let _store = null;
export function getStore() {
  if (!_store) _store = new ChopStore();
  return _store;
}
