# Atlas settings

A single settings page for a fictional team workspace, written with nothing but the Canon CSS vocabulary and no page level CSS of any kind. It exercises the `sidebar` layout with its `sidebar` and `main` slots, the `topbar` with `brand` and `actions` slots, and the `nav` component using `aria-current="page"` to mark the open section.

Inside the main column it puts `card` (header, body and footer slots), `input`, `button`, `badge`, `table`, `divider` and the zero JavaScript `disclosure` to work, along with bare prose checkboxes wrapped in their own labels. Layout is done entirely with `stack` and `row` plus `data-gap`, `data-justify` and `data-align`, and the only utilities used are `data-tone`, `data-mono`, `data-hide` and `class="sr-only"`.

It is meant as a vocabulary coverage test: a realistic, form heavy, data heavy screen that a design system gets asked for constantly, built without a single hardcoded colour, size or spacing value.
