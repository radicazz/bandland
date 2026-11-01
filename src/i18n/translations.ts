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
    liveLabel: string;
    liveTitle: string;
    liveDescription: string;
    liveCta: string;
    timeFrameLabel: string;
    slideshow: { pause: string; resume: string };
  };
  shows: {
    label: string;
    title: string;
    upcomingTitle: string;
    pastTitle: string;
    pastShow: string;
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
    nextShowBadge: string;
    addToCalendar: string;
    showOlder: string;
  };
  merch: {
    label: string;
    title: string;
    introPrefix: string;
    introSuffix: string;
    empty: string;
    view: string;
    badgeNew: string;
    badgeSoldOut: string;
  };
  gallery: {
    label: string;
    title: string;
    intro: string;
    follow: string;
  };
  footer: {
    tagline: string;
    booking: string;
  };
  common: {
    skipToContent: string;
    openMenu: string;
    closeMenu: string;
    opensInNewTab: string;
  };
  errors: {
    general: { title: string; description: string };
    shows: { title: string; description: string };
    merch: { title: string; description: string };
    retry: string;
    home: string;
    reference: string;
  };
};

export const translations: Record<Locale, Translations> = {
  en: {
    meta: {
      description: "Music, live shows, and merch from Schmät.",
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
      nextShowFallbackDescription:
        "Nothing is locked in yet. Check the full schedule for past dates and new announcements.",
      ticketsCta: "Tickets",
      allShowsCta: "All shows",
      liveLabel: "Live",
      liveTitle: "Shows",
      liveDescription: "Upcoming dates, tickets, and venue details.",
      liveCta: "View shows",
      timeFrameLabel: "Time frame",
      slideshow: { pause: "Pause photos", resume: "Resume photos" },
    },
    shows: {
      label: "Live",
      title: "Shows",
      upcomingTitle: "Upcoming",
      pastTitle: "Past dates",
      pastShow: "Past show",
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
      nextShowBadge: "Next show",
      addToCalendar: "Add to calendar",
      showOlder: "Show older shows ({count})",
    },
    merch: {
      label: "Store",
      title: "Merch",
      introPrefix: "Featured items and store links.",
      introSuffix: "",
      empty: "Storefront coming soon.",
      view: "View",
      badgeNew: "New",
      badgeSoldOut: "Sold out",
    },
    gallery: {
      label: "Gallery",
      title: "Instagram",
      intro: "Latest posts and behind-the-scenes moments. Instagram embeds landing soon.",
      follow: "Follow on Instagram",
    },
    footer: {
      tagline: "Loud guitars. Afrikaans lyrics. Skollie spirit.",
      booking: "Booking & press",
    },
    common: {
      skipToContent: "Skip to content",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      opensInNewTab: "opens in a new tab",
    },
    errors: {
      general: {
        title: "Something went wrong",
        description: "An unexpected error occurred. Please try again.",
      },
      shows: {
        title: "Error loading shows",
        description: "We could not load the shows. Please try again.",
      },
      merch: {
        title: "Error loading merch",
        description: "We could not load the merchandise. Please try again.",
      },
      retry: "Try again",
      home: "Go home",
      reference: "Error ID",
    },
  },
  af: {
    meta: {
      description: "Musiek, live vertonings en merch van Schmät.",
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
      nextShowFallbackDescription:
        "Niks is nog vas nie. Kyk na die volle rooster vir vorige datums en nuwe aankondigings.",
      ticketsCta: "Kaartjies",
      allShowsCta: "Alle vertonings",
      liveLabel: "Live",
      liveTitle: "Vertonings",
      liveDescription: "Komende datums, kaartjies en lokaalbesonderhede.",
      liveCta: "Sien vertonings",
      timeFrameLabel: "Tydgleuf",
      slideshow: { pause: "Onderbreek foto's", resume: "Hervat foto's" },
    },
    shows: {
      label: "Live",
      title: "Vertonings",
      upcomingTitle: "Komende",
      pastTitle: "Verlede datums",
      pastShow: "Vorige vertoning",
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
      nextShowBadge: "Volgende vertoning",
      addToCalendar: "Voeg by kalender",
      showOlder: "Wys ouer vertonings ({count})",
    },
    merch: {
      label: "Winkel",
      title: "Merch",
      introPrefix: "Uitgeligte items en winkel-skakels.",
      introSuffix: "",
      empty: "Winkelblad kom binnekort.",
      view: "Bekyk",
      badgeNew: "Nuut",
      badgeSoldOut: "Uitverkoop",
    },
    gallery: {
      label: "Galerie",
      title: "Instagram",
      intro: "Nuutste plasings en agter-die-skerms oomblikke. Instagram-inbeddings kom binnekort.",
      follow: "Volg op Instagram",
    },
    footer: {
      tagline: "Harde kitare. Afrikaanse lirieke. Skollie-gees.",
      booking: "Besprekings & pers",
    },
    common: {
      skipToContent: "Spring na inhoud",
      openMenu: "Maak kieslys oop",
      closeMenu: "Maak kieslys toe",
      opensInNewTab: "maak in 'n nuwe oortjie oop",
    },
    errors: {
      general: {
        title: "Iets het verkeerd geloop",
        description: "'n Onverwagte fout het voorgekom. Probeer asseblief weer.",
      },
      shows: {
        title: "Kon nie vertonings laai nie",
        description: "Ons kon nie die vertonings laai nie. Probeer asseblief weer.",
      },
      merch: {
        title: "Kon nie merch laai nie",
        description: "Ons kon nie die merch laai nie. Probeer asseblief weer.",
      },
      retry: "Probeer weer",
      home: "Gaan tuis",
      reference: "Fout-ID",
    },
  },
};

export function isLocale(value: string | undefined): value is Locale {
  return value === "en" || value === "af";
}
