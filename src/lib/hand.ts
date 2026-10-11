// Words set in the handwriting face are written the way a person writes a sentence: a capital at the
// start, and on names, and nowhere else (client direction, 11 October 2026: "do not capitalise the
// first letter of each word when we are using handwritten fonts", in every language).
// The copy itself often capitalises Each Word; this turns such a line into sentence case for display
// only. The data is left as Athena wrote it.

// Names keep their capital: people, places, the Academy, months, products. English names are matched
// whole; Greek ones by their stem, since they change their endings.
const names =
  /^(Athena|Athens|Attica|Greek|Greece|Hellenic|Hellenism|Plato|Platonic|Academy|Aristotle|Orphic|Pythagorean|Zoom|Stripe|Oxford|Harvard|Dr|I|January|February|March|April|May|June|July|August|September|October|November|December)$/u;
const stems =
  /^(Αθην|Αττικ|Ελλάδ|Πλάτων|Πλατων|Ακαδημ|Αριστοτέλ|Ορφ|Πυθαγ|Δρ$|Ιανουαρ|Φεβρουαρ|Μαρτ|Απριλ|Μα[ΐι]ο|Ιουν|Ιουλ|Αυγο[υύ]στ|Σεπτεμβρ|Οκτωβρ|Νοεμβρ|Δεκεμβρ|Ἀθην|Ἀττικ|Ἑλλ|Ἀκαδ|Ἀριστοτέλ|Ὀρφ)/u;

export function handCase(text: string): string {
  let start = true; // the next word opens a sentence
  return text.replace(/(\p{L}[\p{L}\p{M}’'-]*)|([.!?…]+|;(?=\s|$))/gu, (match, word?: string) => {
    if (!word) {
      start = true;
      return match;
    }
    const first = start;
    start = false;
    if (first || names.test(word) || stems.test(word)) return word;
    // a word in capitals throughout (ATHENOA) is a name too
    if (word.length > 1 && word === word.toUpperCase()) return word;
    return word.charAt(0).toLowerCase() + word.slice(1);
  });
}
