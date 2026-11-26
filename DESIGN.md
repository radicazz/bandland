# Bandland design direction

Design read: an epic punk landing page for schmät, built for fans first. It looks like a photocopied zine: cream paper, black ink, hard red, torn paper, halftone band photos and a blackletter wordmark. Music comes first, then the latest release, the next show and tickets.

The public site and `/admin` share one theme; see "Admin" below.

## Colour tokens

All colour comes from CSS variables in `src/app/globals.css`. Components never hardcode colours. Raw tokens are also exposed as Tailwind colours (`bg-paper`, `text-ink`, `bg-red`, ...).

| Token        | Value     | Role                                          |
| ------------ | --------- | --------------------------------------------- |
| `--paper`    | `#f1e8d4` | Cream page background                         |
| `--paper-2`  | `#e6dbc2` | Darker paper: surfaces, tape, muted on red    |
| `--paper-3`  | `#d9ccb0` | Darkest paper: cards, fret wires              |
| `--ink`      | `#111010` | Black ink: text, rules, ink panels            |
| `--ink-2`    | `#3a3631` | Secondary text on paper                       |
| `--ink-3`    | `#5a544b` | Metadata text on paper                        |
| `--red`      | `#c0151c` | Punk red: panels, primary buttons, active nav |
| `--red-deep` | `#8e0f15` | Hover/pressed red                             |

Semantic aliases are what most components use, and the panel classes re-point them. On paper, `--bg` is paper, `--surface` is paper-2, `--surface-2` is paper-3, `--border` is a 30% ink mix, `--text` is ink, `--text-muted` is ink-2, `--text-dim` is ink-3, `--highlight` is red and `--focus` is ink.

### Contrast

These ratios are computed with the WCAG 2.x relative-luminance formula, not judged by eye.

| Foreground | Background | Ratio   | Grade                   |
| ---------- | ---------- | ------- | ----------------------- |
| ink        | paper      | 15.59:1 | AAA                     |
| paper      | ink        | 15.59:1 | AAA                     |
| paper      | red        | 5.12:1  | AA                      |
| red        | paper      | 5.12:1  | AA                      |
| red        | paper-2    | 4.54:1  | AA                      |
| ink        | paper-2    | 13.82:1 | AAA                     |
| ink        | paper-3    | 11.95:1 | AAA                     |
| ink-2      | paper      | 9.84:1  | AAA                     |
| ink-3      | paper      | 6.15:1  | AA                      |
| ink-3      | paper-2    | 5.45:1  | AA                      |
| paper-2    | red        | 4.54:1  | AA                      |
| paper-2    | ink        | 13.82:1 | AAA                     |
| paper-3    | ink        | 11.95:1 | AAA                     |
| paper      | red-deep   | 7.73:1  | AAA                     |
| red        | ink        | 3.04:1  | UI boundaries only (≥3) |

Rules that follow from the table:

- Text on red is paper or paper-2, never ink (ink/red is 3.04:1).
- Red text sits only on paper or paper-2, never on ink.
- A red button on an ink panel is fine, because it is a UI boundary (3.04:1) carrying paper text (5.12:1).
- Focus rings use `--focus`: ink on paper, paper on red and ink panels.

## Typography

- **Wordmark**: Grenze Gotisch blackletter (`.wordmark`, `--font-bandland-gothic`). Use it only for the band name, never for headings or body text.
- **Headlines**: Geist at weight 800 with tight tracking (`.headline`). `.headline-italic` adds a synthetic 10° oblique, because Geist has no italic. Headlines are for release titles and the show venue.
- **Kicker**: small tracked caps (`.kicker`, 0.3em tracking, 0.75rem), e.g. "RELEASE". In this design the kicker is the one allowed all-caps label. Keep it to one or two words.
- **Body**: Geist, sentence case.
- **Mono**: Geist Mono for technical content.
- Use tabular numbers for dates, times and prices.

## Zine kit (CSS/SVG only)

Everything lives in `globals.css` under "Zine kit". The kit uses no raster textures. Data URIs carry alpha only, so their colour comes from tokens. Nothing animates.

- `.paper-grain`: adds ink specks and mottling over the element's fill. Combines with the panels and torn shapes.
- `.panel-paper`, `.panel-red`, `.panel-ink`: a coloured block that re-points the semantic tokens, so `text-text`, `border-border` and focus rings stay correct inside it.
- `.torn-top`, `.torn-bottom`, `.torn-diag`: a torn edge on top, on the bottom, or a diagonal rip down the left. The tear is painted on a `::before` layer from `--fill`, so children and focus rings are not clipped.
  - Set the fill with a panel class or `--fill`, not `bg-*`.
  - Leave about 1rem of padding on the torn side.
- `.halftone` (and `.halftone-red`): goes on an image wrapper. It renders the image greyscale and punchy with an ink dot screen; the `-red` variant is a red/ink duotone.
- `.photo-frame` (with `.tilt-left`, `.tilt-right` or `.tilt-none`): goes on an image wrapper. It makes a taped, slightly rotated photo with a thin paper border. `--tilt` and `--tape-tilt` tune it.
- `.wordmark`: the blackletter band name at display size.
- `.headline`, `.headline-italic`: the big heavy sans headline, upright or oblique.
- `.kicker`: the tracked-caps label.
- `.btn-zine`, `.btn-zine-red`: square, hard-bordered buttons, either paper with ink or red with paper. They use raw tokens, so they look the same on any panel.
- `.fret-strip`: a decorative fretboard band. Render it as `<div aria-hidden="true" className="fret-strip" />`.

Pseudo-elements do not render on `<img>`, which is why `.halftone` and `.photo-frame` wrap the image.

## Photos

Use real band photos only, never generated imagery. `public/photos/` holds processed copies of `public/slideshow/*`: high-contrast black and white with a little halftone and grain, in wide and tall crops (plus a square guitar-and-bass crop). The originals stay untouched as the OG/Twitter images.

- `01-guitar-bass-{wide,tall,square}.webp`: guitarist and red-haired bassist, with the bass neck in front.
- `02-guitarist-{wide,tall}.webp`: headbanging guitarist, guitar in hand. This is the hero shot.
- `03-drummer-{wide,tall}.webp`: drummer singing at the kit.

The photos are already processed, so use them as they are, or inside `.photo-frame`. Add `.halftone` only to strengthen the dot screen, and `.halftone-red` for the red duotone.

## Decisions and reasons

- **One red**: red marks the action (Play, Tickets), the active language and the big release panel. Everything else is ink on paper, so the red still shouts.
- **Paper, not white**: cream paper with grain makes the photocopy read. Pure white would look like a template.
- **Square corners on zine elements**: torn paper and tape replace rounded cards. Admin cards, inputs and buttons are square too.
- **Torn edges and tilts are static**: they read as print and nothing moves, so reduced motion needs no special handling.
- **Socials**: shown as plain text names, because redrawn brand glyphs are never accurate.
- **Arrows**: `↗` on links that leave the site, `▶` on play, listen and ticket actions.
- **Voice**: short, concrete and bilingual (English and Afrikaans), with no marketing adjectives.

## Admin

`/admin` uses the same tokens as the public site, so it needs no theme scope of its own.

- It shares `.headline`, `.kicker`, `.btn-zine` and `.btn-zine-red`, plus `.panel` for cards.
- Form controls have a 2px ink border; an invalid one turns red.
- Active and selected states are solid red or ink with paper text. Do not tint behind red text: it drops the contrast below AA.
- No torn edges, tilts or halftone around forms.
