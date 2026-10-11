# Institution marks (About page)

These are the trademarks of the institutions named. They are used on the About page (`src/components/about/Logos.astro`, three lines of four under the fourth paragraph of the "studies" block) **pending Athena's approval**. Each institution's own rules for the use of its name and mark apply; a licence note on Wikimedia Commons covers copyright only, not the trademark.

The files are never inlined into the page. They are used only as CSS masks over a block of the page's ink, so each shows in one colour (blue by day, light ink by night) and nothing inside a file can run. Every SVG was read as text on download: none contains a script, an event attribute, a `foreignObject`, an embedded image or an external reference. The other files are PNG images.

Downloaded 11 October 2026.

| File | Institution | Source (exact URL) | Bytes as downloaded | Bytes here | Licence or status stated at the source |
| --- | --- | --- | --- | --- | --- |
| `lse.svg` | London School of Economics and Political Science | https://upload.wikimedia.org/wikipedia/commons/5/51/LSE_Logo.svg (page: https://commons.wikimedia.org/wiki/File:LSE_Logo.svg) | 931 | 808 | Commons: "Public domain"; restrictions: "trademarked" |
| `oxford.svg` | University of Oxford | https://upload.wikimedia.org/wikipedia/commons/4/4e/Oxford_University-03.svg (page: https://commons.wikimedia.org/wiki/File:Oxford_University-03.svg) | 21207 | 21209 | Commons: "CC0" (uploader's "own work"; no trademark notice on the page, but the mark is the University's) |
| `academy-of-athens.png` | Academy of Athens | https://www.academyofathens.gr/images/logo/logo.png (the header logo of the Academy's own website) | 21146 | 10030 | None stated; the Academy's own mark, all rights reserved |
| `harvard.svg` | Harvard University | https://upload.wikimedia.org/wikipedia/commons/7/70/Harvard_University_logo.svg (page: https://commons.wikimedia.org/wiki/File:Harvard_University_logo.svg) | 42322 | 42506 | Commons: "Public domain"; restrictions: "trademarked" |
| `galileo-commission.png` | Galileo Commission (Scientific and Medical Network) | https://galileocommission.org/wp-content/uploads/2019/09/Branding-05.png (from the Commission's own website) | 12778 | 12778 | None stated; the Commission's own mark, all rights reserved |
| `athens-college.png` | Athens College (Hellenic-American Educational Foundation) | https://www.athenscollege.edu.gr/images/default-source/default-album/athens-college-logo_header_nodate_gr.png (the header logo of the College's own website) | 162291 | 31344 | None stated; the College's own mark, all rights reserved |
| `center-for-hellenic-studies.png` | Center for Hellenic Studies, Harvard University | https://chs.harvard.edu/wp-content/themes/orpheus/static/images/chs_logo_lighthouse.png (the header logo of the Center's own website) | 37532 | 37532 | None stated; the Center's own mark, all rights reserved |
| `athens.png` | National and Kapodistrian University of Athens | http://share.uoa.gr/public/Documents/new-logo/LOGO_UOA%20b_w.jpg (the black-and-white emblem on the University's own logo page, http://share.uoa.gr/public/Documents/new-logo/index.html, linked from uoa.gr) | 135791 | 47870 | None stated on the page; it also offers the University's logo manual (`logotypos_odigies.pdf`, `UOA MANUAL LOGO.pdf`), not read here: its rules apply |
| `patras.png` | University of Patras | https://www.upatras.gr/wp-content/uploads/fav.png (the full emblem and wordmark behind the site icon of the University's own website) | 545473 | 74558 | None stated; the University's own mark, all rights reserved |
| `toulouse-capitole.png` | Université Toulouse Capitole | https://www.ut-capitole.fr/jsp_utc2017/styles/img/logo-fr.jpg (the header logo of the University's own website) | 25254 | 5713 | None stated; the University's own mark, all rights reserved |
| `national-defence-college.png` | Hellenic National Defence College (Σχολή Εθνικής Άμυνας) | https://setha.army.gr/wp-content/uploads/2022/05/logo_el-2.png (the header emblem of the College's own website) | 15585 | 5122 | None stated; a state military emblem, all rights reserved |
| `scientific-and-medical-network.png` | Scientific and Medical Network | https://scientificandmedical.net/wp-content/uploads/2023/06/LogoWordmark96dpi.png (the header logo of the Network's own website) | 17348 | 17348 | None stated; the Network's own mark, all rights reserved |

