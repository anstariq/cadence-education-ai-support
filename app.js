// The call button posts to /api/call, which places an outbound Vapi phone call
// to the number the visitor entered. Outbound calls need Vapi's private key, so
// the request has to go through the serverless function rather than the browser.
//
// Note: unlike the previous web-call setup, the browser gets no call lifecycle
// events here — once Vapi accepts the request, the conversation happens
// entirely on the visitor's phone.

var form = document.getElementById("call-form");
var phoneInput = document.getElementById("phone");
var callBtn = document.getElementById("call-btn");
var btnLabel = document.getElementById("call-btn-label");
var btnIcon = callBtn.querySelector(".btn__icon");
var statusDot = document.getElementById("status-dot");
var statusLbl = document.getElementById("status-label");
var errorEl = document.getElementById("call-error");

var RESET_DELAY_MS = 8000;
var resetTimer = null;

function setStatus(modifier, label) {
  statusDot.className = "status-pill__dot";
  if (modifier) statusDot.classList.add("status-pill__dot--" + modifier);
  statusLbl.textContent = label;
}

function showError(message) {
  errorEl.textContent = message;
  errorEl.hidden = false;
}

function clearError() {
  errorEl.textContent = "";
  errorEl.hidden = true;
}

function setIdle() {
  callBtn.disabled = false;
  phoneInput.disabled = false;
  btnLabel.textContent = "Call Me";
  btnIcon.textContent = "📞";
  setStatus("", "Ready to connect");
}

function setRequesting() {
  callBtn.disabled = true;
  phoneInput.disabled = true;
  btnLabel.textContent = "Calling…";
  btnIcon.textContent = "⏳";
  setStatus("connecting", "Requesting your call…");
}

function setPlaced() {
  callBtn.disabled = true;
  phoneInput.disabled = true;
  btnLabel.textContent = "Call on its way";
  btnIcon.textContent = "✅";
  setStatus("active", "Calling you now — please pick up");
  resetTimer = setTimeout(setIdle, RESET_DELAY_MS);
}

function setFailed(message) {
  callBtn.disabled = false;
  phoneInput.disabled = false;
  btnLabel.textContent = "Call Me";
  btnIcon.textContent = "📞";
  setStatus("error", "Could not connect");
  showError(message);
  resetTimer = setTimeout(function () {
    setStatus("", "Ready to connect");
  }, RESET_DELAY_MS);
}

// Mirrors the server's rules so obvious mistakes are caught before a round
// trip. The server validates again — this is convenience, not security.
// Punctuation is stripped, so dashes, spaces and brackets are all accepted.
// Returns null when the number is usable, otherwise the message to show.
function validateNumber(raw) {
  var trimmed = raw.trim();
  var digits = trimmed.replace(/[^\d]/g, "");

  if (!digits) return "Enter your phone number so we can call you back.";

  if (trimmed.charAt(0) === "+") {
    return digits.length >= 8 && digits.length <= 15
      ? null
      : "That country code and number don't look right. Check the digits after the +.";
  }
  if (digits.length === 10) return null;
  if (digits.length === 11 && digits.charAt(0) === "1") return null;
  if (digits.length > 11) {
    return "For numbers outside the US, start with + and your country code — e.g. +44 7700 900123.";
  }
  return "Enter a valid 10-digit US number, including area code.";
}

form.addEventListener("submit", async function (event) {
  event.preventDefault();
  clearError();
  if (resetTimer) clearTimeout(resetTimer);

  var number = phoneInput.value;
  var problem = validateNumber(number);
  if (problem) {
    showError(problem);
    phoneInput.focus();
    return;
  }

  setRequesting();

  try {
    var res = await fetch("/api/call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number: number }),
    });
    var data = await res.json().catch(function () {
      return {};
    });

    if (!res.ok) {
      setFailed(data.error || "Could not place the call. Please try again.");
      return;
    }
    setPlaced();
  } catch (err) {
    setFailed("Network error. Please check your connection and try again.");
  }
});

phoneInput.addEventListener("input", clearError);
