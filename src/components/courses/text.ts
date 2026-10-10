// Small typographic help for course titles.
const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Keeps a hyphenated word such as "Non-Duality" together where the line has room for it: as an
 * inline-block it moves to the next line whole, and only breaks at its hyphen when it is wider than
 * the column (a long Greek compound on a phone). The words themselves are untouched.
 */
export const keepHyphens = (text: string) =>
  escape(text).replace(/\S+-\S+/g, '<span style="display:inline-block">$&</span>');
