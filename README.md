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

The button places an **outbound phone call**: the visitor enters their number,
and Vapi rings them. This replaced the original in-browser web call because
Vapi does not support call transfer on web calls, only on phone calls.

Outbound calls require Vapi's *private* key, which must never reach the
browser, so the request goes through a serverless function:

```
browser --POST /api/call--> api/call.js --POST api.vapi.ai/call--> Vapi --rings--> visitor
```

`api/call.js` normalises the number to E.164, rejects cross-origin requests,
applies a best-effort per-IP rate limit, and returns a generic error to the page
while logging provider detail server-side.

### Accepted number formats

Punctuation is stripped before validation, so all of these are equivalent:

```
(555) 123-4567     555 123 4567     555-123-4567
5551234567         1-555-123-4567
```

Bare 10-digit and 11-digit numbers are assumed US/Canada. **Anything outside
the US must be entered with a leading `+` and country code** (`+44 7700
900123`) — a bare `447700900123` is rejected, because it is indistinguishable
from a mistyped US number. The page states this under the form, and the
validation messages name the specific problem rather than repeating one generic
line. Client and server messages are kept identical.

### Environment variables

Set in Vercel (Project → Settings → Environment Variables). **Never commit
these.**

| Variable | Meaning |
| --- | --- |
| `VAPI_PRIVATE_KEY` | Vapi private API key |
| `VAPI_PHONE_NUMBER_ID` | Vapi number used as outbound caller ID |
| `VAPI_ASSISTANT_ID` | The Cadence assistant |

If any is missing the endpoint returns 500 and the page shows a failure state,
rather than half-working.

### Transfer

Call transfer is configured on the assistant in the Vapi dashboard (a
`transferCall` tool with its destination). Nothing in this repo controls it.

## Known limitation

Because the conversation happens on the visitor's phone, the browser receives no
call lifecycle events. The status pill therefore shows "Calling you now" and
resets after a few seconds; it cannot show live call state or an "End call"
control. Adding that would mean polling `GET /call/{id}` through a second
endpoint.

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
