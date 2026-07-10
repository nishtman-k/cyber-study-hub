// Next.js ships type declarations for `*.module.css` (CSS Modules) but not for
// plain stylesheet imports. Under TypeScript's `noUncheckedSideEffectImports`
// rule, a side-effect import like `import './globals.css'` then reports TS2882.
//
// Declaring the module tells TypeScript the import is valid. It has no runtime
// effect — Next's build pipeline handles the actual CSS.
declare module '*.css';
