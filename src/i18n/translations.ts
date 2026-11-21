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
    language: string;
    socials: string;
  };
  home: {
    pinned: string;
    latestReleaseTitle: string;
    latestReleaseDescription: string;
    latestReleaseCta: string;
    nextShowLabel: string;
    nextShowFallbackTitle: string;
    nextShowFallbackDescription: string;
    allShowsCta: string;
    liveLabel: string;
    liveTitle: string;
    liveDescription: string;
    liveCta: string;
    timeFrameLabel: string;
    journey: {
      play: string;
      pause: string;
      /** Status line under Play; `{track}` is the song title. */
      trackIdle: string;
      trackLoading: string;
      trackPlaying: string;
      trackError: string;
      playHint: string;
      neckTitle: string;
      bodyTitle: string;
      outroTitle: string;
      outroKicker: string;
    };
  };
  shows: {
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
    hideOlder: string;
  };
  merch: {
    title: string;
    introPrefix: string;
    introSuffix: string;
    empty: string;
    view: string;
    badgeNew: string;
    badgeSoldOut: string;
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
  player: {
    region: string;
    play: string;
    pause: string;
    mute: string;
    unmute: string;
    volume: string;
    seek: string;
    close: string;
    /** "{current}" and "{total}" are replaced with formatted times. */
    position: string;
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
      language: "Language",
      socials: "Socials",
    },
    home: {
      pinned: "Pinned",
      latestReleaseTitle: "Newest release",
      latestReleaseDescription: "Out now.",
      latestReleaseCta: "Listen",
      nextShowLabel: "Next show",
      nextShowFallbackTitle: "No upcoming shows",
      nextShowFallbackDescription:
        "Nothing is locked in yet. Check the full schedule for past dates and new announcements.",
      allShowsCta: "All shows",
      liveLabel: "Live",
      liveTitle: "Shows",
      liveDescription: "Upcoming dates, tickets, and venue details.",
      liveCta: "View shows",
      timeFrameLabel: "Time frame",
      journey: {
        play: "Play",
        pause: "Pause",
        trackIdle: "Song: {track}",
        trackLoading: "Loading {track}…",
        trackPlaying: "Now playing: {track}",
        trackError: "{track} didn't load. Press play to try again.",
        playHint: "Scroll down to follow the guitar from headstock to body.",
        neckTitle: "Up the neck",
        bodyTitle: "Into the body",
        outroTitle: "Hear it live",
        outroKicker: "Encore",
      },
    },
    shows: {
      title: "Shows",
      upcomingTitle: "Upcoming",
      pastTitle: "Past dates",
      pastShow: "Past show",
      introPrefix: "Live dates and ticket links.",
      introSuffix: "",
      empty: "No dates announced yet.",
      tickets: "Tickets",
      timeFrameLabel: "Time frame",
      ticketPriceGuideTitle: "Ticket prices",
      ticketPriceGuideOnline: "Online price",
      ticketPriceGuideDoor: "At-door price",
      ticketPriceGuideFallbackNote: "Prices are per show. Online and door prices can differ.",
      onlinePriceLabel: "Online",
      doorPriceLabel: "Door",
      nextShowBadge: "Next show",
      addToCalendar: "Add to calendar",
      showOlder: "Show older shows ({count})",
      hideOlder: "Hide older shows",
    },
    merch: {
      title: "Merch",
      introPrefix: "Merch from the band. Orders go through the store.",
      introSuffix: "",
      empty: "Storefront coming soon.",
      view: "Buy",
      badgeNew: "New",
      badgeSoldOut: "Sold out",
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
    player: {
      region: "Music player",
      play: "Play",
      pause: "Pause",
      mute: "Mute",
      unmute: "Unmute",
      volume: "Volume",
      seek: "Seek",
      close: "Close player",
      position: "{current} of {total}",
    },
    errors: {
      general: {
        title: "This page didn't load",
        description: "Something broke on our side. Try again, or head back to the home page.",
      },
      shows: {
        title: "The shows didn't load",
        description: "We couldn't reach the show list. Try again in a moment.",
      },
      merch: {
        title: "The merch didn't load",
        description: "We couldn't reach the merch list. Try again in a moment.",
      },
      retry: "Try again",
      home: "Back to home",
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
      language: "Taal",
      socials: "Sosiaal",
    },
    home: {
      pinned: "Vasgepen",
      latestReleaseTitle: "Nuutste vrystelling",
      latestReleaseDescription: "Nou beskikbaar.",
      latestReleaseCta: "Luister",
      nextShowLabel: "Volgende vertoning",
      nextShowFallbackTitle: "Geen komende vertonings",
      nextShowFallbackDescription:
        "Niks is nog vas nie. Kyk na die volle rooster vir vorige datums en nuwe aankondigings.",
      allShowsCta: "Alle vertonings",
      liveLabel: "Live",
      liveTitle: "Vertonings",
      liveDescription: "Komende datums, kaartjies en lokaalbesonderhede.",
      liveCta: "Sien vertonings",
      timeFrameLabel: "Tydgleuf",
      journey: {
        play: "Speel",
        pause: "Onderbreek",
        trackIdle: "Liedjie: {track}",
        trackLoading: "Laai {track}…",
        trackPlaying: "Speel nou: {track}",
        trackError: "{track} wou nie laai nie. Druk speel om weer te probeer.",
        playHint: "Rol af om die kitaar van kop tot lyf te volg.",
        neckTitle: "Teen die nek op",
        bodyTitle: "In die kitaarlyf",
        outroTitle: "Hoor dit regstreeks",
        outroKicker: "Toegif",
      },
    },
    shows: {
      title: "Vertonings",
      upcomingTitle: "Komende",
      pastTitle: "Verlede datums",
      pastShow: "Vorige vertoning",
      introPrefix: "Live datums en kaartjie-skakels.",
      introSuffix: "",
      empty: "Nog geen datums aangekondig nie.",
      tickets: "Kaartjies",
      timeFrameLabel: "Tydgleuf",
      ticketPriceGuideTitle: "Kaartjiepryse",
      ticketPriceGuideOnline: "Aanlyn prys",
      ticketPriceGuideDoor: "By-die-deur prys",
      ticketPriceGuideFallbackNote:
        "Pryse verskil per vertoning. Aanlyn- en deurpryse kan verskil.",
      onlinePriceLabel: "Aanlyn",
      doorPriceLabel: "Deur",
      nextShowBadge: "Volgende vertoning",
      addToCalendar: "Voeg by kalender",
      showOlder: "Wys ouer vertonings ({count})",
      hideOlder: "Versteek ouer vertonings",
    },
    merch: {
      title: "Merch",
      introPrefix: "Merch van die orkes. Bestellings gaan deur die winkel.",
      introSuffix: "",
      empty: "Winkelblad kom binnekort.",
      view: "Koop",
      badgeNew: "Nuut",
      badgeSoldOut: "Uitverkoop",
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
    player: {
      region: "Musiekspeler",
      play: "Speel",
      pause: "Pouse",
      mute: "Demp",
      unmute: "Ontdemp",
      volume: "Volume",
      seek: "Soek",
      close: "Maak speler toe",
      position: "{current} van {total}",
    },
    errors: {
      general: {
        title: "Hierdie bladsy het nie gelaai nie",
        description: "Iets het aan ons kant gebreek. Probeer weer, of gaan terug na die tuisblad.",
      },
      shows: {
        title: "Die vertonings het nie gelaai nie",
        description: "Ons kon nie die vertoningslys bereik nie. Probeer weer oor 'n oomblik.",
      },
      merch: {
        title: "Die merch het nie gelaai nie",
        description: "Ons kon nie die merch-lys bereik nie. Probeer weer oor 'n oomblik.",
      },
      retry: "Probeer weer",
      home: "Terug na tuis",
      reference: "Fout-ID",
    },
  },
};

export function isLocale(value: string | undefined): value is Locale {
  return value === "en" || value === "af";
}
