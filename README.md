# Cadence Education AI Support Demo Page

Single-page demo combining a Vapi voice bot and the chatQuartz chatbot, styled with
Cadence Education's brand.

## Brand reference

Palette lifted from cadence-education.com (Enfold theme variables):

| Token | Hex | Use |
| --- | --- | --- |
| `--green` | `#006a39` | Primary / buttons |
| `--green-dark` | `#004817` | Hero scrim, hover |
| `--green-light` | `#028548` | Button hover, gradient |
| `--navy` | `#293a8c` | Accent (logo birds) |
| `--sky` | `#7bb0e7` | Accent (logo birds) |
| `--leaf` | `#83a846` | Accent |

Typeface: **Lato** (same as the live site), loaded from Google Fonts.
Logo: `cadence-logo.png`, taken from the live site's header.

## How the voice agent works

The button starts an **in-browser web call** via the Vapi web SDK. `PUBLIC_KEY`
and `ASSISTANT_ID` sit at the top of `app.js`; both are client-side values by
design, and the page is behind the access gate in any case.

Vapi's own floating button is hidden (`.vapi-btn { display: none }`) so the
hero's "Click to Call" drives the call instead. The status pill tracks
`call-start`, `call-end` and `error`.

The assistant is **agent A** (`add0f8a4…`), which collects a callback number
and hands off to a phone call — see below.

## Callback to a phone call

Vapi supports call transfer on phone calls but not on web calls. To keep the
one-click web call while still allowing transfer, the web agent collects a
callback number during the conversation and hands off to a phone call.

**All of this lives in Vapi, not in this repo.** Agent A
(`add0f8a4…`, "Cadence Academy Agent A") has two tools attached:

| Tool | Type | Role |
| --- | --- | --- |
| `continue_on_phone_copy` | `code` | Takes `phoneNumber` and places the outbound PSTN call |
| `end_web_call_after_phone_handoff` | `endCall` | Ends the web call once the handoff succeeds |

Because `continue_on_phone_copy` is a Vapi-hosted `code` tool, Vapi places the
call itself. There is no webhook, no serverless function and no shared secret
on our side — the assistant has no `server.url` set, by design.

### Two earlier approaches, both in git history

Neither is in the working tree; both were superseded by the Vapi-hosted tool.

- **Visitor types their number** (commit `0a65363`) — an `api/call.js`
  serverless function placed the outbound call directly. A typed number is more
  accurate than a spoken one, but it replaced the one-click call with a form,
  and was reverted at the client's request.
- **Webhook capture** — an `/api/vapi-events` endpoint took the number from a
  `save_callback_number` tool and placed the call on the `end-of-call-report`
  webhook. It required exempting its path from the access gate, which the
  current design avoids entirely.

### Known limitation

Spoken digits are the weak point — ASR mangles phone numbers and web calls have
no DTMF fallback. Agent A's prompt should read the number back for confirmation
before handing off.

## Access gate

`middleware.js` is Vercel Edge Middleware that runs before any file is served,
so `index.html`, `app.js` and the demo itself never reach an unauthenticated
visitor. A client-side check could not do this — the files would already be on
their machine by the time it ran. It also covers `/api/call`, so the
outbound-calling endpoint can no longer be hit anonymously.

The session is a stateless `<expiry>.<hmac(expiry)>` token in an
`HttpOnly; Secure; SameSite=Lax` cookie (`cadence_session`), valid for one week.
There is no session store. Changing `AUTH_SECRET` revokes every active session.

`/login`, `/login.html`, `/style.css` and `/cadence-logo.png` are the only
unauthenticated paths — exactly what the sign-in screen needs to render.
`/logout` clears the cookie.

### Credentials

This is modelled on the `dataquartz-demos` gate, with one deliberate
difference: **there are no hardcoded credential defaults.** That project is not
a git repository, so its inline defaults never left the machine. This
repository is public on GitHub, where a committed password or signing secret
would be readable by anyone — revealing the password and allowing session
cookies to be forged. All three values must come from the environment:

| Variable | Meaning |
| --- | --- |
| `AUTH_USER` | Sign-in username |
| `AUTH_PASSWORD` | Sign-in password |
| `AUTH_SECRET` | HMAC key for the session cookie; never sent to the browser |

If any is missing the gate fails closed with a 503 naming what to set, rather
than serving the demo unprotected.

## Chatbot — outstanding

The chatQuartz `<script>` at the bottom of `index.html` still uses Edmentum's
account ID (`13202997`) as a placeholder. Replace it with the Cadence
chatQuartz account ID. The widget's colours and greeting come from that
account's own dashboard settings, not from this repo.

## Local development

```
npx serve .
```

Then open http://localhost:3000

## Deploy

Vercel — static files plus the `api/` serverless function.

```
vercel --prod
```

Pushes to `main` auto-deploy via the GitHub integration.
