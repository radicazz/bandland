export const site = {
  name: "schmät",
  description: "Official landing page. Music, shows, and merch coming soon.",
  latestRelease: {
    href: "https://tr.ee/7KaRvTpbLN",
    spotifyEmbedUrl:
      "https://open.spotify.com/embed/track/1ZqBftZCkFF0YOmYaQ7v2c?utm_source=generator&theme=0",
    appleEmbedUrl:
      "https://embed.music.apple.com/za/album/pappa-soek-n-porsche-single/1866600943?i=1866600944&theme=dark",
  },

  // Add your booking/press contact email here
  contactEmail: "info@bandland.com",

  // Social media links - set href to null or remove entries you don't need
  socials: [
    { label: "Instagram", href: "https://www.instagram.com/schmatorkes/" },
    { label: "Spotify", href: "https://open.spotify.com/artist/6RLhhMPYSX1pCcFUijZi42" },
    { label: "Apple Music", href: "https://music.apple.com/za/artist/schm%C3%A4t/1800555464" },
    { label: "Linktree", href: "https://linktr.ee/Schmat" },
  ],
} as const;
