// Course catalogue. Four courses for the redesign. The first carries the full copy of the live site.
// The other three are named on the live home page with titles only: their subtitles, descriptions,
// dates, lengths and fees below are SAMPLE VALUES, written so the cards look complete. Each sample is
// marked. Replace them with Athena's own before launch.
//
// "The Hidden Non-Duality of Ancient Greek Philosophy" carries the full copy from the live home page.
// The other two exist on the live site as titles only, so they are marked status: 'placeholder'
// and show no invented description or price.
//
// Payment is not wired. To connect Stripe later, paste a Stripe Payment Link into
// `stripePaymentLink` for each course (or swap that field for a Checkout Session endpoint).

export interface CourseSection {
  id: string;
  label: string;
  sublabel: string;
  /** Rich text exactly as written on the live site (typos fixed). */
  html: string;
}

export interface Course {
  slug: string;
  title: string;
  status: 'open' | 'placeholder';
  /** File name (without extension) in src/assets/media */
  image: string;
  imageAlt: string;
  /** A second line under the title */
  subtitle?: string;
  /** One or two sentences for the course card */
  summary?: string;
  /** When it runs. "TBC" when the dates are not set. */
  schedule?: string;
  /** How long it runs */
  duration?: string;
  /** How it is taught */
  format?: string;
  /** True when visitors can enrol now: the card's button reads "Enroll" */
  available: boolean;
  instructor: string;
  price?: {
    amount: number;
    currency: 'EUR';
    vatRate: number;
    /** As written on the live site */
    display: string;
    label: string;
  };
  includesLabel?: string;
  includes?: string[];
  registrationNote?: string;
  sections: CourseSection[];
  stripePaymentLink: string;
}

export const courseHref = (slug: string) => `/courses/#${slug}`;
export const coursePageHref = (slug: string) => `/courses/${slug}/`;

