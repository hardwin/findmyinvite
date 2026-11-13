# Sales reporting and table correction

Local review only; no production deployment or database mutation was performed.

The reported payment belongs to Bells & Blessings. FMI records it as captured for 118 paise, including 18 paise GST, and applied to its invitation at 2026-11-04T09:10:36.933883Z. The live Razorpay re-query returned HTTP 401 with the available local credentials; fresh gateway verification and bank settlement were not verified.

The dashboard incorrectly excluded already-applied, captured payments when the older schema lacked captured_at. Dated reporting now prioritizes verified capture timestamps, then uses the recorded application time for captured/refunded invitation payments. This fallback is explicitly labelled in order details. Original timestamps remain unchanged. Creation dates never imply payment receipt. Records with no reliable reporting date or unknown GST remain flagged.

This payment now contributes INR 1.18 collections, INR 0.18 GST and INR 1.00 net sales. At verification, the two recorded current website purchases totalled INR 2.36 collections and INR 2.00 net sales.

Sales rows have permanent server-allocated incremental numbers, template names/SKUs, Amount Paid, GST, relative creation time, exact date on hover, full ID on hover/focus and Copy. Rows open details by click, Enter or Space. Unpaid orders display no paid amount. Newest orders appear first. Numbers persist across filters and sorting. Number allocation is transactional and private in both local SQLite and the prepared PostgreSQL migration.

Validation: 37 owner/payment/publication tests passed, including reporting fallback, no fabricated capture dates, stable numbering, SQL permissions, financial and payment regressions. Browser checks verified revenue display, product identity, row click, keyboard opening and copy-success feedback. The browser automation clipboard reader did not mirror the native browser clipboard, so clipboard contents were not independently verified. Production build passed.
