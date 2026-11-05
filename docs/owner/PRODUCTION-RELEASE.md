# Production release — 4 November 2026

Live: https://findmyinvite.com/akay

Deployment: dpl_EtMNTJ1vzX2jyeHApmMg4wHsCixz (findmyinvite-c89uy9ver-fmi-ai.vercel.app).
Previous production: dpl_NvBwKECoBLx8tFHz5KyT3qQ1NqC3.

The owner database migration was applied to the confirmed FMI project. Private tables have RLS enabled and no anonymous read access. AkayAdmin was provisioned using the existing salted password hash; no plaintext password was placed in source or deployment configuration. Production encryption was configured. Existing scheduled authorization remains in use.

Seven permanent order numbers were preserved from local review. No local test tasks, business fixtures, sessions or provider credentials were copied. The temporary release verification session was revoked after checks.

The staged production build passed before promotion. Public-domain verification returned HTTP 200 for the owner login, blog, sitemap and existing guest invitation. Authenticated owner reporting returned local=false, two website purchases, INR 2.36 collections and INR 2.00 net sales. Order #0007 is Bells & Blessings. Legacy operator cookies returned 401. Checkout remains configured at 100 paise plus 18 paise GST for six months. The production login page was also checked in the browser.

External Grok/ads/search accounts remain pending connection. Historical payments without sufficient dates/GST remain flagged. Prior local review documents describe the pre-release boundary; this record supersedes their deployment-pending status.