export const courses: Course[] = [
  {
    slug: 'the-hidden-non-duality-of-ancient-greek-philosophy',
    // Title and subtitle as lettered on the course banner.
    title: 'The Hidden Non-Duality of Ancient Greek Philosophy',
    status: 'open',
    image: 'course-non-duality',
    imageAlt:
      'Course banner: The Hidden Non-Duality of Ancient Greek Philosophy, with marble figures of Pythagoras, Plato and Aristotle against a night sky of constellations',
    // As lettered on the course banner
    subtitle: 'Hellenic Wisdom as a Path of Self-Realization',
    summary:
      'Each week we will delve into the non-dual teaching expressed by the following great Philosophers ~ Ancient Sages: Plotinus, Plato, Pythagoras, The Pre-Socratics',
    schedule: 'Autumn 2026',
    // From the course description: "this four-week course", live on Zoom, recordings kept 120 days
    duration: 'Four weekly meetings',
    format: 'Live on Zoom, with recordings',
    available: true,
    instructor: 'Dr. Athena Despoina Potari',
    price: {
      amount: 200,
      currency: 'EUR',
      vatRate: 24,
      display: '€200 & VAT (24%)',
      label: 'Participation cost:',
    },
    includesLabel: 'Course price includes:',
    includes: [
      'Access to all of the live meetings',
      'Links to the streamable recordings after each meeting in both audio & video format',
      'Access to all recordings for 120 days (4 months)',
      'Course material - resources - additional presentations, texts & bibliography',
    ],
    registrationNote:
      "To register for the course scheduled for Autumn 2026, please use the 'Add to Cart' button below and follow the checkout process.",
    sections: [
      {
        id: 'description',
        label: 'Course Description',
        sublabel: 'Introduction',
        html: `<p>This four-week course undertakes <strong>a lived, philosophical and spiritual inquiry into a dimension of Ancient Greek Philosophy</strong> that has been systematically obscured within modern Western intellectual history.</p>
<p>The Greek philosophical tradition did not originate from division; it did not begin with an ontological rupture between being and mind, spirit and matter, knower and known, inner and outer. These dualisms are later developments — products of historical bifurcations, theological polemics, and the gradual exteriorization of metaphysics into abstraction.</p>
<p><strong>At its source, the Hellenic View recognizes the Unity of Being.</strong> Being is not split; the human is not external to the cosmos; Nous (awareness) and Reality are inherently interweaved.</p>
<p>This holistic View finds a graceful, aesthetically and poetically inspired way of expression through all aspects of Hellenic Civilization: through Mathematics – seen as the living Theology of Nature, Philosophy ~ the language of human Awareness, as well as Poetry, Drama, Ethics, Ontology, Metaphysics; indeed all notions, and terms, which are invented during the same historical time, in the cradle of western civilization, a land blessed by nature, Apollonian luminosity and filled with an abundance of energetic portals.</p>
<p><strong>In this short intensive course, we return to the foundations of the West to discover an ancient, yet perennial, spiritual Treasure: the original meaning of Philosophy as Love (“philo”) for Wisdom (“sophia”), as a spiritual path to Awakening</strong>; and particularly its <strong>non-dual view</strong> that formed both its founding view and its luminous culmination.</p>`,
      },
      {
        id: 'meetings',
        label: 'In our meetings, we will explore',
        sublabel: 'Re-member',
        html: `<p><strong>In our meetings, we will explore</strong> an aspect of Hellenism often obscured by its colonized appropriation by later western approaches and materialist-reductionist metaphysics: we will re-member <strong>the hidden non-dual teachings at the heart of Greek Philosophy</strong></p>
<blockquote><i>(Re-member ~ for “all knowledge is Remembrance”, says Socrates)</i></blockquote>
<p>To approach the unity at the foundations of Hellenism is to reconsider the foundation upon which Western thought was built.</p>
<p><strong><u>In our four meetings</u></strong> we will learn about the Greek spiritual tradition not through abstraction but through a <strong>close, intimate and contemplative encounter with the tradition.</strong></p>
<ul>
<li>We will <strong>study</strong> <strong>excerpts from key ancient texts</strong> (presented by Athena in a way that makes them relatable – of course, in English translation) in a dialectical way, contemplating their meaning and essence together</li>
<li><strong>Decode</strong> their initiatory <strong>spiritual etymology</strong> (in the universe of the Greek language, the etymology is a code of meaning and essence); and of course,</li>
<li>Weave our investigation with <strong>meditations, contemplation, embodied practices and dialogue</strong></li>
<li><strong>QnA</strong> ~ live dialogue with Athena and our course community</li>
</ul>`,
      },
      {
        id: 'structure',
        label: 'Course Structure & Content',
        sublabel: 'Each week we will explore',
        html: `<p><u>Each week</u> we will explore the non-dual teachings in the work of the following great Philosophers ~ Ancient Sages:</p>
<ul>
<li><strong><u>Plotinus</u>: Nous and Logos; the One and/ (as) the Self * <em>“It is not a View, it is a Union”</em></strong></li>
<li><strong><u>Plato:</u> The Hidden non-duality behind the - apparent - Platonic duality * <em>One, Eros &amp; Beauty, and Socrates’ secret Female Master</em></strong></li>
<li><strong><u>Pythagoras</u>: The Initiate of the Egyptian Pyramids who invented the term “<em>Philosopher</em>” * “<em>You will realize you were never a mortal</em>”</strong></li>
<li><strong><u>The Presocratics: Heraclitus – Parmenides</u>: At the start of the Journey: <em>En</em> and <em>Polla</em> ~ <em>The One and the Many</em></strong></li>
</ul>
<p>The discussion will also involve <strong>allusions to mythology</strong>, theology and even poetry and the Arts, as expressions of meaning and teachings pertaining to the holistic non-dual View of Hellenism.</p>`,
      },
      {
        id: 'access',
        label: 'Access',
        sublabel: 'Live sessions & recorded lessons',
        html: `<p>Participants can attend the live sessions of the classes and/or watch the recorded lessons at their own time. <strong>All participants will receive audio and video links to stream the recordings of each class, and these will remain active for 120 days.</strong></p>
<p>All you need to participate is a computer or a mobile device, such as a tablet or smartphone, with a built-in speaker and access to the internet. The platform we use for the sessions is Zoom. The sign-in process is very simple, and you will receive emails with the invitation to join ahead of the weekend.</p>
<p>To optimise your course experience, we recommend a wired connection if possible. If you do use a Wi-Fi connection, close all or most other devices using the signal. For mobile devices, a 3G or higher connection is needed.</p>`,
      },
      {
        id: 'orientation',
        label: 'Orientation of the Course',
        sublabel: 'Our journey together',
        html: `<p>Our journey together at the roots of the West, is a calling of the Heart. It is not an attempt to superimpose foreign metaphysical categories upon Greece, but to re-member the Wisdom that shaped our history, our consciousness, our education ~ and which still remains active, alive, shining the way Home – to our true being.</p>
<p>Greek Philosophy will be approached according to its original meaning; not merely an intellectual endeavor, but a path of Love and Wisdom with the ultimate goal of realizing one’s true nature and living a life of wholeness, inspiration, creativity aligned with this realization. What the Ancients called, “EF ZEN”~ the Good life. (<span lang="grc">Εὖ Ζῆν</span>)</p>`,
      },
      // The sixth tab, "Registration & Tuition Fees", is built from registrationNote, price and includes above.
    ],
    stripePaymentLink: '',
  },
  {
    slug: 'platos-republic',
    title: "Plato's Republic",
    // SAMPLE subtitle (the phrase is Athena's, from her biography), summary, dates, length and fee
    subtitle: 'The Polity of the Soul',
    summary: 'A slow, shared reading of the dialogue on justice, the soul and the city.',
    schedule: 'Starts 12 January 2027',
    duration: 'Eight weekly meetings',
    format: 'Live on Zoom, with recordings',
    price: { amount: 240, currency: 'EUR', vatRate: 24, display: '€240 & VAT (24%)', label: 'Participation cost:' },
    available: true,
    status: 'placeholder',
    image: 'course-platos-republic',
    imageAlt:
      'Course artwork: the Parthenon under a starry sky, lettered in Greek ΠΛΑΤΩΝΟΣ ΠΟΛΙΤΕΙΑ (Plato’s Republic)',
    instructor: 'Dr. Athena Despoina Potari',
    sections: [],
    stripePaymentLink: '',
  },
  {
    slug: 'marcus-aurelius-the-self',
    // The live title is "Marcus Aurelius - The Self"; here it is split into title and subtitle.
    title: 'Marcus Aurelius',
    subtitle: 'The Self',
    // The summary renders the Greek lettering on the course artwork; dates, length and fee are SAMPLES
    summary: 'An initiation into the world of the virtues, in theory and in practice.',
    schedule: 'TBC',
    duration: 'Six weekly meetings',
    format: 'Live on Zoom, with recordings',
    price: { amount: 180, currency: 'EUR', vatRate: 24, display: '€180 & VAT (24%)', label: 'Participation cost:' },
    available: false,
    status: 'placeholder',
    image: 'course-marcus-aurelius',
    imageAlt:
      'Course artwork: a bronze figure of Marcus Aurelius before a lit temple at night, lettered in Greek ΜΥΗΣΗ ΣΤΟΝ ΚΟΣΜΟ ΤΩΝ ΑΡΕΤΩΝ ΣΕ ΘΕΩΡΙΑ & ΠΡΑΞΗ',
    instructor: 'Dr. Athena Despoina Potari',
    sections: [],
    stripePaymentLink: '',
  },
  {
    slug: 'plato-cratylus-platonic-virtues',
    // The live title is "Plato, Cratylus - Platonic Virtues - Introduction to Greek Theology"; split here.
    title: 'Plato, Cratylus',
    subtitle: 'Platonic Virtues - Introduction to Greek Theology',
    // SAMPLE summary, dates, length and fee
    summary: 'The names of the gods and of the virtues, read through the dialogue on language.',
    schedule: 'Spring 2027',
    duration: 'Six weekly meetings',
    format: 'Live on Zoom, with recordings',
    price: { amount: 180, currency: 'EUR', vatRate: 24, display: '€180 & VAT (24%)', label: 'Participation cost:' },
    available: false,
    status: 'placeholder',
    image: 'plato-statue',
    imageAlt: 'Marble statue of Plato, seated, with a statue of Athena on a column behind',
    instructor: 'Dr. Athena Despoina Potari',
    sections: [],
    stripePaymentLink: '',
  },
];

