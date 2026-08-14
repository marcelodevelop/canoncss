// R10 fixture for the htmlFor spelling, in both directions.
//
// React's only valid spelling of the label-association attribute is htmlFor;
// the labelled-id collector matched `for` alone, so every correctly labelled
// control in a .jsx/.tsx file drew an R10. Measured: 11 of 11 R10s in one
// React project were this false positive, and the old message named the one
// spelling that project could not use, leaving aria-label as the only
// actionable advice on controls that already had a visible label.
//
// Two assertions, and the second is the one that keeps this honest:
//
//   1. <label htmlFor="filter-name"> naming <input id="filter-name"> is a
//      correctly labelled control and must lint clean.
//   2. <label htmlFor="filter-city"> points at an id no control carries, so
//      <input id="filter-region"> must STILL draw an R10. Without this,
//      "accepts htmlFor" is indistinguishable from "R10 never fires in JSX".
//
// So this file must produce exactly one violation, and it must be R10.

export const Filters = () => (
  <div data-layout="stack" data-gap="md">
    <label htmlFor="filter-name">Name</label>
    <input data-component="input" id="filter-name" />

    <label htmlFor="filter-city">City</label>
    <input data-component="input" id="filter-region" />
  </div>
);
