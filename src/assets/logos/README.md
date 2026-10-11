# Institution marks (About page)

These are the trademarks of the institutions named. They are used on the About page (`src/components/about/Logos.astro`, the row under the third paragraph of the "studies" block) **pending Athena's approval**. Each institution's own rules for the use of its name and mark apply; a licence note on Wikimedia Commons covers copyright only, not the trademark.

The files are never inlined into the page. They are used only as CSS masks over a block of the page's ink, so each shows in one colour (blue by day, light ink by night) and nothing inside a file can run. Every SVG was read as text on download: none contains a script, an event attribute, a `foreignObject`, an embedded image or an external reference.

Downloaded 11 October 2026.

| File | Institution | Source (exact URL) | Bytes as downloaded | Bytes here | Licence or status stated at the source |
| --- | --- | --- | --- | --- | --- |
| `lse.svg` | London School of Economics and Political Science | https://upload.wikimedia.org/wikipedia/commons/5/51/LSE_Logo.svg (page: https://commons.wikimedia.org/wiki/File:LSE_Logo.svg) | 931 | 808 | Commons: "Public domain"; restrictions: "trademarked" |
| `oxford.svg` | University of Oxford | https://upload.wikimedia.org/wikipedia/commons/4/4e/Oxford_University-03.svg (page: https://commons.wikimedia.org/wiki/File:Oxford_University-03.svg) | 21207 | 21209 | Commons: "CC0" (uploader's "own work"; no trademark notice on the page, but the mark is the University's) |
| `academy-of-athens.png` | Academy of Athens | https://www.academyofathens.gr/images/logo/logo.png (the header logo of the Academy's own website) | 21146 | 10030 | None stated; the Academy's own mark, all rights reserved |
| `harvard.svg` | Harvard University | https://upload.wikimedia.org/wikipedia/commons/7/70/Harvard_University_logo.svg (page: https://commons.wikimedia.org/wiki/File:Harvard_University_logo.svg) | 42322 | 42506 | Commons: "Public domain"; restrictions: "trademarked" |
| `galileo-commission.png` | Galileo Commission (Scientific and Medical Network) | https://galileocommission.org/wp-content/uploads/2019/09/Branding-05.png (from the Commission's own website) | 12778 | 12778 | None stated; the Commission's own mark, all rights reserved |

## Edits to the local copies

A mask shows a file's opaque parts and hides its transparent parts, whatever their colour. Four files were changed so that they read correctly in one colour. No shape of any mark was redrawn.

- `lse.svg`: the source is a red square with white letters on top (as a mask: a plain square). The square and the letters are now one path with the even-odd rule, so the letters are cut out of the square. The path data is the source's, unchanged.
- `harvard.svg`: the source paints the white pages of the three books over the crimson shield (as a mask: a plain shield). The white path is now a mask that cuts the pages out of the shield; the letters VE RI TAS stay on top. A `viewBox` was added so the file scales. Path data unchanged.
- `oxford.svg`: only the `viewBox` was changed (from `0 0 1000 1000` to `187 187 627 627`) to trim the empty margin round the mark. The file was already one flat mark on a transparent ground (two tints, which show as one colour here).
- `academy-of-athens.png`: the source is a shaded engraving of the head of Athena between the words ΑΚΑΔΗΜΙΑ and ΑΘΗΝΩΝ. As a plain mask the head became a solid silhouette, so in the middle strip (the head) the darkness of the engraving was turned into opacity: its lines show, its lights are clear. The lettering keeps its own outline. Pixel size unchanged (286 × 93).
- `galileo-commission.png`: unchanged.

## Not included

- National and Kapodistrian University of Athens: Wikimedia Commons has only a JPEG; the University's own site offers its emblem on a white disc (a solid disc as a mask) and a "190 years" anniversary banner, not a plain mark.
- Center for Hellenic Studies (Harvard): its lighthouse mark exists as a PNG on chs.harvard.edu and could stand in place of the Harvard University mark if Athena prefers the Center's own.
- Universities of Patras and Toulouse 1 Capitole, the National Defence School, Athens College: not looked for (the row is kept to five marks).
