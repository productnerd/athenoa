# Text changes against the live site

Source: athenoa.academy/en and /en/contactus, read on 2026-10-10. Everything else is word for word.

## Typos fixed

| Where | Live site | New site |
|---|---|---|
| Home, new course series | delve int the non-dual teaching | delve into the non-dual teaching |
| Course, "In our meetings" | “all knowledge is Remembrance’", says Socrates | “all knowledge is Remembrance”, says Socrates |
| Course, "Course Structure" | Socrate’s secret Female Master | Socrates’ secret Female Master |
| Course, registration | Access to all recording for 120 days | Access to all recordings for 120 days |
| About, story | activation of Εὖ Ζῆν.(Good Living). | activation of Εὖ Ζῆν (Good Living). |
| About and course | "Eὖ Zῆν" typed with Latin E and Z | Εὖ Ζῆν in Greek letters |
| Course, "Orientation" | “ΕF ZEN” typed with a Greek Ε | “EF ZEN” in Latin letters |
| Contact form placeholder | Describe the topic your request | Describe the topic of your request |
| Home, membership, Our Community | You will immerse in the activities | You will be immersed in the activities |
| Course tab label | "AccessLive sessions & recorded lessons" (run together) | "Access" / "Live sessions & recorded lessons" |

## Greek or mistranslated interface labels put into English

| Where | Live site | New site |
|---|---|---|
| Home, course series button | Ξεκινήστε | Get started |
| Home, course registration button | Ξεκινήστε | Get started |
| Contact form, name placeholder | Ονοματεπώνυμο | Full name |
| Contact form, submit button | Transfer | Send |

## Structural changes you asked for

- "About Us" is now "About Athena"; the contact form moved to the bottom of that page.
- Footer: "Who We Are" removed (its two sentences are still used for search descriptions), developer credit removed.
- Sign in, the Greek language switch (it led nowhere) and the cookie banner are gone. The new site sets no cookies.

## New wording that did not exist before

The enrol popup needs labels the live site never had (for example "View course", "Your details", "Continue to payment", "Pay with Stripe"). They are all in one place for review: `coursesPage.ui` in `src/data/courses.ts`.

## 404 page and joined lines (11 October 2026, at Maria's request)

- The not-found page no longer shows the Democritus sentence on eudaimonia. In its place, in the reading face: "Not everybody who wanders is lost" (Greek: «Δεν είναι χαμένοι όλοι όσοι περιπλανιούνται»).
- Its button reads "Back to Ithaka" (Greek: «Πίσω στην Ιθάκη»); first "Take me home", then "Take me to Ithaka". The credit to Cavafy under the Greek note is no longer shown. The note under it is unchanged: "but let the journey be long and filled with adventures" in English, Cavafy's own line in Greek.
- Home, "Let's Get Started": Athena's two lines are shown as one block of text. The words are unchanged.

## About page (11 October 2026, at Maria's request)

- The translation after ΓΝΩΘΙ ΣΑΥΤΟΝ lost its brackets: “Know Thyself”. instead of (“Know Thyself”). The same in Greek and Ancient Greek.
- Menu items are shown in capitals (by the stylesheet; the words themselves are unchanged).

## Waitlist wording (11 October 2026, new; the live site has no waitlist)

For courses that are not open yet. All of it is in `coursesPage.ui` (`joinWaitlist`, `waitlist`) in `src/data/courses.ts`, `src/data/el/courses.ts` and `src/data/grc/courses.ts`.

| | English | Greek | Ancient Greek (draft) |
|---|---|---|---|
| Button | Join waitlist | Λίστα αναμονής | Ἀπογράψασθε |
| Popup title | Join the waitlist | Εγγραφείτε στη λίστα αναμονής | Ὁ τῶν περιμενόντων κατάλογος |
| Line above the course name | For the course | Για τον κύκλο μαθημάτων | Εἰς τὸ μάθημα |
| Submit | Add me to the list | Προσθέστε με στη λίστα | Ἀπογράψατέ με |
| Shown after submitting, until it is connected | The waitlist is not connected yet. Your address has not been sent anywhere. | Η λίστα αναμονής δεν είναι ακόμη διαθέσιμη. Η διεύθυνσή σας δεν στάλθηκε πουθενά. | Ὁ κατάλογος οὔπω συνῆπται. Οὐδὲν τῶν ὑμετέρων οὐδαμοῖ πέπεμπται. |

## Ancient Greek (11 October 2026)

The whole site also exists in Ancient Greek under `/grc/`, as a machine-drafted translation in `src/data/grc/` that Athena has not read. It is kept out of search engines. The translator's notes on word choices (for example τὸ μὴ δύο εἶναι for "non-duality") are in the session report of that day.

## Left as written, for Athena to decide

See the end of this file once the proofreading pass is in.
