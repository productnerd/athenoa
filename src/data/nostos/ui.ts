// Nostos: the words of its interface (labels, buttons, short instructions), in English and Greek.
//
// ALL OF THIS IS NEW WORDING, PROPOSED FOR MARIA'S APPROVAL (2026-11-04). Nothing here is from the
// live site. Much of the English is the prototype's (reference/nostos-prototype); the Greek is a
// draft translation of it. Change freely once approved; until then treat every line as a proposal.
//
// This is the one file in src/data/nostos/ that is not generated content: the .json files beside it
// come from another session and must not be edited here.
//
// The study content itself (ideas, quiz items, myths and the rest) is in English with Greek terms in
// Greek script, on both language versions of the site; only these interface words are translated.

export const nostosUi = {
  en: {
    name: 'Nostos',
    map: {
      metaTitle: 'Nostos: her ideas as a night sky',
      metaDescription:
        'A map of the ideas Dr Athena Potari teaches: each star an idea, sized by how often she speaks of it, joined to the ideas she links it to.',
      title: 'Her ideas, as a night sky',
      // {n}: the number of transcribed talks
      intro:
        'Each star is an idea she teaches. Its size is how often she speaks of it across {n} transcribed talks. Lines join ideas she links herself, or that she keeps discussing in the same breath. Choose a star to open it.',
      draft: 'Drawn from her talks and writings, and still being read through by her: some details may change.',
      mapLabel: 'Map of the ideas in her teaching',
      search: 'Find a star',
      searchPlaceholder: 'Find a star: eros, Plato, ψυχή',
      noMatch: 'No star by that name yet',
      linesLabel: 'Which links to show',
      lines: { core: 'Strongest', her: 'Her links', co: 'Said together', all: 'All' },
      themes: 'Themes',
      sizeKey: 'Size: how often she speaks of it',
      recentre: 'Recentre',
      zoomIn: 'Closer',
      zoomOut: 'Further',
      hunt: 'Find the link',
      // the readable list under the map (and the whole page without JavaScript)
      listTitle: 'All the ideas',
      listIntro: 'The same ideas, listed by theme.',
      openOnMap: 'Show on the map',
    },
    note: {
      close: 'Close',
      // {n}: number of mentions
      mentioned: 'Mentioned {n} times in her talks',
      estimated: 'Weight in her teaching (estimated)',
      take: 'In her teaching',
      more: 'Another angle',
      roots: 'Roots',
      status: { hers: 'her reading', standard: 'standard', disputed: 'disputed' },
      links: 'She connects it to',
      talks: 'Where she says it',
      known: 'I know this one',
      markKnown: 'Mark as known',
      quiz: 'Quiz me on it',
      spar: 'Spar on it',
      uncertain: 'Reconstructed from unclear captions',
      opensYoutube: 'opens YouTube',
    },
    hunt: {
      // {n}: this try, out of three
      tries: 'Find the link: try {n} of 3',
      // {label}: the marked star
      ask: '{label} is marked. She links it to another star:',
      tap: 'Choose the other star on the map.',
      notThat: 'Not that one: {label}.',
      found: 'Found it',
      answer: 'The answer',
      again: 'Another',
      stop: 'Stop',
      done: 'Done',
    },
    groups: {
      path: 'The path',
      soul: 'Soul and mind',
      ethics: 'The good life',
      cosmos: 'Cosmos and the One',
      ways: 'Ways of knowing',
      thinkers: 'Thinkers',
      gods: 'Gods and myths',
    },
  },
  el: {
    name: 'Νόστος',
    map: {
      metaTitle: 'Νόστος: οι ιδέες της σαν νυχτερινός ουρανός',
      metaDescription:
        'Ένας χάρτης των ιδεών που διδάσκει η Δρ. Αθηνά Ποτάρη: κάθε αστέρι μια ιδέα, όσο μεγάλο όσο συχνά μιλά γι’ αυτήν, ενωμένο με τις ιδέες με τις οποίες τη συνδέει.',
      title: 'Οι ιδέες της, σαν νυχτερινός ουρανός',
      intro:
        'Κάθε αστέρι είναι μια ιδέα που διδάσκει. Το μέγεθός του δείχνει πόσο συχνά μιλά γι’ αυτήν σε {n} απομαγνητοφωνημένες ομιλίες. Οι γραμμές ενώνουν ιδέες που συνδέει η ίδια ή που συζητά συνεχώς μαζί. Επιλέξτε ένα αστέρι για να το ανοίξετε.',
      draft: 'Βασισμένο στις ομιλίες και τα κείμενά της, και ακόμη υπό την επιμέλειά της: κάποιες λεπτομέρειες μπορεί να αλλάξουν. Το περιεχόμενο είναι στα αγγλικά.',
      mapLabel: 'Χάρτης των ιδεών της διδασκαλίας της',
      search: 'Βρείτε ένα αστέρι',
      searchPlaceholder: 'Βρείτε ένα αστέρι: έρως, Πλάτων, ψυχή',
      noMatch: 'Δεν υπάρχει ακόμη αστέρι με αυτό το όνομα',
      linesLabel: 'Ποιες συνδέσεις να φαίνονται',
      lines: { core: 'Οι ισχυρότερες', her: 'Δικές της', co: 'Λέγονται μαζί', all: 'Όλες' },
      themes: 'Θέματα',
      sizeKey: 'Μέγεθος: πόσο συχνά μιλά γι’ αυτήν',
      recentre: 'Στο κέντρο',
      zoomIn: 'Πιο κοντά',
      zoomOut: 'Πιο μακριά',
      hunt: 'Βρείτε τη σύνδεση',
      listTitle: 'Όλες οι ιδέες',
      listIntro: 'Οι ίδιες ιδέες, ανά θέμα.',
      openOnMap: 'Στον χάρτη',
    },
    note: {
      close: 'Κλείσιμο',
      mentioned: 'Αναφέρεται {n} φορές στις ομιλίες της',
      estimated: 'Βάρος στη διδασκαλία της (κατ’ εκτίμηση)',
      take: 'Στη διδασκαλία της',
      more: 'Άλλη οπτική',
      roots: 'Ρίζες',
      status: { hers: 'δική της ανάγνωση', standard: 'καθιερωμένη', disputed: 'αμφισβητούμενη' },
      links: 'Τη συνδέει με',
      talks: 'Πού το λέει',
      known: 'Το γνωρίζω',
      markKnown: 'Σημείωση ως γνωστό',
      quiz: 'Ερωτήσεις γι’ αυτό',
      spar: 'Διάλογος γι’ αυτό',
      uncertain: 'Ανασυντέθηκε από ασαφείς υπότιτλους',
      opensYoutube: 'ανοίγει το YouTube',
    },
    hunt: {
      tries: 'Βρείτε τη σύνδεση: προσπάθεια {n} από 3',
      ask: 'Σημειώθηκε το «{label}». Η ίδια το συνδέει με ένα άλλο αστέρι:',
      tap: 'Επιλέξτε το άλλο αστέρι στον χάρτη.',
      notThat: 'Όχι αυτό: «{label}».',
      found: 'Το βρήκατε',
      answer: 'Η απάντηση',
      again: 'Άλλη μία',
      stop: 'Διακοπή',
      done: 'Τέλος',
    },
    groups: {
      path: 'Ο δρόμος',
      soul: 'Ψυχή και νους',
      ethics: 'Η καλή ζωή',
      cosmos: 'Ο κόσμος και το Ένα',
      ways: 'Τρόποι γνώσης',
      thinkers: 'Στοχαστές',
      gods: 'Θεοί και μύθοι',
    },
  },
} as const;
