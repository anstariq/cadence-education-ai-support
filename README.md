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

## Setup — remaining TODOs

1. **Voice agent.** Open `app.js` and replace `ASSISTANT_ID` with the Cadence
   Vapi assistant ID (Vapi dashboard → Assistants → select → copy ID).
   `PUBLIC_KEY` is the shared account-level key and does not need changing.
   Until `ASSISTANT_ID` is replaced, the call button renders disabled with an
   "Assistant not configured" status instead of erroring.

2. **Chatbot.** Open `index.html`, find the commented-out chatQuartz block near
   the bottom, replace `YOUR_CHATQUARTZ_ACCOUNT_ID` with the Cadence account ID,
   and uncomment the `<script>` tag.

## Local development

```
npx serve .
```

Then open http://localhost:3000

## Deploy

Static site on Vercel — no build step (`vercel.json` sets `outputDirectory: "."`).

```
vercel --prod
```
