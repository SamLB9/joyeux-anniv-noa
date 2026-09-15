/* ============================================================
   content.js : LE SEUL FICHIER A MODIFIER.
   Tous les textes, la photo, la date et le numéro sont ici.
   ============================================================ */

const CONTENT = {

  you: "Sam",
  her: "Noa",              // son prénom. Vide = "Joyeux anniversaire !"
  phone: "972587819105",   // WhatsApp, format international, chiffres seulement

  /* musique : démarre quand elle ouvre le paquet (les navigateurs
     interdisent le son avant un premier tap). src: null = pas de musique */
  music: {
    src:       "assets/audio/white-keys.mp3",
    volume:    0.6,
    playLabel: "Mettre la musique",
    muteLabel: "Couper la musique"
  },

  /* le créneau déjà réservé (mois : 1 = janvier) */
  dinner: { year: 2026, month: 9, day: 19, hour: 21, minute: 15 },

  /* --- ECRAN 1 : le paquet ---------------------------------- */
  gift: {
    title:   "Joyeux anniversaire{herName} !",
    sub:     "20 ans, ça se fête en grand.",
    hints:   ["tape sur le cadeau", "encore", "plus fort", "voilà"],
    loading: "Chargement de ton cadeau… {pct} %",
    shy:     "Le cadeau est un peu timide…",
    ready:   "Ok, il est prêt."
  },

  /* --- ECRAN 2 : les cartes --------------------------------- */
  slides: [
    {
      photo:    "assets/photos/nous.jpg",
      focus:    "50% 32%",
      caption:  "Toi au volant, moi le bras sur ton siège. Petite précision, ce n'est pas de la tendresse, c'était pour m'accrocher avant ton créneau. 😂"
    },
    {
      headline: "Ce que j'ai failli t'offrir",
      list: [
        "Des cours à l'auto-école pour t'apprendre à faire des créneaux",
        "Une boussole pour améliorer ton sens de l'orientation",
        "Une arme pour te protéger lors de tes aprèms en Cisjordanie"
      ],
      caption:  "Tous rejetés par le comité, Sam."
    },
    {
      photo:    null,
      headline: "J'ai codé un site au lieu d'emballer un paquet",
      caption:  "Du papier cadeau, je n'en avais pas. Des soirées pour coder ça, apparemment si.",
      kicker:   "Le vrai cadeau est juste après."
    }
  ],
  next:     "Suivant",
  introCta: "voir mon cadeau",

  /* --- ECRAN 3 : la révélation ------------------------------ */
  reveal: {
    eyebrow: "ton cadeau",
    title:   "Bon pour un dîner",
    sub:     "au restaurant, avec {you}",
    rows: [
      { label: "Quand", value: "{day}" },
      { label: "Heure", value: "{time}" },
      { label: "Où",    value: "Secret. Tu le découvriras en arrivant." },
      { label: "Tenue", value: "Raisonnablement bien habillée. Pas besoin de sortir la robe de mariage." }
    ],
    note: "La table est déjà réservée et dans un resto casher bien\u00a0sûr\u00a0;)",
    cta:  "trop bien, et maintenant ?"
  },

  /* --- ECRAN 4 : le Non qui s'enfuit ------------------------ */
  ask: {
    photo:    "assets/photos/nous.jpg",
    focus:    "50% 30%",
    question: "C'est moi qui invite. Deal ?",
    yes:      "Deal",
    noLabels: [
      "Non, on partage",
      "moitié-moitié ?",
      "au moins le dessert ?",
      "le pourboire alors ?",
      "juste le café ?",
      "bon…"
    ],
    noGone: "Le bouton a compris, tu es invitée."
  },

  /* --- ECRAN 5 : le créneau --------------------------------- */
  slot: {
    title:   "Samedi {time}, t'es libre ?",
    sub:     "La table t'attend. Si ce soir-là ne va pas, on trouve un autre soir.",
    yes:     "Oui, j'y serai",
    no:      "Pas dispo ce soir-là"
  },

  /* --- ECRAN 6 : un autre soir ------------------------------ */
  pick: {
    title:       "Aucun souci.",
    sub:         "Choisis un autre soir, je négocie avec le resto. Même heure, {time}.",
    days:        14,
    shabbat:     "shabbat",
    /* Fêtes chômées en Israël (calculées, pas de mémoire). Le soir de la
       fête ET la veille au soir sont barrés, comme le vendredi pour shabbat. */
    holidays: {
      "2026-09-12": "Roch Hachana", "2026-09-13": "Roch Hachana",
      "2026-09-21": "Kippour",
      "2026-09-26": "Soukkot",
      "2026-10-03": "Simhat Torah",
      "2027-04-22": "Pessah", "2027-04-28": "Pessah",
      "2027-06-11": "Chavouot",
      "2027-10-02": "Roch Hachana", "2027-10-03": "Roch Hachana",
      "2027-10-11": "Kippour",
      "2027-10-16": "Soukkot",
      "2027-10-23": "Simhat Torah"
    },
    confirmLine: "{day}, {time}. Ça te va ?",
    confirmCta:  "Oui, ce soir-là",
    changeCta:   "un autre soir",
    back:        "ah si, samedi ça marche"
  },

  /* --- ECRAN 7 : confirmation ------------------------------- */
  done: {
    headline:     "C'est noté.",
    line:         "{day}, {time}.",
    captionSame:  "Rendez-vous samedi. Toi, tu n'as qu'à venir bien habillée et avec faim.",
    captionMoved: "Je m'occupe de déplacer la table. Toi, tu n'as qu'à venir bien habillée et avec faim.",
    countdownDays:  "plus que {d} j et {h} h",
    countdownHours: "plus que {h} h {m} min",
    countdownNow:   "c'est l'heure !",
    messageSame:  "Samedi {time}, j'y serai ❤️",
    messageMoved: "Samedi je ne peux pas, mais {dayLower} à {time} c'est parfait ❤️",
    whatsappCta:  "Envoyer ma réponse à {you}",
    calendarCta:  "ajouter à mon agenda",
    copyCta:      "copier le message",
    copyDone:     "copié",
    smsFallback:  "pas de WhatsApp ?",
    eventTitle:   "Dîner d'anniversaire avec {you}",
    eventNote:    "Lieu secret. Tenue : raisonnablement bien habillée.",
    durationHours: 2,
    footnote:     "Si WhatsApp ne s'est pas ouvert, appuie sur le bouton juste au-dessus."
  }
};
