// Site-wide facts. Copy here is taken from the live site (athenoa.academy, October 2026).
export const site = {
  name: 'ATHENOA',
  // The live footer signs off in Greek capitals.
  copyright: '© ΑΘΕΝΟΑ ΑΚΑΔΗΜΙΑ',
  url: 'https://www.athenoa.com',
  locale: 'en',
  // "Who We Are" from the old footer. No longer shown there; kept for descriptions and machine-readable summaries.
  description:
    'ATHENOA is a Cultural Sanctuary which rekindles Ancient Hellenic Wisdom as a living path of self-realization, sacred education, and civic virtue.',
  mission:
    'Guided by the Archetype of Goddess Athena, we illuminate the way from intellectual learning to embodied knowing, from philosophy to inner awakening—restoring our relationship with Nature, with Soul, and with the World.',
  founder: 'Dr. Athena Despoina Potari',
  phone: { display: '(0030) 690-606-8444', href: 'tel:00306906068444' },
  emails: ['philathenea@athenoa.academy', 'philathenea@gmail.com'],
  membershipForm: 'https://docs.google.com/forms/d/10wWFfEJswGyhoiPyGHOc5QjUimHitGUBsbFaHlYpnvY/viewform',
  social: [
    { id: 'facebook', name: 'Facebook', url: 'https://www.facebook.com/athenapotari/' },
    { id: 'instagram', name: 'Instagram', url: 'https://www.instagram.com/athena_potari/' },
    { id: 'youtube', name: 'YouTube', url: 'https://www.youtube.com/@athenoa' },
  ],
  nav: [
    { label: 'Home', href: '/' },
    { label: 'About Dr. Athena Potari', href: '/about-athena/' },
    { label: 'Courses', href: '/courses/' },
  ],
  footer: {
    linksTitle: 'Internal Links',
    links: [
      { label: 'Home', href: '/' },
      { label: 'Learn more', href: '/about-athena/#contact' },
    ],
    connectTitle: 'Connect with us',
    contactFormLabel: 'Contact form',
    followTitle: 'Follow us',
  },
  routes: {
    contact: '/about-athena/#contact',
    courses: '/courses/',
  },
} as const;
