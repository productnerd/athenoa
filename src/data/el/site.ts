// DRAFT machine translation (English to Greek) of src/data/site.ts, for layout and typeface testing only.
// To be reviewed by Athena before any of it is published.
export const site = {
  name: 'ATHENOA',
  // The live footer signs off in Greek capitals.
  copyright: '© ΑΘΕΝΟΑ ΑΚΑΔΗΜΙΑ',
  url: 'https://www.athenoa.com',
  locale: 'el',
  // "Who We Are" from the old footer. No longer shown there; kept for descriptions and machine-readable summaries.
  description:
    'Η ATHENOA είναι ένα Τέμενος Πολιτισμού που αναζωπυρώνει την Αρχαία Ελληνική Σοφία ως ζωντανό δρόμο αυτοπραγμάτωσης, ιερής παιδείας και πολιτικής αρετής.',
  mission:
    'Με οδηγό το Αρχέτυπο της Θεάς Αθηνάς, φωτίζουμε τον δρόμο από τη διανοητική μάθηση στην ενσώματη γνώση, από τη φιλοσοφία στην εσωτερική αφύπνιση — αποκαθιστώντας τη σχέση μας με τη Φύση, με την Ψυχή και με τον Κόσμο.',
  founder: 'Δρ. Αθηνά Δέσποινα Ποτάρη',
  phone: { display: '(0030) 690-606-8444', href: 'tel:00306906068444' },
  emails: ['philathenea@athenoa.academy', 'philathenea@gmail.com'],
  membershipForm: 'https://docs.google.com/forms/d/10wWFfEJswGyhoiPyGHOc5QjUimHitGUBsbFaHlYpnvY/viewform',
  social: [
    { id: 'facebook', name: 'Facebook', url: 'https://www.facebook.com/athenapotari/' },
    { id: 'instagram', name: 'Instagram', url: 'https://www.instagram.com/athena_potari/' },
    { id: 'youtube', name: 'YouTube', url: 'https://www.youtube.com/@athenoa' },
  ],
  // The logo links home, so the header menu does not repeat it.
  nav: [
    { label: 'Σχετικά με τη Δρ. Αθηνά', href: '/el/about-athena/' },
    { label: 'Μαθήματα', href: '/el/courses/' },
  ],
  footer: {
    linksTitle: 'Εσωτερικοί Σύνδεσμοι',
    links: [
      { label: 'Αρχική', href: '/el/' },
      { label: 'Μάθετε περισσότερα', href: '/el/about-athena/#contact' },
    ],
    connectTitle: 'Επικοινωνήστε μαζί μας',
    contactFormLabel: 'Φόρμα επικοινωνίας',
    followTitle: 'Ακολουθήστε μας',
  },
  routes: {
    contact: '/el/about-athena/#contact',
    courses: '/el/courses/',
  },
} as const;
