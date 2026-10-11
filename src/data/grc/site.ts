// A playful DRAFT translation into Ancient Greek (Attic prose) of src/data/site.ts, made by machine.
// To be reviewed by Athena before anything is published.
export const site = {
  name: 'ATHENOA',
  // The live footer signs off in Greek capitals. Left as it is.
  copyright: '© ΑΘΕΝΟΑ ΑΚΑΔΗΜΙΑ',
  url: 'https://www.athenoa.com',
  locale: 'grc',
  // "Who We Are" from the old footer. No longer shown there; kept for descriptions and machine-readable summaries.
  description:
    'Ἡ ATHENOA Μουσῶν τέμενός ἐστιν, ὃ τὴν παλαιὰν τῶν Ἑλλήνων σοφίαν ἀναζωπυρεῖ ὡς ὁδὸν ζῶσαν ἐπὶ τὸ γενέσθαι ἕκαστον οἷός ἐστι καὶ ἐπὶ παιδείαν ἱερὰν καὶ πολιτικὴν ἀρετήν.',
  mission:
    'Ἡγεμόνι χρώμενοι τῷ τῆς θεοῦ Ἀθηνᾶς ἀρχετύπῳ, φῶς παρέχομεν τῇ ὁδῷ τῇ φερούσῃ ἀπὸ μὲν τῆς λόγῳ μαθήσεως ἐπὶ τὴν ἔργῳ γνῶσιν, ἀπὸ δὲ φιλοσοφίας ἐπὶ τὴν ἔνδον ἐγρήγορσιν — τὴν ἡμετέραν πρὸς τὴν Φύσιν καὶ τὴν Ψυχὴν καὶ τὸν Κόσμον οἰκειότητα ἀνανεούμενοι.',
  // No "Dr." here: the title is rendered in running text as ἡ διδάσκαλος (see nav and ./about.ts).
  // The first word must stay a substring of about.title, which AboutHero splits at it.
  founder: 'Ἀθηνᾶ Δέσποινα Ποτάρη',
  phone: { display: '(0030) 690-606-8444', href: 'tel:00306906068444' },
  emails: ['philathenea@athenoa.academy', 'philathenea@gmail.com'],
  membershipForm: 'https://docs.google.com/forms/d/10wWFfEJswGyhoiPyGHOc5QjUimHitGUBsbFaHlYpnvY/viewform',
  social: [
    { id: 'facebook', name: 'Facebook', url: 'https://www.facebook.com/athenapotari/' },
    { id: 'instagram', name: 'Instagram', url: 'https://www.instagram.com/athena_potari/' },
    { id: 'youtube', name: 'YouTube', url: 'https://www.youtube.com/@athenoa' },
  ],
  // Home, by name. The logo links here, so the header menu does not repeat it.
  home: { label: 'Οἴκαδε', href: '/grc/' },
  nav: [
    { label: 'Περὶ τῆς διδασκάλου Ἀθηνᾶς', href: '/grc/about-athena/' },
    { label: 'Μαθήματα', href: '/grc/courses/' },
  ],
  footer: {
    linksTitle: 'Οἱ ἔνδον σύνδεσμοι',
    links: [
      { label: 'Οἴκαδε', href: '/grc/' },
      { label: 'Μάθετε πλείω', href: '/grc/about-athena/#contact' },
    ],
    connectTitle: 'Διαλέγεσθε ἡμῖν',
    contactFormLabel: 'Γράψατε ἡμῖν ἐνταῦθα',
    followTitle: 'Ἕπεσθε ἡμῖν',
  },
  routes: {
    contact: '/grc/about-athena/#contact',
    courses: '/grc/courses/',
  },
} as const;
