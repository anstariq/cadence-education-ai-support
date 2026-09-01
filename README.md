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

## Configuration

**Voice agent — done.** `ASSISTANT_ID` in `app.js` points at the Cadence
assistant, and `PUBLIC_KEY` is the account-level key for the same Vapi org, so
the two are a valid pair. Nothing further is required.

**Chatbot — outstanding.** The chatQuartz `<script>` at the bottom of
`index.html` still uses Edmentum's account ID (`13202997`) as a placeholder.
Replace it with the Cadence chatQuartz account ID. Note the widget's colours and
greeting come from that account's own dashboard settings, not from this repo.

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
