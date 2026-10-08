# Security review - 7 October 2026

Scope: source inspection, dependency audit, local Chromium output tests, and the local header checks recorded in `REDESIGN-CHECKS.md`. This is not an independent security audit or a zero-vulnerability warranty.

- User text and file names render as React text, not HTML. No dynamic code execution or raw HTML sinks were found in application source.
- No backend, accounts, analytics, payment flow, or upload endpoint. Source has no file POST, beacon, or third-party disclosure path. Background-removal assets are fetched from staticimgly.com; photos are processed locally. A CSP host allowance alone is not proof of privacy.
- The Vercel configuration includes nosniff, no-referrer, DENY framing, blocked camera/microphone/location, and a restricted CSP. These headers must also be verified on the real deployed domain.
- Protect/unlock passwords stay in component memory; no source path stores them in URLs, logs or local storage. PDF protection uses qpdf AES-256. Weak passwords remain guessable.
- Recent activity stores file names and sizes locally, not file contents, and can be cleared. Anyone using that browser profile can see the recent file names.
- Browser and PDF parsers handle invalid data with messages, but hostile files and large-file resource exhaustion still require caution. No antivirus scanning or sandbox escape testing was performed.
- CSP retains inline styles for React and blob/wasm runtime allowances for local processing. No inline script or arbitrary eval allowance is present.
- The service-worker cache version changed so existing visitors get the redesign. Previously loaded assets can be reused offline; not all tools are pre-cached.

Release gates: see `LAUNCH-CHECKLIST.md`, particularly IMG.LY licensing and live-domain header/browser testing. A drawn signature is not a certified digital signature.
