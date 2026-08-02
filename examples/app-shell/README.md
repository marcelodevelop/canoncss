# App shell example

Mail-style app in dark mode (`data-theme="dark"` on `<html>`): topbar,
sidebar navigation, inbox list of cards, and a modal rendered open.

The modal is open on purpose — Canon ships zero JavaScript, so open/close
behaviour belongs to the consumer. Delete the modal block to see the shell.

Patterns shown: dark mode, `sidebar` slots, card-as-list-row, badges as
labels, modal panel slots, form controls inside a modal.

Open `index.html` in a browser (build `dist/canon.css` first: `npm run build`).
