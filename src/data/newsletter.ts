// Words of the newsletter popup that are not part of Athena's copy: its headline and description
// come from home.announcement.newsletter, everything else (labels, the button, the note shown
// while sign-up is not connected to a mailing service) lives here, in both languages.
import type { Locale } from '../lib/locale';

export const newsletter = {
  en: {
    label: 'Email address',
    placeholder: 'name@example.com',
    submit: 'Subscribe',
    close: 'Close',
    // Shown instead of the form after a valid address is entered, and to visitors without JavaScript.
    pending: 'Newsletter sign-up is not connected yet. Your address has not been sent anywhere.',
    pendingLink: 'Write to us through the contact form',
  },
  el: {
    label: 'Διεύθυνση email',
    placeholder: 'onoma@example.com',
    submit: 'Εγγραφή',
    close: 'Κλείσιμο',
    pending: 'Η εγγραφή στο ενημερωτικό δελτίο δεν είναι ακόμη διαθέσιμη. Η διεύθυνσή σας δεν στάλθηκε πουθενά.',
    pendingLink: 'Γράψτε μας μέσω της φόρμας επικοινωνίας',
  },
} satisfies Record<Locale, Record<string, string>>;
