// Home page copy, taken word for word from the live site (athenoa.academy, October 2026).
// Deliberate edits are limited to typo fixes and Greek button labels; each is listed in tasks/text-changes.md.
import { site } from './site';
import { courseHref } from './courses';

export const home = {
  meta: {
    title: 'ATHENOA | Study at the Modern Platonic Academy',
    description: site.description,
  },

  hero: {
    // The live page sets this as two headings; here it is the page's single h1.
    titleLines: ['STUDY AT THE MODERN PLATONIC ACADEMY', '& REMEMBER WHO YOU REALLY ARE'],
    // The first line is the title; the second is its subtitle and is set smaller.
    // These words of the title sit on an organic highlight, which animates in last.
    highlight: 'PLATONIC ACADEMY',
  },

  membership: {
    title: 'Now you can become an annual Academy Member!',
    question: 'Would you like to study methodically on the Path of Greek Philosophy and Light?',
    points: [
      {
        title: 'The Living Spirit',
        text: 'You will follow in the footsteps of Socrates, Plato and our Ancient Sages, with the methodicality and precision of the Curriculum, and the living spirit of the Ancient Academy.',
      },
      {
        title: 'Our Community',
        text: 'You will be immersed in the activities, seminars and wonderful Community of our School',
      },
      {
        title: 'Your Contribution',
        text: 'You will contribute to the Renaissance of the Greek Spirit',
      },
    ],
    cta: { label: 'Discover all the features', href: site.membershipForm },
  },

  announcement: {
    greeting: 'Dear Friends and Bright Fellow Travelers on the Path of the Greek Light,',
    text: 'It is with great pleasure that I announce the resumption of classes!',
    newsletter: {
      text: 'Be the first to know about our news, articles and upcoming activities',
      cta: { label: 'Subscribe to our Newsletter', href: '#newsletter' },
    },
    // The three course titles shown as image tiles. The first two have sample course pages.
    courses: [
      { title: "Plato's Republic", image: 'course-platos-republic', href: courseHref('platos-republic') },
      {
        title: 'Marcus Aurelius - The Self',
        image: 'course-marcus-aurelius',
        href: courseHref('marcus-aurelius-the-self'),
      },
      {
        title: 'Plato, Cratylus - Platonic Virtues - Introduction to Greek Theology',
        image: 'plato-statue',
        href: undefined,
      },
    ],
  },

  seminar: {
    kicker: 'MONTHLY SEMINAR',
    title: 'Orphic Hymns - The essence of the Spiritual Technology of the Greeks',
    open: 'Open to everyone + new students',
    note: '*THE SEMINAR START DATE WILL BE ANNOUNCED SOON*',
  },

  series: {
    title: 'Explore our new course series',
    text: 'Each week we will delve into the non-dual teaching expressed by the following great Philosophers ~ Ancient Sages: Plotinus, Plato, Pythagoras, The Pre-Socratics',
    cta: { label: 'Get started', href: courseHref('the-hidden-non-duality-of-ancient-greek-philosophy') },
    more: 'Learn more below',
    courseSlug: 'the-hidden-non-duality-of-ancient-greek-philosophy',
  },

  transmission: {
    title: 'Living Transmission of Ancient Thought for a Sustainable Future',
    text: 'Join us in restoring Philosophy to its rightful place in promoting a new evolution in consciousness and a future of harmonious coexistence!',
    cta: { label: 'Enroll in our courses', href: site.routes.courses },
  },

  start: {
    title: "Let's Get Started",
    lines: [
      'I await you with joy and enthusiasm on a New Initiatic Journey',
      'with Awakening, illumination, inspiration, Upliftment!',
    ],
  },

  benefits: {
    title: 'Benefits of Joining ATHENOA',
    question:
      'Would you like to explore deep spiritual wisdom, and the non-dual teachings of key ancient philosophers?',
    items: [
      {
        title: 'You will have the opportunity to learn about Greek spiritual tradition of Awakening,',
        text: 'You will walk the philosophical path experientially, with safety and support at every step. You will come into contact with your spiritual roots, and you will receive the proper, holistic Greek Education and the psycho-mental cultivation that they did not give us in schools - and which is now rarely provided by the existing social - educational system.',
        italic: true,
      },
      {
        title:
          'You will be methodically and properly trained in Greek Philosophy and the Ancient Hellenic Scriptures',
        text: 'In an era when over- and misinformation, the proper foundations, the methodical, precise and grounded Education, without “detours” and rhetoric devoid of practical substance, are the elements that characterize the authentic thinker and practitioner of Philosophy.',
        italic: false,
      },
      {
        title: 'You will follow in the footsteps of Education followed by the Ancient Sages',
        text: 'After many years of research and work, for the first time in modern times, our School introduces a pioneering Study structure based on the Ancient Curriculum of the Platonic Academy - which operated for approximately 1000 consecutive years, from 387 BC - 529 AD!',
        italic: false,
      },
    ],
  },
} as const;
