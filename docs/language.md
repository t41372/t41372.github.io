# Browser language and reading preference

`src/lib/site-language.js` is inlined in the head before body paint. It picks
the saved `site-language` (`en` or `zh`), otherwise the first supported language
in `navigator.languages`, otherwise English. Any Chinese locale, including
`zh-TW` and `zh-HK`, receives **Simplified Chinese UI** (`zh-Hans`). Automatic
selection is not saved as a manual override. The old `blog-lang` value is
ignored because the previous implementation saved English automatically.

`Localized.astro` and `Localized.tsx` render both texts on the server. CSS
shows only the selected span, so React hydrates the same DOM without a flash
of English or a text mismatch. Hidden copies also leave the accessibility
tree. Ordinary pages use the UI document language; articles retain their
actual content language. The Hero section explicitly stays `lang="en"`.

The compact navigation toggle, blog index buttons and article language links
all save an explicit selection. The choice remains in memory if storage is
blocked. Project names, code, technical labels and the authored Hero remain
English; descriptions and reading/navigation copy are bilingual.

The index points directly to the preferred article variant. A Chinese reader
opening a primary English article URL is sent to its Chinese variant with
`location.replace` on a hard load, or by the ClientRouter loader before a
client swap. Search parameters and fragments survive, and the current origin
is retained (including the independent github.io mirror and local preview).
An explicit `/zh` URL remains Chinese when shared with an English browser.
Clicking the article's EN link records English before Astro handles the click,
preventing a redirect loop. Hreflang and canonical metadata remain static and
reciprocal; without JavaScript, the existing language URLs and links work.

Locale application runs before incoming transition capture and again after
the swap for persistent components. The reading-context adapter matches the
stable article/card id, not a language-dependent href. It also forwards the
navigation language button when a native transition temporarily hit-tests the
nav surface as the document root.

`scripts/e2e-language.mjs` covers Chinese first paint, explicit overrides,
direct/client article selection, same-origin redirects, returning focus,
Simplified UI in a `zh-TW` browser, blocked storage, reloads, English Hero
content and English readers following explicit Chinese links.
