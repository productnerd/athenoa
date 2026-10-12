// Greek words and phrases that the page sets as small dictionary entries: the word, how it is said,
// what kind of thing it is, and a short note shown when a visitor rests on it (src/lib/lemma.ts).
// NEW WORDING, asked for by the client on 12 October 2026 and not on the live site: the notes are
// for Athena to review. The meaning under each word is hers, taken from the page's own text.
import type { MainLocale } from '../lib/locale';

export interface Lemma {
  /** The Greek word shown at the head of the note, where the page itself does not show it */
  word?: string;
  /** The word in Latin letters, with its accents, for readers who do not read Greek */
  say: string;
  kind: Record<MainLocale, string>;
  note: Record<MainLocale, string>;
  source: Record<MainLocale, string>;
}

export const lemmas: Record<string, Lemma> = {
  // "It is not living that matters most, but living well": οὐ τὸ ζῆν περὶ πλείστου ποιητέον ἀλλὰ τὸ εὖ ζῆν.
  'Εὖ Ζῆν': {
    say: 'eû zên',
    kind: { en: 'phrase', el: 'φράση' },
    note: {
      en: 'To live well. For Socrates what matters most is not living, but living well.',
      el: 'Το να ζει κανείς καλά. Για τον Σωκράτη σημασία δεν έχει το ζην, αλλά το ευ ζην.',
    },
    source: { en: 'Plato, Crito 48b', el: 'Πλάτων, Κρίτων 48b' },
  },
  'Γνῶθι Σαυτόν': {
    say: 'gnôthi sautón',
    kind: { en: 'maxim', el: 'παράγγελμα' },
    note: {
      en: 'One of the maxims inscribed at the temple of Apollo at Delphi.',
      el: 'Ένα από τα παραγγέλματα που ήταν χαραγμένα στον ναό του Απόλλωνα στους Δελφούς.',
    },
    source: { en: 'Pausanias 10.24.1', el: 'Παυσανίας 10.24.1' },
  },
};

// Words in the running text of the About page that open the same kind of note. `match` is the word
// as each language's text has it (the first occurrence in a paragraph is used).
export const inlineLemmas: Array<Lemma & { word: string; match: Record<MainLocale, string> }> = [
  {
    match: { en: 'Mnemosyne', el: 'Μνημοσύνης' },
    word: 'Μνημοσύνη',
    say: 'mnēmosýnē',
    kind: { en: 'name', el: 'όνομα' },
    note: {
      en: 'Memory, and the Titaness of that name, mother of the nine Muses.',
      el: 'Η μνήμη, και η ομώνυμη Τιτανίδα, μητέρα των εννέα Μουσών.',
    },
    source: { en: 'Hesiod, Theogony 53–62', el: 'Ησίοδος, Θεογονία 53–62' },
  },
  {
    match: { en: 'Mathesis', el: 'Μάθηση' },
    word: 'μάθησις',
    say: 'máthēsis',
    kind: { en: 'noun', el: 'ουσιαστικό' },
    note: {
      en: 'Learning. For Plato, learning is nothing other than recollection.',
      el: 'Η μάθηση. Για τον Πλάτωνα η μάθηση δεν είναι τίποτε άλλο παρά ανάμνηση.',
    },
    source: { en: 'Plato, Phaedo 72e', el: 'Πλάτων, Φαίδων 72e' },
  },
  {
    match: { en: 'Polity of the Soul', el: 'Πολιτεία της Ψυχής' },
    word: 'ἡ ἐν αὑτῷ πολιτεία',
    say: 'hē en hautôi politeía',
    kind: { en: 'phrase', el: 'φράση' },
    note: {
      en: 'The constitution within oneself: the right order of the soul, to which the wise look in all they do.',
      el: 'Το πολίτευμα μέσα μας: η ορθή τάξη της ψυχής, προς την οποία αποβλέπει ο σοφός σε ό,τι πράττει.',
    },
    source: { en: 'Plato, Republic 591e', el: 'Πλάτων, Πολιτεία 591e' },
  },
];

