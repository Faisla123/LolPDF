# Percent loader + LOL moment + home redesign checks - 8 October 2026

## Changes

- Removed the running chase loader. New opening: a plain 1-100% counter in oversized type, bottom left, with an orange disc that morphs crescent -> half -> full as the number climbs. The counter follows an irregular fixed timeline (about 2.7s), holds at 97 until fonts are ready (3s cap), then finishes to 100 in 240ms. A thin orange bar tracks the percent along the bottom edge. Studied the public reference https://assets.awwwards.com/awards/element/2022/10/6343ea6fc1ee9871240251.mp4 as a quality reference only; no code or assets taken.
- At 100% the completed orange disc grows a laughing face and the letters L and L slam in around it, spelling LOL with the laughing face as the O (squash-and-stretch pop, staggered overshoot entrances, about 1.25s dwell). No fade anywhere.
- The actual rendered LOL scene is then frozen into ten opaque horizontal viewport strips, 10% each with a half-pixel overlap. Strip 1 exits left, 2 right, continuing top-to-bottom, 90ms stagger, 900ms cubic-bezier travel. Home is already rendered behind the strips. Total first-tab opening about 6 seconds; slower font readiness can extend it.
- The strip clone drops the SVG mask reference so the duplicated mask id can never resolve against the hidden original scene (the mask is a no-op at 100%).
- Home page redesigned to feel hand-designed: editorial oversized Bricolage Grotesque headline with orange emphasis, rotated orange ticker marquee, section heads with mono index numbers (01-04), numbered tool cards, promise rows as hairline editorial lists instead of cards, two-column hairline extras list, tilted overlapping file window kept as the mascot moment. Black background, white text, orange buttons/scrollbar/accents retained.
- Runs once per tab, reduced-motion skips the intro, background inert + scroll lock until the reveal ends, touch cursor hidden on touch devices. All 24 tools, architecture, SEO pages, security headers/fixes untouched.

## Completed checks

- Production build: PASS, 27 SEO pages, sitemap.xml, robots.txt, manifest.
- Real tool/output tests against header-aware production preview: 36 passed, 0 failed. All 24 tools covered, including real background removal under shipped CSP.
- Responsive/UI/copy suite: 89 passed, 0 failed. Routes at 320/390/768/1440 widths, no horizontal overflow, copy/AI-label check, search, mobile menu, cursor, reduced motion, first-tab completion/session skip, inert interaction and CSP/runtime checks.
- Loader motion recorder: 34 passed. Actual desktop 960x640 and mobile 390x844 recordings using captured frame timestamps, not slowed playback. Counter at 12/52/90%, 100% completion, LOL letters + laughing face in view, ten opaque strips, alternating directions, 90ms sequence, restored interaction, no runtime errors, no CSP violations.
- Premium/theme checks: 51 passed. Tiny phone 320x568: counter and orb in viewport at 8/45/80%, 100% reached, LOL letters and face visible and in viewport, frozen strip clones with no running animations, 10% opaque strips, scroll lock/restore, black/white/orange computed values. All 24 tool routes checked at 390x844.
- Delayed route skeleton check: PASS, replaced by working file input.
- Static tensor adapter comparison: PASS for 3D/4D contiguous image tensors.
- npm audit: zero advisories at all severities, based on the current advisory database. Not a security warranty.
- Original ZIP comparison: 49 tool/library/package/security-config files byte-identical. No new dependencies, external requests, credentials or uploads. Service-worker cache bumped to lolpdf-lol-v6.
- Visual inspection: actual desktop/mobile loader recordings and sampled frames, counter/orb/LOL stills, mid-strip reveals, full desktop and mobile home, tablet home, tiny-phone LOL. Aligned strip scene with laughing orb intact, alternating exits, no clipped content in inspected pixels.

## Limits / launch gates

No public deployment performed. Local header tests do not establish that a live host sends the configured headers. Chrome was tested; Safari/Firefox, assistive technologies, hostile-file penetration tests and extreme file-size behavior are not certified. Existing IMG.LY AGPL source/publication gate remains unchanged. See LAUNCH-CHECKLIST.md and SECURITY-REVIEW.md. This is a visual/motion revision, not a claim that no security flaws can exist.
