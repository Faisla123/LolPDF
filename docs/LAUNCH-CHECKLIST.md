# Before public launch

This is a complete local-first toolbox, not a guarantee of zero vulnerabilities.

1. Set the real site URL and contact email in `src/config/site.js`. The supplied URL is a placeholder, not a deployed site. `hello@example.com` is not a working support inbox.
2. Background removal uses `@imgly/background-removal` 1.7.0, licensed under AGPL-3.0. Its upstream notice and third-party notices are included in `docs/licenses/`. Keeping a private source ZIP is not a public corresponding-source offer. Before publishing, review the obligations for this combined application and its dependencies, provide the required corresponding source and notices to visitors where applicable, or obtain an appropriate alternate license / replace this dependency. The passport tool's optional white-background step uses the same dependency. Do not remove required notices to satisfy a visual preference.
3. Test on the actual deployed domain. `vite preview` does not apply `vercel.json` response headers. Check the CSP and the background remover there, and test representative files in the browsers you intend to support.
4. Run `npm ci`, `npm run build`, `npm test`, and `npm audit` before a release. Recheck dependencies regularly. An audit with no advisories is not a penetration test or proof that the application has no flaws.
5. Offline behavior covers previously fetched assets only. An unused tool, or the first background-removal run, needs internet. A phone can run out of memory with large files.

Licensing source: https://github.com/imgly/background-removal-js
No public deployment, source publication, or license decision was made as part of this redesign.
