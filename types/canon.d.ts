// Generated from bin/vocab.mjs by scripts/gen-types.mjs. Do not edit.
//
// Canon's vocabulary as TypeScript. A closed vocabulary is a union type, so
// this is the R1 check moved from CI to the keystroke: `data-layout="stak"`
// stops compiling, and every attribute autocompletes with exactly the values
// canon-lint accepts.
//
// React only. Add it to your tsconfig "include", or import it once:
//
//   import 'canoncss/types';
//
// It augments React's HTMLAttributes, so it applies to every intrinsic element
// with no per-element wiring and no runtime cost. Every attribute is optional,
// so existing code keeps compiling; what changes is that a wrong value is now
// wrong at the keystroke.
//
// Values written as expressions (`data-variant={x}`) are checked against the
// union like anything else, which is the case canon-lint reports as opaque and
// cannot check at all.

import 'react';

declare module 'react' {
  interface HTMLAttributes<T> {
    /**
     * Canon layout primitive.
     */
    'data-layout'?: 'stack' | 'row' | 'grid' | 'sidebar' | 'centered' | 'hero' | 'split' | undefined;

    /**
     * Canon component role. Must sit on its canonical element (R5).
     *
     * `button` on `<button>` | `<a>`
     * `card` on `<article>` | `<div>` | `<section>` | `<li>` | `<a>` | `<blockquote>`
     * `badge` on `<span>`
     * `input` on `<input>`
     * `textarea` on `<textarea>`
     * `select` on `<select>`
     * `topbar` on `<header>`
     * `modal` on `<dialog>` | `<div>`
     * `avatar` on `<span>`
     * `stat` on `<span>`
     * `table` on `<table>`
     * `divider` on `<hr>` | `<div>`
     * `disclosure` on `<details>`
     * `nav` on `<nav>`
     * `stepper` on `<ol>`
     */
    'data-component'?: 'button' | 'card' | 'badge' | 'input' | 'textarea' | 'select' | 'topbar' | 'modal' | 'avatar' | 'stat' | 'table' | 'divider' | 'disclosure' | 'nav' | 'stepper' | undefined;

    /**
     * Gap between children, from the space scale.
     */
    'data-gap'?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | undefined;

    /**
     * Inner padding, from the space scale.
     */
    'data-padding'?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | undefined;

    /**
     * Cross-axis alignment.
     */
    'data-align'?: 'start' | 'center' | 'end' | 'stretch' | undefined;

    /**
     * Main-axis distribution.
     */
    'data-justify'?: 'start' | 'center' | 'end' | 'between' | 'around' | undefined;

    /**
     * Column count for data-layout="grid".
     */
    'data-cols'?: '1' | '2' | '3' | '4' | 'auto' | undefined;

    /**
     * Max width for data-layout="centered".
     */
    'data-width'?: 'prose' | 'content' | 'wide' | undefined;

    /**
     * Component size.
     */
    'data-size'?: 'sm' | 'md' | 'lg' | undefined;

    /**
     * Component variant.
     */
    'data-variant'?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'link' | 'neutral' | 'brand' | 'success' | 'warning' | 'error' | 'info' | 'strong' | 'featured' | undefined;

    /**
     * Validation state of a form control.
     */
    'data-state'?: 'error' | 'success' | 'complete' | undefined;

    /**
     * Text or surface tone.
     */
    'data-tone'?: 'subtle' | 'brand' | 'accent' | 'success' | 'error' | undefined;

    /**
     * Hide at this breakpoint.
     */
    'data-hide'?: 'mobile' | 'desktop' | undefined;

    /**
     * Motion preset. Auto-respects prefers-reduced-motion.
     */
    'data-motion'?: 'rise' | 'float' | 'pulse' | 'lift' | undefined;

    /**
     * Named region. Only valid as a direct child of its parent (R4).
     */
    'data-slot'?: 'header' | 'body' | 'footer' | 'media' | 'sidebar' | 'main' | 'brand' | 'nav' | 'actions' | 'menu' | 'panel' | undefined;

    /**
     * Colour scheme. Goes on <html>.
     */
    'data-theme'?: 'dark' | 'light' | undefined;

    /**
     * An extension component Canon does not have. Kebab-case, styled in @layer canon.app from tokens.
     */
    'data-x-component'?: string | undefined;

    /**
     * A named region of an extension component.
     */
    'data-x-slot'?: string | undefined;

    /**
     * A variant of an extension component. Any kebab-case value: this is where values Canon does not have go.
     */
    'data-x-variant'?: string | undefined;

    /**
     * A state of an extension component. Any kebab-case value.
     */
    'data-x-state'?: string | undefined;

    /**
     * Canon utility. Present or absent, no value.
     */
    'data-mono'?: boolean | '' | undefined;

    /**
     * Canon utility. Present or absent, no value.
     */
    'data-full'?: boolean | '' | undefined;

    /**
     * Canon utility. Present or absent, no value.
     */
    'data-truncate'?: boolean | '' | undefined;

    /**
     * Canon utility. Present or absent, no value.
     */
    'data-wrap'?: boolean | '' | undefined;
  }
}

export {};
