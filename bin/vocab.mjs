// The Canon vocabulary, as data. Single source of truth for canon-lint and for
// the generated VS Code html.customData file.

// The cascade order, in order. build.sh emits the @layer statement from this
// and canon-lint validates against it (R11), so the two cannot drift.
// canon.theme and canon.app are the two Canon declares and leaves empty.
export const LAYERS = ['canon.reset', 'canon.tokens', 'canon.layouts', 'canon.components', 'canon.utilities', 'canon.theme', 'canon.app'];

export const LAYOUTS = new Set(['stack', 'row', 'grid', 'sidebar', 'centered', 'hero', 'split']);
export const COMPONENTS = new Set(['button', 'card', 'badge', 'input', 'textarea', 'select', 'topbar', 'modal', 'avatar', 'stat', 'table', 'divider', 'disclosure', 'nav', 'stepper', 'alert', 'breadcrumb']);
const SCALE = new Set(['xs', 'sm', 'md', 'lg', 'xl', '2xl']);

export const VOCAB = {
  'data-layout': LAYOUTS,
  'data-component': COMPONENTS,
  'data-gap': SCALE,
  'data-padding': SCALE,
  'data-align': new Set(['start', 'center', 'end', 'stretch']),
  'data-justify': new Set(['start', 'center', 'end', 'between', 'around']),
  'data-cols': new Set(['1', '2', '3', '4', 'auto']),
  'data-width': new Set(['prose', 'content', 'wide']),
  'data-size': new Set(['sm', 'md', 'lg']),
  // ponytail: the union of every component's variants; split per component if it matters
  'data-variant': new Set(['primary', 'secondary', 'ghost', 'danger', 'link', 'neutral', 'brand', 'success', 'warning', 'error', 'info', 'strong', 'featured']),
  'data-state': new Set(['error', 'success', 'complete']),
  'data-tone': new Set(['subtle', 'brand', 'accent', 'success', 'error']),
  'data-hide': new Set(['mobile', 'desktop']),
  'data-motion': new Set(['rise', 'float', 'pulse', 'lift']),
  'data-slot': new Set(['header', 'body', 'footer', 'media', 'sidebar', 'main', 'brand', 'nav', 'actions', 'menu', 'panel']),
  'data-theme': new Set(['dark', 'light']),
};

// R5: the HTML elements each component role may sit on. A role is a promise
// about behaviour, not just about looks - <div data-component="button"> is not
// focusable, not keyboard-operable and not announced as a button.
export const ELEMENTS = {
  button: new Set(['button', 'a']),
  card: new Set(['article', 'div', 'section', 'li', 'a', 'blockquote']),
  badge: new Set(['span']),
  input: new Set(['input']),
  textarea: new Set(['textarea']),
  select: new Set(['select']),
  topbar: new Set(['header']),
  modal: new Set(['dialog', 'div']),
  avatar: new Set(['span']),
  stat: new Set(['span']),
  table: new Set(['table']),
  divider: new Set(['hr', 'div']),
  disclosure: new Set(['details']),
  nav: new Set(['nav']),
  stepper: new Set(['ol']),
  // A block-level message. Not <p>: it holds a heading and a paragraph, and a
  // <p> cannot contain either.
  alert: new Set(['div', 'section', 'aside']),
  // Navigation wrapping an ordered list, so it sits on <nav> for the same
  // reason `nav` does.
  breadcrumb: new Set(['nav']),
};

export const DESC = {
  'data-layout': 'Canon layout primitive.',
  'data-component': 'Canon component role. Must sit on its canonical element (R5).',
  'data-gap': 'Gap between children, from the space scale.',
  'data-padding': 'Inner padding, from the space scale.',
  'data-align': 'Cross-axis alignment.',
  'data-justify': 'Main-axis distribution.',
  'data-cols': 'Column count for data-layout="grid".',
  'data-width': 'Max width for data-layout="centered".',
  'data-size': 'Component size.',
  'data-variant': 'Component variant.',
  'data-state': 'Validation state of a form control.',
  'data-tone': 'Text or surface tone.',
  'data-hide': 'Hide at this breakpoint.',
  'data-motion': 'Motion preset. Auto-respects prefers-reduced-motion.',
  'data-slot': 'Named region. Only valid as a direct child of its parent (R4).',
  'data-theme': 'Colour scheme. Goes on <html>.',
};
