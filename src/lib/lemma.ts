// Turns a Greek word that closes a paragraph, with the translation the text gives after it
// ("<span lang="grc">Εὖ Ζῆν</span> (Good Living)."), into a small dictionary entry: the word, how it
// is said, its meaning on the line below, and a note that opens when a visitor rests on it.
// Only words listed in src/data/lemmas.ts are touched, and only at the end of a paragraph.
// The brackets or quotation marks around the translation and the full stop after it are dropped:
// the layout does their work.
import { inlineLemmas, lemmas, symbolLemmas, type Lemma } from '../data/lemmas';
import { mainLocale, type Locale } from './locale';

let count = 0;
const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;');

export function withLemma(html: string, locale: Locale): string {
  const main = mainLocale(locale);
  return html.replace(
    /<span lang="grc">([^<]+)<\/span>\s*(?:\(([^)]*)\)|[“«]([^”»]*)[”»])\.?\s*$/u,
    (match, word: string, inBrackets?: string, inQuotes?: string) => {
      const entry = lemmas[word];
      if (!entry) return match;
      const id = `lemma-${++count}`;
      const means = inBrackets ?? inQuotes ?? '';
      // The Latin spelling helps a reader who has no Greek; a Greek page does not need it
      const say = locale === 'en' ? `<span class="lemma__say">${entry.say}</span>` : '';
      return (
        `<span class="lemma" tabindex="0" data-lemma aria-describedby="${id}">` +
        `<span class="lemma__word" lang="grc">${word}</span>` +
        `<span class="lemma__line">${say}<span class="lemma__kind">${entry.kind[main]}</span></span>` +
        `<span class="lemma__means">${means}</span>` +
        `<span class="lemma__box" role="tooltip" id="${id}">${escape(entry.note[main])}` +
        `<span class="lemma__source">${escape(entry.source[main])}</span></span>` +
        `</span>`
      );
    },
  );
}

/** The note itself, set like the head of a dictionary entry: the Greek word, how it is said, its kind, then the note. */
function box(entry: Lemma & { word: string }, id: string, locale: Locale): string {
  const main = mainLocale(locale);
  const say = locale === 'en' ? `<span class="lemma__say">${entry.say}</span>` : '';
  return (
    `<span class="lemma__box" role="tooltip" id="${id}">` +
    `<span class="lemma__head" lang="grc">${entry.word}</span>` +
    `<span class="lemma__line">${say}<span class="lemma__kind">${entry.kind[main]}</span></span>` +
    `<span class="lemma__note">${escape(entry.note[main])}</span>` +
    `<span class="lemma__source">${escape(entry.source[main])}</span></span>`
  );
}

/** Words in running text (Mnemosyne, Mathesis, Polity of the Soul): the word stays where it is and gains a note. */
export function withInlineLemmas(html: string, locale: Locale): string {
  const main = mainLocale(locale);
  let out = html;
  for (const entry of inlineLemmas) {
    const word = entry.match[main];
    const at = out.indexOf(word);
    // (an Ancient Greek page borrows the Greek notes, but its text has other forms of these words)
    if (at < 0 || locale === 'grc') continue;
    const id = `lemma-${++count}`;
    out =
      out.slice(0, at) +
      `<span class="lemma-inline" tabindex="0" data-lemma aria-describedby="${id}">${word}${box(entry, id, locale)}</span>` +
      out.slice(at + word.length);
  }
  return out;
}

/** The note for a symbol drawing, or nothing if the drawing is not one of the symbols. */
export function symbolNote(name: string, locale: Locale): { id: string; html: string } | undefined {
  const entry = symbolLemmas[name];
  if (!entry) return undefined;
  const id = `lemma-${++count}`;
  return { id, html: box(entry, id, locale) };
}
