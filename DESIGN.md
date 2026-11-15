# Bandland design direction

Design Read: band landing for fans and bookers, dark monochrome with one red accent, dial ENERGY 2 / RHYTHM 2 / MOTION 1.

Dial: ENERGY 2 / RHYTHM 2 / MOTION 1

## Decisions and reasons

- **Colour**: near-black neutrals plus one muted red (`--highlight`). The photos carry the colour; red is reserved for the primary action, the active nav state and the "Next show" flag, so it still signals something.
- **Type**: Grenze Gotisch for the wordmark only, because the blackletter is the band's mark. Geist for everything else as a neutral foil that stays out of the way of that wordmark and of the Afrikaans copy.
- **Identity motif: the ticket stub.** Gigs are the product, so the date block and a dashed perforation with side notches (`.ticket`, `.perforation` in `globals.css`) are the one repeated gesture. The next show is a literal stub: date, then perforation, then the tear-off with the ticket button. Show cards reuse the same date block.
- **Rhythm**: below the hero, the next show is a tall stub with a big date, the release is an embed-first panel, and merch is a single plain link. Different weight on purpose, because the show is the primary action.
- **Panels**: flat surfaces with a 1px border, no shadows, to keep the page sober. Shadow only on the mobile menu, as an elevation marker.
- **Radius**: two steps, `rounded-control` (buttons, inputs, tiles) and `rounded-card` (panels, menus). Pills are only for status (merch "New" / "Sold out").
- **Links to socials**: plain text names, because redrawn brand glyphs are never accurate and the names are what people recognise.
- **Arrows**: `↗` only on links that leave the site.
- **Blur**: only on the sticky header, so content scrolls under it legibly.
- **Motion**: slow hero crossfade with a pause control; everything else is colour transitions. Reduced motion is honoured globally.
- **Voice**: short, concrete, bilingual (English and Afrikaans), no marketing adjectives.
