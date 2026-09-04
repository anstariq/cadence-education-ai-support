# Cadence Education AI Support Demo Page

Single-page demo combining a Vapi voice bot and the chatQuartz chatbot, styled with
Cadence Education's brand.

## Brand reference

The theme replicates cadence-education.com. Every value below was read from
that site's computed styles rather than approximated by eye, so the two should
line up when compared side by side.

| Element | Value |
| --- | --- |
| Utility bar | `#2b6a39`, 36px tall, white 14px/700 |
| Header | White, sticky, logo 175x52 |
| Nav links | Lato 13px/600, `#808080`, uppercase |
| CONTACT button | `#1c2388`, white 16px/600, padding 16px 18px, radius 2px |
| Hero headline | Lato 60px/800, line-height 72px, white |
| Hero subtitle | 32px/500, white |
| Content width | 1170px, giving a 135px inset at 1440px viewport |
| Body | Lato, `#444444` |
| Socket | `#006a39` with `#f3ffde` text |

Assets taken from the live site: `cadence-academy-logo.png` (the header logo,
"Cadence Academy Preschool") and `hero.jpg` (`MON_51277-Edited`, its hero
photograph). Both are served locally rather than hot-linked.

### Page sections

The home page mirrors the reference's running order so it scrolls like the real
site: hero → mission statement → Our Programs → Our Promise → Preparing Your
Child to THRIVE → Latest Blog Posts → socket. Roughly three viewports tall.

All copy is the client's own, taken from the live page — the mission statement,
the four promise blocks, the THRIVE paragraph and the blog headlines. The eight
programme cards use their real photographs, and the THRIVE band uses the
theme's own `green-pattern.png`. Everything sits in `img/` (208 KB total) and is
served locally rather than hot-linked.

Links inside these sections are inert, as in the nav: this is a single-page
demo, and the sections exist to make it feel like the real site while the call
button stays the only working control.

Two deliberate departures, both to serve content the reference page does not
have:

- **A left-weighted scrim over the hero.** The live site sets its headline
  straight onto the photo, which works at 60px but not for our 17px body copy,
  button and status line. The gradient clears by the right-hand third so the
  photograph still reads.
- **Navigation links are inert** (`href="#"`). This is a single-page demo, so
  they carry the look without navigating away from it.

`cadence-logo.png` (the older "Cadence Education" wordmark) is no longer
referenced by any page, but is kept in case the Education branding is wanted
back.

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

`/login`, `/login.html`, `/style.css`, `/cadence-academy-logo.png` and
`/hero.jpg` are the only
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
