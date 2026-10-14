// Form messages in the site's own voice and look (client direction, 14 October 2026), instead of the
// browser's grey bubble: the field that needs attention is outlined, and a short line under it says
// why. The browser still decides what is missing; only how it is said changes.
//
// It answers every field inside a .field wrapper, on every form of the site. A form that checks its
// own fields (the test checkout) uses showError and clearError directly.

type Control = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

const words = {
  en: {
    missing: 'Please fill in this field.',
    choose: 'Please choose one.',
    email: 'Please enter a valid email address.',
  },
  el: {
    missing: 'Συμπληρώστε αυτό το πεδίο.',
    choose: 'Επιλέξτε μία απάντηση.',
    email: 'Συμπληρώστε μια έγκυρη διεύθυνση email.',
  },
};
const say = () => (document.documentElement.lang.startsWith('en') ? words.en : words.el);

const isControl = (el: EventTarget | null): el is Control =>
  el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement;

// What to say: the form's own words when it set them (setCustomValidity), else the site's.
function message(control: Control) {
  const v = control.validity;
  if (v.customError) return control.validationMessage;
  if (v.valueMissing) return control instanceof HTMLSelectElement ? say().choose : say().missing;
  if (v.typeMismatch && control.type === 'email') return say().email;
  return control.validationMessage;
}

// The element that takes focus for a control: the dropdown's own button stands in for its list.
const focusable = (control: Control) =>
  (control.id ? document.querySelector<HTMLElement>(`[data-stands-for="${control.id}"]`) : null) ?? control;

let counter = 0;
export function showError(control: Control, text: string) {
  const field = control.closest('.field');
  if (!field) return;
  let line = field.querySelector<HTMLElement>(':scope > .field__error');
  if (!line) {
    line = document.createElement('p');
    line.className = 'field__error';
    line.id = `field-error-${++counter}`;
    field.append(line);
  }
  line.textContent = text;
  control.setAttribute('aria-invalid', 'true');
  const described = new Set((control.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean));
  described.add(line.id);
  control.setAttribute('aria-describedby', [...described].join(' '));
}

export function clearError(control: Control) {
  const field = control.closest('.field');
  const line = field?.querySelector<HTMLElement>(':scope > .field__error');
  control.removeAttribute('aria-invalid');
  if (line) {
    const rest = (control.getAttribute('aria-describedby') ?? '').split(' ').filter((id) => id && id !== line.id);
    if (rest.length) control.setAttribute('aria-describedby', rest.join(' '));
    else control.removeAttribute('aria-describedby');
    line.remove();
  }
}

// The browser announces each field that fails, in order, when a form is sent.
document.addEventListener(
  'invalid',
  (event) => {
    const control = event.target;
    if (!isControl(control) || !control.closest('.field')) return;
    event.preventDefault(); // no bubble
    showError(control, message(control));
    // the first field that fails takes the focus
    const first = control.form?.querySelector(':invalid');
    if (first === control) focusable(control).focus();
  },
  true,
);

// As soon as a field is right, its line goes; while it is still wrong, the line says what is wrong now.
const recheck = (event: Event) => {
  const control = event.target;
  if (!isControl(control) || control.getAttribute('aria-invalid') !== 'true') return;
  if (control.validity.valid) clearError(control);
  else if (!control.closest('form')?.noValidate) showError(control, message(control));
};
// (after the form's own listeners, which may change what the field reports)
document.addEventListener('input', recheck);
document.addEventListener('change', recheck);