export const registrationTab = {
  id: 'registration',
  label: 'Registration & Tuition Fees',
  sublabel: 'Register for the course',
} as const;

// New interface wording for the courses page and the enrol flow. None of this exists on the live site,
// so it is kept in one place for Athena to review.
export const coursesPage = {
  title: 'Courses',
  // The live Courses page uses this line as its description.
  description: 'Study at the Modern Platonic Academy & Remember Who You Really Are',
  ui: {
    viewCourse: 'View course',
    enrollNow: 'Enroll',
    facts: { dates: 'Dates', duration: 'Length', format: 'Format', fee: 'Fee' },
    close: 'Close',
    enroll: 'Get started',
    placeholderNote: 'Course details are on their way. Leave your name and we will write to you when enrolment opens.',
    placeholderBadge: 'Details to follow',
    fullName: 'Full name',
    email: 'Email',
    back: 'Back',
    // The request to enrol (EnrollFlow.astro): asked for by the client on 11 October 2026. It also uses
    // fullName, email, back and contactInstead.
    whyInterested: 'Why are you interested?',
    heardFrom: 'Where did you hear about us?',
    sendRequest: 'Send request',
    // Shown in place of the form after it is filled in: requests are not connected yet.
    requestPending: 'Requests are not connected yet. Nothing has been sent.',
    contactInstead: 'Contact us',
    taughtBy: 'With',
    orderSummary: 'Your enrolment',
    // The test checkout (EnrollFlow.astro, branch experiment/checkout, 14 October 2026): after the
    // details, a card payment in Stripe's test mode. Nothing is charged or sent.
    checkout: {
      continue: 'Continue to payment',
      stepDetails: 'Your details',
      stepPayment: 'Payment',
      testMode: 'Test mode: no real payment is taken.',
      testHint: 'Use the test card 4242 4242 4242 4242, any future date and any three digits.',
      cardNumber: 'Card number',
      expiry: 'Expiry (MM / YY)',
      cvc: 'Security code',
      cardName: 'Name on card',
      fee: 'Course fee',
      vat: 'VAT',
      total: 'Total',
      // Followed by the amount
      pay: 'Pay',
      processing: 'Processing…',
      changeDetails: 'Change your details',
      handledBy: 'Card payments will be handled by Stripe.',
      errors: {
        number: 'Enter the 16 digits of the card number.',
        notTestCard: 'In test mode only Stripe test cards work, such as 4242 4242 4242 4242.',
        expiry: 'Enter an expiry date in the future, as MM / YY.',
        cvc: 'Enter the three digits on the back of the card.',
        name: 'Enter the name on the card.',
        declined: 'Your card was declined. Try another card.',
        funds: 'Your card has insufficient funds. Try another card.',
      },
      paidTitle: 'You are enrolled',
      // Followed by the email address given in the first step
      paidText: 'Welcome to the course. Your receipt and the joining details would now go to',
      reference: 'Reference',
      testNote: 'This was a test payment: nothing was charged and nothing was sent.',
    },
    // The waitlist, for a course that cannot be enrolled in yet (available: false). The button stands
    // where "Enroll" would; the rest are the words of the small popup it opens (WaitlistDialog.astro).
    // The popup also uses email, close and contactInstead from above.
    joinWaitlist: 'Join waitlist',
    waitlist: {
      title: 'Join the waitlist',
      // Followed by the title of the course
      forCourse: 'For the course',
      submit: 'Add me to the list',
      // The quiet line under the button, followed by a link that opens an email to the Academy
      question: 'Got a question?',
      // Shown in place of the form after a valid address is entered: the waitlist is not connected yet.
      pending: 'The waitlist is not connected yet. Your address has not been sent anywhere.',
    },
  },
} as const;
