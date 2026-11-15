# audit 001 follow-up (2026-11-15)

Approved: all 18. Result:

| # | Status | What changed |
|---|--------|--------------|
| 1 | fixed | Base-layer `cursor: pointer` for links, buttons, summary, select, label[for], role=button/tab/switch; `not-allowed` when disabled (`globals.css`) |
| 2 | kept by request | `info@bandland.com` placeholder left as is |
| 3 | fixed | Merch widget is a plain link tile, no `<nav>` landmark |
| 4 | corrected | Menu was already `inert` + `aria-hidden` when closed, so the finding was a false alarm. Removed the redundant `tabIndex` toggling; test now asserts `inert` |
| 5 | fixed | `DESIGN.md` with Design Read and dials ENERGY 2 / RHYTHM 2 / MOTION 1 |
| 6 | fixed | Next show is a tall stub, release is embed-first, merch is a plain link |
| 7 | fixed | Identity motif: ticket stub (`.ticket`, `.perforation`), big tabular date on the home next-show |
| 8 | fixed | Duplicate kickers removed (Shows, Merch, Release); "Next show" kept and neutral |
| 9 | fixed | Decorative `→` removed; `↗` only on external links |
| 10 | fixed | Price note, release blurb, merch intro rewritten; merch CTA is Buy / Koop (EN and AF) |
| 11 | verified | Token pairs pass AA (a1a1a1 on 0f0f10 7.42, 060606 on e36b6b 6.35, c2c2c2 on 1a1b1d 9.68). Estimated text contrast over the hero photos with overlay is about 12:1 or better. Build, typecheck, lint, 69 tests pass; `/`, `/shows`, `/merch` return 200 |
| 12 | fixed | Blur only on the sticky header |
| 13 | fixed | Red removed from prices, month labels, price icons, kickers, footer underline |
| 14 | fixed | Social links are text names (footer, mobile menu, header at xl) instead of redrawn glyphs |
| 15 | fixed | Two radius tokens: `rounded-control`, `rounded-card`; pill only for status |
| 16 | fixed | Type reasons in `DESIGN.md` |
| 17 | fixed | Empty `gallery/` and unused gallery strings removed |
| 18 | fixed | Decisions and reasons in `DESIGN.md` |

Not verified: a visual check in a real browser at 320px and the hero slideshow in motion. The header social links only show at xl and above.
