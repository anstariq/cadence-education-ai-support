// Places an outbound Vapi call to the number the visitor entered.
//
// This exists because outbound calls require Vapi's PRIVATE key, which must
// never reach the browser. Everything secret is read from Vercel env vars:
//   VAPI_PRIVATE_KEY     — Dashboard → API Keys (private)
//   VAPI_PHONE_NUMBER_ID — the Vapi number used as caller ID
//   VAPI_ASSISTANT_ID    — the Cadence assistant

var RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
var RATE_LIMIT_MAX = 3;

// Best-effort only: serverless instances are ephemeral and there may be
// several at once, so this throttles casual abuse, not a determined attacker.
// Vercel's firewall is the real control.
var recentCalls = new Map();

function rateLimited(ip) {
  var now = Date.now();
  var hits = (recentCalls.get(ip) || []).filter(function (t) {
    return now - t < RATE_LIMIT_WINDOW_MS;
  });
  if (hits.length >= RATE_LIMIT_MAX) return true;
  hits.push(now);
  recentCalls.set(ip, hits);
  return false;
}

// Accepts "5551234567", "(555) 123-4567", "+44 7700 900123" and returns E.164.
// Bare 10-digit and 11-digit numbers are assumed US/Canada; anything else must
// be entered with its own + prefix.
function toE164(raw) {
  if (typeof raw !== "string") return null;
  var trimmed = raw.trim();
  var digits = trimmed.replace(/[^\d]/g, "");

  if (trimmed.charAt(0) === "+") {
    return digits.length >= 8 && digits.length <= 15 ? "+" + digits : null;
  }
  if (digits.length === 10) return "+1" + digits;
  if (digits.length === 11 && digits.charAt(0) === "1") return "+" + digits;
  return null;
}

// Tells the visitor what is actually wrong. The most common mistake is an
// international number typed without its + and country code, which is
// indistinguishable from a mistyped US number unless we say so.
function numberError(raw) {
  var trimmed = typeof raw === "string" ? raw.trim() : "";
  var digits = trimmed.replace(/[^\d]/g, "");

  if (!digits) return "Enter your phone number so we can call you back.";
  if (trimmed.charAt(0) === "+") {
    return "That country code and number don't look right. Check the digits after the +.";
  }
  if (digits.length > 11) {
    return "For numbers outside the US, start with + and your country code — e.g. +44 7700 900123.";
  }
  return "Enter a valid 10-digit US number, including area code.";
}

function sameOrigin(req) {
  var host = req.headers.host;
  var origin = req.headers.origin || req.headers.referer;
  if (!origin) return false;
  try {
    return new URL(origin).host === host;
  } catch (e) {
    return false;
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!sameOrigin(req)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  var missing = [
    "VAPI_PRIVATE_KEY",
    "VAPI_PHONE_NUMBER_ID",
    "VAPI_ASSISTANT_ID",
  ].filter(function (k) {
    return !process.env[k];
  });
  if (missing.length) {
    console.error("Missing env vars: " + missing.join(", "));
    return res.status(500).json({ error: "Calling is not configured yet." });
  }

  var ip =
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  if (rateLimited(ip)) {
    return res
      .status(429)
      .json({ error: "Too many call requests. Please try again shortly." });
  }

  var body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (e) {
      body = {};
    }
  }

  var raw = (body || {}).number;
  var number = toE164(raw);
  if (!number) {
    return res.status(400).json({ error: numberError(raw) });
  }

  try {
    var vapiRes = await fetch("https://api.vapi.ai/call", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.VAPI_PRIVATE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assistantId: process.env.VAPI_ASSISTANT_ID,
        phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
        customer: { number: number },
      }),
    });

    var data = await vapiRes.json().catch(function () {
      return {};
    });

    if (!vapiRes.ok) {
      // Log the detail server-side; don't leak provider internals to the page.
      console.error("Vapi " + vapiRes.status + ": " + JSON.stringify(data));
      return res
        .status(502)
        .json({ error: "Could not place the call. Please try again." });
    }

    return res.status(200).json({ ok: true, callId: data.id });
  } catch (err) {
    console.error("Call request failed", err);
    return res
      .status(502)
      .json({ error: "Could not place the call. Please try again." });
  }
};
