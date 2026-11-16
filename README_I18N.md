# Admin interface language

The admin frontend is English-only and uses a left-to-right layout on every page.
Language switches, Persian translations, and RTL-specific styles have been removed.

- Shared English labels: `src/locales/en.ts`.
- Existing components can keep using `const { t } = useLanguage()`.
- `src/contexts/language-context.tsx` returns English labels directly; no provider or saved language preference is needed.
- `src/app/layout.tsx` sets `lang="en"` and `dir="ltr"` and loads Inter.
- Old `localStorage.language` values are ignored, so previous Persian selections cannot reverse the layout.

To change interface copy, edit `src/locales/en.ts` or the English label in the relevant component.
The multilingual instructions in the original template documents no longer apply.
