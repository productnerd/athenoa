// Turns a Greek word that closes a paragraph, with the translation the text gives after it
// ("<span lang="grc">Εὖ Ζῆν</span> (Good Living)."), into a small dictionary entry: the word, how it
// is said, its meaning on the line below, and a note that opens when a visitor rests on it.
// Only words listed in src/data/lemmas.ts are touched, and only at the end of a paragraph.
// The brackets or quotation marks around the translation and the full stop after it are dropped:
// the layout does their work.
import { lemmas } from '../data/lemmas';
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
