export const locales = ["en", "af"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";
export const LOCALE_COOKIE = "bandland-locale";

export type Translations = {
  meta: {
    description: string;
  };
  nav: {
    explore: string;
    main: string;
    home: string;
    store: string;
    merch: string;
    live: string;
    shows: string;
    gallery: string;
    instagram: string;
    language: string;
    socials: string;
  };
  home: {
    pinned: string;
    releaseLabel: string;
    latestReleaseTitle: string;
    latestReleaseDescription: string;
    latestReleaseCta: string;
    nextShowLabel: string;
    nextShowFallbackTitle: string;
    nextShowFallbackDescription: string;
    ticketsCta: string;
    allShowsCta: string;
    upcomingListTitle: string;
    playerTabsLabel: string;
    playerSpotifyLabel: string;
    playerAppleLabel: string;
    playerLoadLabel: string;
    playerFallbackHint: string;
    storeFallbackLabel: string;
    storeFallbackDescription: string;
    storeLabel: string;
    storeTitle: string;
    storeDescription: string;
    storeCta: string;
    liveLabel: string;
    liveTitle: string;
    liveDescription: string;
    liveCta: string;
    timeFrameLabel: string;
  };
  shows: {
    label: string;
    title: string;
    upcomingTitle: string;
    pastTitle: string;
    introPrefix: string;
    introSuffix: string;
    empty: string;
    tickets: string;
    timeFrameLabel: string;
    ticketPriceGuideTitle: string;
    ticketPriceGuideOnline: string;
    ticketPriceGuideDoor: string;
    ticketPriceGuideFallbackNote: string;
    onlinePriceLabel: string;
    doorPriceLabel: string;
  };
  merch: {
    label: string;
    title: string;
    introPrefix: string;
    introSuffix: string;
    empty: string;
    view: string;
  };
  gallery: {
    label: string;
    title: string;
    intro: string;
    follow: string;
  };
  footer: {
    tagline: string;
  };
  common: {
    skipToContent: string;
  };
};

export const translations: Record<Locale, Translations> = {
  en: {
    meta: {
      description: "Official landing page. Music, shows, and merch coming soon.",
    },
    nav: {
      explore: "Explore",
      main: "Main",
      home: "Home",
      store: "Store",
      merch: "Merch",
      live: "Live",
      shows: "Shows",
      gallery: "Gallery",
      instagram: "Instagram",
      language: "Language",
      socials: "Socials",
    },
    home: {
      pinned: "Pinned",
      releaseLabel: "Release",
      latestReleaseTitle: "Newest release",
      latestReleaseDescription: "Listen to the newest drop.",
      latestReleaseCta: "Listen",
      nextShowLabel: "Next show",
      nextShowFallbackTitle: "No upcoming shows",
      nextShowFallbackDescription: "Nothing is locked in yet. Check the full schedule for past dates and new announcements.",
      ticketsCta: "Tickets",
      allShowsCta: "All shows",
      upcomingListTitle: "More dates",
      playerTabsLabel: "Player selection",
      playerSpotifyLabel: "Spotify",
      playerAppleLabel: "Apple Music",
      playerLoadLabel: "Load player",
      playerFallbackHint: "If the player does not load, use the Listen button above.",
      storeFallbackLabel: "Merch preview",
      storeFallbackDescription: "Live product imagery lands here when store visuals are available.",
      storeLabel: "Store",
      storeTitle: "Merch",
      storeDescription: "Limited runs and staples. New drops coming soon.",
      storeCta: "Shop merch",
      liveLabel: "Live",
      liveTitle: "Shows",
      liveDescription: "Upcoming dates, tickets, and venue details.",
      liveCta: "View shows",
      timeFrameLabel: "Time frame",
    },
    shows: {
      label: "Live",
      title: "Shows",
      upcomingTitle: "Upcoming",
      pastTitle: "Past dates",
      introPrefix: "Live dates and ticket links.",
      introSuffix: "",
      empty: "No dates announced yet.",
      tickets: "Tickets",
      timeFrameLabel: "Time frame",
      ticketPriceGuideTitle: "Ticket Price Guide",
      ticketPriceGuideOnline: "Online price",
      ticketPriceGuideDoor: "At-door price",
      ticketPriceGuideFallbackNote:
        "Shows may list one or both prices. If only a general price is available, it is shown without icons.",
      onlinePriceLabel: "Online",
      doorPriceLabel: "Door",
    },
    merch: {
      label: "Store",
      title: "Merch",
      introPrefix: "Featured items and store links.",
      introSuffix: "",
      empty: "Storefront coming soon.",
      view: "View",
    },
    gallery: {
      label: "Gallery",
      title: "Instagram",
      intro: "Latest posts and behind-the-scenes moments. Instagram embeds landing soon.",
      follow: "Follow on Instagram",
    },
    footer: {
      tagline: "Built for fast shows + fast pages.",
    },
    common: {
      skipToContent: "Skip to content",
    },
  },
  af: {
    meta: {
      description: "Amptelike landingsblad. Musiek, vertonings en merch kom binnekort.",
    },
    nav: {
      explore: "Verken",
      main: "Hoof",
      home: "Tuis",
      store: "Winkel",
      merch: "Merch",
      live: "Live",
      shows: "Vertonings",
      gallery: "Galerie",
      instagram: "Instagram",
      language: "Taal",
      socials: "Sosiaal",
    },
    home: {
      pinned: "Vasgepen",
      releaseLabel: "Vrystelling",
      latestReleaseTitle: "Nuutste vrystelling",
      latestReleaseDescription: "Luister na die nuutste vrystelling.",
      latestReleaseCta: "Luister",
      nextShowLabel: "Volgende vertoning",
      nextShowFallbackTitle: "Geen komende vertonings",
      nextShowFallbackDescription: "Niks is nog vas nie. Kyk na die volle rooster vir vorige datums en nuwe aankondigings.",
      ticketsCta: "Kaartjies",
      allShowsCta: "Alle vertonings",
      upcomingListTitle: "Meer datums",
      playerTabsLabel: "Spelerkeuse",
      playerSpotifyLabel: "Spotify",
      playerAppleLabel: "Apple Music",
      playerLoadLabel: "Laai speler",
      playerFallbackHint: "As die speler nie laai nie, gebruik die Luister-knoppie hier bo.",
      storeFallbackLabel: "Merch voorskou",
      storeFallbackDescription: "Produkbeelde verskyn hier sodra winkelvisuele beskikbaar is.",
      storeLabel: "Winkel",
      storeTitle: "Merch",
      storeDescription: "Klassieke items en beperkte lopies. Nuwe vrystellings kom binnekort.",
      storeCta: "Koop merch",
      liveLabel: "Live",
      liveTitle: "Vertonings",
      liveDescription: "Komende datums, kaartjies en lokaalbesonderhede.",
      liveCta: "Sien vertonings",
      timeFrameLabel: "Tydgleuf",
    },
    shows: {
      label: "Live",
      title: "Vertonings",
      upcomingTitle: "Komende",
      pastTitle: "Verlede datums",
      introPrefix: "Live datums en kaartjie-skakels.",
      introSuffix: "",
      empty: "Nog geen datums aangekondig nie.",
      tickets: "Kaartjies",
      timeFrameLabel: "Tydgleuf",
      ticketPriceGuideTitle: "Kaartjieprysgids",
      ticketPriceGuideOnline: "Aanlyn prys",
      ticketPriceGuideDoor: "By-die-deur prys",
      ticketPriceGuideFallbackNote:
        "Vertonings kan een of albei pryse wys. As net 'n algemene prys beskikbaar is, word dit sonder ikone gewys.",
      onlinePriceLabel: "Aanlyn",
      doorPriceLabel: "Deur",
    },
    merch: {
      label: "Winkel",
      title: "Merch",
      introPrefix: "Uitgeligte items en winkel-skakels.",
      introSuffix: "",
      empty: "Winkelblad kom binnekort.",
      view: "Bekyk",
    },
    gallery: {
      label: "Galerie",
      title: "Instagram",
      intro: "Nuutste plasings en agter-die-skerms oomblikke. Instagram-inbeddings kom binnekort.",
      follow: "Volg op Instagram",
    },
    footer: {
      tagline: "Gebou vir vinnige vertonings + vinnige bladsye.",
    },
    common: {
      skipToContent: "Spring na inhoud",
    },
  },
};

export function isLocale(value: string | undefined): value is Locale {
  return value === "en" || value === "af";
}