## Edits to the local copies

A mask shows a file's opaque parts and hides its transparent parts, whatever their colour. Nine files were changed so that they read correctly in one colour. No shape of any mark was redrawn: the raster files were only given a new transparency, worked out from their own tones, and had empty margins trimmed.

- `lse.svg`: the source is a red square with white letters on top (as a mask: a plain square). The square and the letters are now one path with the even-odd rule, so the letters are cut out of the square. The path data is the source's, unchanged.
- `harvard.svg`: the source paints the white pages of the three books over the crimson shield (as a mask: a plain shield). The white path is now a mask that cuts the pages out of the shield; the letters VE RI TAS stay on top. A `viewBox` was added so the file scales. Path data unchanged.
- `oxford.svg`: only the `viewBox` was changed (from `0 0 1000 1000` to `187 187 627 627`) to trim the empty margin round the mark. The file was already one flat mark on a transparent ground (two tints, which show as one colour here).
- `academy-of-athens.png`: the source is a shaded engraving of the head of Athena between the words ΑΚΑΔΗΜΙΑ and ΑΘΗΝΩΝ. As a plain mask the head became a solid silhouette, so in the middle strip (the head) the darkness of the engraving was turned into opacity: its lines show, its lights are clear. The lettering keeps its own outline. Pixel size unchanged (286 × 93).
- `athens.png`: the source is the black engraving of the head of Athena on white (a JPEG, so a plain rectangle as a mask). Its darkness was turned into opacity: the lines show, the white ground is clear. Empty margin trimmed (430 × 556 to 250 × 390).
- `patras.png`: the source is maroon and gold on a transparent ground, with cream inside the seal and white letters on a gold bar. Darkness was turned into opacity, with maroon and gold both fully opaque: the seal's ring and the bar are solid, their lettering and the cream ground are cut out. Empty margin trimmed (2028 × 736 to 1910 × 618).
- `toulouse-capitole.png`: the source is a red square with white lettering and a white seal (a JPEG). Darkness was turned into opacity: the square is solid and the lettering and seal are cut out of it, as in the LSE mark. White margin trimmed (158 × 158 to 128 × 134).
- `national-defence-college.png`: the source is a red shield with a white band and a shaded figure. Darkness was turned into opacity: the shield is solid, the band's ground and the figure's lights are clear. Margin trimmed (93 × 118 to 85 × 102). The source is very small.
- `athens-college.png`: the source has white lettering on a transparent ground beside a crest in blue, red and gold. Here lightness was turned into opacity (the way the mark prints in one colour on a dark ground): the lettering, the gold outline, wreath, ribbon and the four devices are opaque, the blue and red fields are clear. Margin trimmed (2237 × 698 to 2217 × 669). The source is the College's centenary lockup: it carries "100 χρόνια" and "1925 - 2025".
- `galileo-commission.png`, `center-for-hellenic-studies.png`, `scientific-and-medical-network.png`: unchanged (each is already a flat mark on a transparent ground; the Center's two colours and the Network's two colours show as one).

## Not included

- Usui Reiki (the "Master Usui Reiki" degree): there is no institution behind it and no official mark, so nothing stands for it. No generic symbol was used.
- Every institution the About text names now has a mark. For the University of Athens, Wikimedia Commons has only a JPEG of the emblem; the University's own black-and-white file was used instead.
