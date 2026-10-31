# Deployment source cleanup — 31 October 2026

Removed historical `output/`, `FindMyInvite_Cursor_Handoff_2026-10-08_docs-and-code/`, `template_lab/`, and scratch `work/` files from the Git index. Local files are preserved and ignored; `work/assembly-inbox/.gitkeep` remains tracked. These paths are not inputs to the storefront, CMS, payment handlers or active assembly/export modules.

The complete tracked originals remain in commit `1fdeee6e78e832ecab50d6835192feee61310530`. Recover selected paths with `git archive` into a separate directory, rather than restoring bulky files into the active source tree. Git history has not been rewritten; historical objects can still affect clone size depending on the hosting provider's clone strategy.

Removed unused direct dependencies: `@radix-ui/react-separator`, `@radix-ui/react-tooltip`, `canvas-confetti`, `razorpay`, `@types/canvas-confetti`, and `@types/gsap`. Razorpay payments already use server-side HTTP requests and the browser checkout script; they do not use the removed SDK. FFmpeg, Chromium, Playwright and Puppeteer remain because the assembly/export workflows use them.

Production Vite builds no longer import the local API router and its entire backend dependency graph. Development still loads that same router. Use normal Git-triggered Vercel deployments to reuse build cache; avoid forced uncached redeployments unless diagnosing a cache issue.

Validation compares the broad server suite against the prior release (255 passed, 21 existing failures, 7 explicitly archived POC tests skipped), runs the production build and checks the deployed public catalog, version APIs and live payment configuration. Historical test failures are not evidence that those features were fully verified.
