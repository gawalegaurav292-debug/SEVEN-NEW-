import express from "express";
import fetch from "node-fetch";
import pLimit from "p-limit";

const PORT = process.env.PRICE_CHECKER_PORT || 3002;
const TIMEOUT_MS = parseInt(process.env.PRICE_CHECKER_TIMEOUT_MS || "7000", 10);
const CONCURRENCY = parseInt(process.env.PRICE_CHECKER_CONCURRENCY || "10", 10);
const limit = pLimit(CONCURRENCY);
const app = express();
app.use(express.json());

async function fetchWithTimeout(url, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const r = await fetch(url, { method: "GET", signal: controller.signal, headers: { "User-Agent": "SevenPriceChecker/1.0" }});
    clearTimeout(id);
    return r;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

async function getPriceFromEndpoint(endpoint) {
  try {
    const res = await fetchWithTimeout(endpoint);
    if (!res.ok) throw new Error("non-200 " + res.status);
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const j = await res.json();
      if (typeof j.price !== "undefined") return { ok: true, price: Number(j.price), currency: j.currency || null, raw: j };
    }
    // If HTML, try some simple parse (optional) - but prefer JSON endpoints
    return { ok: false, error: "no price field" };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

app.post("/check", async (req, res) => {
  const { product } = req.body;
  if (!product) return res.status(400).json({ ok: false, error: "product required" });
  const endpoint = product.price_check_endpoint || product.product_url;
  if (!endpoint) return res.status(400).json({ ok: false, error: "no endpoint" });
  try {
    const r = await limit(() => getPriceFromEndpoint(endpoint));
    return res.json(r);
  } catch (e) {
    return res.json({ ok: false, error: String(e) });
  }
});

app.listen(PORT, () => console.log(`Price checker running on ${PORT}`));