// The symbol drawings: what each stands for. Keyed by the drawing's file name
// (src/assets/illustrations/<name>.svg); Illustration.astro attaches the note wherever one is drawn.
export const symbolLemmas: Record<string, Lemma & { word: string }> = {
  tetractys: {
    word: 'τετρακτύς',
    say: 'tetraktýs',
    kind: { en: 'noun', el: 'ουσιαστικό' },
    note: {
      en: 'Ten points in four rows, 1 + 2 + 3 + 4: the figure by which the Pythagoreans swore.',
      el: 'Δέκα σημεία σε τέσσερις σειρές, 1 + 2 + 3 + 4: το σχήμα στο οποίο ορκίζονταν οι Πυθαγόρειοι.',
    },
    source: { en: 'Golden Verses 47–48', el: 'Χρυσά Έπη 47–48' },
  },
  monad: {
    word: 'μονάς',
    say: 'monás',
    kind: { en: 'noun', el: 'ουσιαστικό' },
    note: {
      en: 'The One: the unit from which, for the Pythagoreans, every number and every thing proceeds.',
      el: 'Το Εν: η μονάδα από την οποία, κατά τους Πυθαγορείους, προέρχεται κάθε αριθμός και κάθε πράγμα.',
    },
    source: { en: 'Diogenes Laertius 8.25', el: 'Διογένης Λαέρτιος 8.25' },
  },
  'bow-lyre': {
    word: 'τόξον καὶ λύρα',
    say: 'tóxon kaì lýra',
    kind: { en: 'image', el: 'εικόνα' },
    note: {
      en: 'Heraclitus’s image of harmony in tension: what is drawn apart agrees with itself, as in the bow and the lyre.',
      el: 'Η εικόνα του Ηρακλείτου για την αρμονία των αντιθέτων: ό,τι τείνει σε αντίθετες κατευθύνσεις συμφωνεί με τον εαυτό του, όπως στο τόξο και στη λύρα.',
    },
    source: { en: 'Heraclitus, fragment B51', el: 'Ηράκλειτος, απόσπασμα B51' },
  },
  'cave-sun': {
    word: 'σπήλαιον',
    say: 'spḗlaion',
    kind: { en: 'noun', el: 'ουσιαστικό' },
    note: {
      en: 'Plato’s cave: the prisoners take shadows for the truth, until one of them climbs out into the light of the sun.',
      el: 'Το σπήλαιο του Πλάτωνα: οι δεσμώτες παίρνουν τις σκιές για αλήθεια, ώσπου ένας ανεβαίνει στο φως του ήλιου.',
    },
    source: { en: 'Plato, Republic 514a–517a', el: 'Πλάτων, Πολιτεία 514a–517a' },
  },
  ladder: {
    word: 'ἐπαναβασμοί',
    say: 'epanabasmoí',
    kind: { en: 'noun', el: 'ουσιαστικό' },
    note: {
      en: 'The steps of Diotima’s ascent: from one beautiful body, rung by rung, up to Beauty itself.',
      el: 'Τα σκαλοπάτια της ανόδου της Διοτίμας: από ένα ωραίο σώμα, βαθμίδα τη βαθμίδα, ως το ίδιο το Ωραίο.',
    },
    source: { en: 'Plato, Symposium 211c', el: 'Πλάτων, Συμπόσιον 211c' },
  },
  torch: {
    word: 'λαμπάς',
    say: 'lampás',
    kind: { en: 'noun', el: 'ουσιαστικό' },
    note: {
      en: 'A torch handed on from one runner to the next, as the teaching is from one generation to another.',
      el: 'Ο πυρσός που περνά από δρομέα σε δρομέα, όπως η διδασκαλία από γενιά σε γενιά.',
    },
    source: { en: 'Plato, Republic 328a', el: 'Πλάτων, Πολιτεία 328a' },
  },
  'spring-cypress': {
    word: 'κυπάρισσος',
    say: 'kypárissos',
    kind: { en: 'noun', el: 'ουσιαστικό' },
    note: {
      en: 'The Orphic gold tablets tell the soul to pass the spring by the white cypress and drink from the lake of Memory.',
      el: 'Τα ορφικά χρυσά ελάσματα λένε στην ψυχή να προσπεράσει την πηγή δίπλα στο λευκό κυπαρίσσι και να πιει από τη λίμνη της Μνημοσύνης.',
    },
    source: { en: 'Gold tablet of Hipponion', el: 'Χρυσό έλασμα του Ιππωνίου' },
  },
  tripod: {
    word: 'τρίπους',
    say: 'trípous',
    kind: { en: 'noun', el: 'ουσιαστικό' },
    note: {
      en: 'The three-legged seat of the Pythia at Delphi, from which the oracle of Apollo was given.',
      el: 'Το τρίποδο κάθισμα της Πυθίας στους Δελφούς, από όπου δινόταν ο χρησμός του Απόλλωνα.',
    },
    source: { en: 'Delphi', el: 'Δελφοί' },
  },
  butterfly: {
    word: 'ψυχή',
    say: 'psychḗ',
    kind: { en: 'noun', el: 'ουσιαστικό' },
    note: {
      en: 'One Greek word for both: the soul, and the butterfly.',
      el: 'Μία λέξη για δύο πράγματα: την ψυχή και την πεταλούδα.',
    },
    source: { en: 'Aristotle, History of Animals 551a', el: 'Αριστοτέλης, Περί τα ζώα ιστορίαι 551a' },
  },
  'orphic-egg': {
    word: 'ᾠόν',
    say: 'ōión',
    kind: { en: 'noun', el: 'ουσιαστικό' },
    note: {
      en: 'In the Orphic poems the world is born from an egg, out of which Phanes, the first light, appears.',
      el: 'Στα ορφικά ποιήματα ο κόσμος γεννιέται από ένα αυγό, από το οποίο προβάλλει ο Φάνης, το πρώτο φως.',
    },
    source: { en: 'Orphic Rhapsodies', el: 'Ορφικές Ραψωδίες' },
  },
  cicada: {
    word: 'τέττιξ',
    say: 'téttix',
    kind: { en: 'noun', el: 'ουσιαστικό' },
    note: {
      en: 'The cicadas were once men so in love with song that they forgot to eat. Now they sing all day and report to the Muses.',
      el: 'Τα τζιτζίκια ήταν κάποτε άνθρωποι που αγάπησαν τόσο το τραγούδι ώστε ξέχασαν να φάνε. Τώρα τραγουδούν όλη μέρα και δίνουν αναφορά στις Μούσες.',
    },
    source: { en: 'Plato, Phaedrus 259b–d', el: 'Πλάτων, Φαίδρος 259b–d' },
  },
  wheat: {
    word: 'στάχυς',
    say: 'stáchys',
    kind: { en: 'noun', el: 'ουσιαστικό' },
    note: {
      en: 'The ear of grain shown in silence at the height of the Mysteries of Eleusis.',
      el: 'Το στάχυ που δειχνόταν σιωπηλά στην κορύφωση των Ελευσινίων Μυστηρίων.',
    },
    source: { en: 'Hippolytus, Refutation 5.8.39', el: 'Ιππόλυτος, Έλεγχος 5.8.39' },
  },
  lyre: {
    word: 'λύρα',
    say: 'lýra',
    kind: { en: 'noun', el: 'ουσιαστικό' },
    note: {
      en: 'The instrument of Apollo and of Orpheus, whose song moved animals, trees and stones.',
      el: 'Το όργανο του Απόλλωνα και του Ορφέα, που το τραγούδι του συγκινούσε ζώα, δέντρα και πέτρες.',
    },
    source: { en: 'Apollo and Orpheus', el: 'Απόλλων και Ορφεύς' },
  },
  laurel: {
    word: 'δάφνη',
    say: 'dáphnē',
    kind: { en: 'noun', el: 'ουσιαστικό' },
    note: {
      en: 'Apollo’s tree. Its leaves crowned the victors at Delphi.',
      el: 'Το δέντρο του Απόλλωνα. Με τα φύλλα του στεφανώνονταν οι νικητές στους Δελφούς.',
    },
    source: { en: 'Delphi', el: 'Δελφοί' },
  },
};
