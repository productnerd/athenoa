// Words of the newsletter popup that are not part of Athena's copy: its headline and description
// come from home.announcement.newsletter, everything else (labels, the button, the note shown
// while sign-up is not connected to a mailing service) lives here, in both languages.
// The field label and placeholder repeat those of the contact form (about.contact).
import type { MainLocale as Locale } from '../lib/locale';

export const newsletter = {
  en: {
    label: 'Email',
    placeholder: 'example@mail.com',
    submit: 'Subscribe',
    close: 'Close',
    // Shown instead of the form after a valid address is entered, and to visitors without JavaScript.
    pending: 'Newsletter sign-up is not connected yet. Your address has not been sent anywhere.',
    pendingLink: 'Write to us through the contact form',
  },
  el: {
    label: 'Email',
    placeholder: 'example@mail.com',
    submit: 'Εγγραφή',
    close: 'Κλείσιμο',
    pending: 'Η εγγραφή στο ενημερωτικό δελτίο δεν είναι ακόμη διαθέσιμη. Η διεύθυνσή σας δεν στάλθηκε πουθενά.',
    pendingLink: 'Γράψτε μας μέσω της φόρμας επικοινωνίας',
  },
} satisfies Record<Locale, Record<string, string>>;
