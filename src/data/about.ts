// "About Athena" copy, word for word from the live About Us page (athenoa.academy/en/contactus, October 2026).
// Deliberate edits are limited to typo fixes; each is listed in tasks/text-changes.md.

export const about = {
  meta: {
    title: 'About Dr. Athena Potari | ATHENOA',
    // The live page's own meta description.
    description:
      'Guided by the Archetype of Goddess Athena, we illuminate the way from intellectual learning to embodied knowing, from philosophy to inner awakening',
  },

  title: 'About Dr. Athena Potari',

  intro: [
    'Dr. Athena Despoina Potari is a Doctor of Philosophy at the University of Oxford, holder of a Master’s Degree specializing in Platonic Polity and Cosmology, and founder of the Philosophical Academy “ATHENOA”.',
    'The purpose of founding the Academy is to highlight Greek Philosophy and to teach it as a Living Spiritual Tradition, with the main goal of Awakening of Consciousness and <span lang="grc">Εὖ Ζῆν</span> (Good Living).',
    'Athena Potari’s vision is the continuation and revival of the Platonic Academy. With the founding of the Philosophical Academy ATHENOA, she gives flesh and bones to this vision and undertakes the Teaching of Philosophy in combination with Science and Spirituality, as a Path of Self-Knowledge and Awakening, with its direct and experiential application in our lives.',
  ],

  saysTitle: 'What Athena Says…',

  // The live page breaks the story into four blocks, each beside a photograph. The same grouping is kept.
  story: [
    {
      id: 'roots',
      image: 'library-portrait',
      paragraphs: [
        '“I grew up in the beautiful nature of Attica, in the northern suburbs of Athens, in a house nestled in pine-covered gardens and Apollonian light, with a family of mathematicians. Pythagorean Teaching, Music, and Mathematics were the first endowments I received from my parents already from the age of four. Love for Greece and Philosophy were innate elements that emerged very early, and thus I devoted myself to the study of Greek Philosophy from a young age.',
        'I received the Call from Plato at the age of fourteen - after a shattering spiritual experience, triggered as I was reading the Ancient Dialogues. It was a lightning-like activation of Mnemosyne.',
        'I graduated from the Athens College with Distinction and Awards in Greek Language, Literature, and Rhetoric, and continued with distinguished university studies abroad, focused mainly on Greek Political Philosophy.',
      ],
    },
    {
      id: 'studies',
      image: 'graduation',
      paragraphs: [
        'I received my Master’s Degree with Distinction from the LSE, specializing in Platonic Philosophy and more specifically in Plato’s “Republic” and in Political Cosmology. I continued with doctoral studies at the University of Oxford, where a few years later I was awarded the title of Doctor of Political Philosophy, and where I also served as a lecturer in Political-Platonic Philosophy.',
        'In 2020, I was honored with the Philosophy Award of the Academy of Athens for my study on the work of Aristotle. In the same year, I received a research fellowship at the Center for Hellenic Studies of Harvard University in America. My research explored new horizons in approaching Philosophy, inspired by the history of known and unknown Wise Women - the Ancient Greek women philosophers.',
        'I have taught at the Universities of Oxford, Athens, Patras, Toulouse 1-Capitole, and at the National Defence School. I am a member of the Central Committee of the Scientific Community for the study of the post-materialist paradigm, the Galileo Commission.',
        'In 2022, I published with the same organization the “Call for the Regeneration of the Spirit in the Humanities,” inviting the reintegration of the Spiritual Dimensions of Human Existence into Academic Research, based on the Model and Principles of Hellenism.”',
        'In parallel with my studies, and recognizing that the existing academic system could not respond to the deep soulful calling I felt for the Path of Light, I devoted myself for two decades to another, parallel Mathesis (discipleship): Spiritual and Inner Study.',
        'I traveled the world in search of the Light and studying Ancient Civilizations. I was initiated by Teachers of Ancient Spiritual and Healing Traditions, the timeless Spiritual Teaching of the Light, and especially the Orphic–Pythagorean Tradition. Among other things, in 2010 I received the degree of Master Usui Reiki.',
      ],
    },
    {
      id: 'return',
      image: 'portrait-sea',
      paragraphs: [
        'I spent long periods of ascetic and meditative practice close to the greatest Teacher… Mother Nature, mainly in mountains, until I realized and experienced that what I was seeking was already here: first of all, within me and secondly, in the cradle of the Spiritual Light from which I had set out - our Blessed Greece.',
        'In 2019, these two streams of my life, academic and inner study, were united in the founding of the Academy of Hellenic Wisdom ATHENOA, dedicated to the Guide-Protector of Philosophy and Goddess of Wisdom - the Goddess Athena.',
        'Our School seeks the continuation of the Platonic Academy, approaching Greek Philosophy as a living, experiential spiritual tradition that combines Scientific Reason with Self-Knowledge, Mystagogy, and Spirituality, with the ultimate aim of the Awakening of Consciousness and the activation of <span lang="grc">Εὖ Ζῆν</span> (Good Living).',
      ],
    },
    {
      id: 'academy',
      image: 'gathering-pines-acropolis',
      paragraphs: [
        'In our Academy, the in-depth study of Ancient Texts, Dialectics, Interdisciplinarity that unites the Philosophical, Theological, and Psychological with the Physical and Cosmological dimensions of Knowledge, Etymology and contact with the all-powerful Ancient Greek Language, are complemented by the teaching of direct experiential practices and tools of spiritual technology, such as: Meditations, Methods of Self-Knowledge, Ancient Hieratic Art, Orphic Hymns, direct study of Consciousness, as well as ethical criteria for action in our daily life.',
        'In this way, Philosophy is approached not as a vague theoretical knowledge, but is highlighted as a Way of Life - and, according to Plato’s words, as a Polity of the Soul.',
        'The goal of our Academy is the Promotion of the Hellenic Teaching, the Revival of the Greek Spiritual Tradition, and the Fulfillment of the Apollonian Command: <span lang="grc">ΓΝΩΘΙ ΣΑΥΤΟΝ</span> “Know Thyself”.',
      ],
    },
  ],

  cta: { label: 'Contact Us', href: '#contact' },

  // Other photographs from the live page, free to use on this page.
  extraImages: ['temple-blue-dress'],

  contact: {
    title: 'Contact us',
    intro: 'Contact us regarding our work, upcoming courses, retreats, articles and more.',
    fields: [
      { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Full name', autocomplete: 'name' },
      {
        name: 'phone',
        label: 'Phone Number',
        type: 'tel',
        required: false,
        placeholder: '+30 555-555-5556',
        autocomplete: 'tel',
      },
      {
        name: 'email',
        label: 'Email',
        type: 'email',
        required: true,
        placeholder: 'example@mail.com',
        autocomplete: 'email',
      },
      {
        name: 'source',
        label: 'How did you find us?',
        // A list of answers with "Other" (src/data/sources.ts); it was a free text field on the live site.
        type: 'select',
        required: false,
        placeholder: '',
        autocomplete: 'off',
      },
      {
        name: 'subject',
        label: 'Subject',
        type: 'text',
        required: true,
        placeholder: 'Describe the topic of your request',
        autocomplete: 'off',
      },
      {
        name: 'message',
        label: 'Message',
        type: 'textarea',
        required: true,
        placeholder: 'Write your message',
        autocomplete: 'off',
      },
    ],
    note: 'We usually respond within 2-3 business days.',
    submit: 'Send',
    // The form is not connected to a mail service yet. Until it is, submitting opens the visitor's mail app.
    fallbackEmail: 'philathenea@athenoa.academy',
  },
} as const;
