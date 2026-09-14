# Finance — free-launch economics and spending control

**v1.0 is not a payments release.** Planned start is **14 September 2026, 23:59 IST**; the intended 30-day free creation window ends **14 October 2026, 23:59 IST**, end exclusive. There is no card collection or automatic charge. New creation stops after the configured window unless a later release implements purchasing.

## Financial ownership

| Decision | Named owner | Evidence |
| --- | --- | --- |
| Hosting plan and usage budget | TO ASSIGN — Finance/business owner | Approved plan and limits |
| Paid pricing, taxes and invoices | TO ASSIGN — Finance with business adviser | Approved commercial rules |
| Gateway/settlement readiness | TO ASSIGN — payments owner | Future provider activation and reconciliation plan |

Regular list prices are **Classic ₹1,199** and **Royal ₹1,499**, stored as integer paise: 119900 and 149900. These are reference SKU prices, not evidence of collected revenue. No actual customers, payments, conversion rate or revenue baseline is verified.

## Model and assumptions

| Model | Calculation / interpretation |
| --- | --- |
| Free-period creation revenue | ₹0 from eligible free creations |
| Future gross sales scenario | 1,199 × paid Classic orders + 1,499 × paid Royal orders |
| Contribution | Actual collected revenue less refunds, applicable taxes/fees and attributable serving costs |
| Serving cost per published invite | Attributable storage, delivery and function cost ÷ measured published invitations |

The model is not a forecast. Paid order counts and fee/tax treatment remain undefined; do not book displayed list prices as sales.

## Before, during and after launch

**Before:** review Vercel plan suitability. The last verified team plan was Hobby; commercial suitability is unresolved and no paid upgrade was performed. Supabase Free was selected, but that does not establish zero total operating cost. Review provider dashboards for current quotas, pricing and alerts; media delivery can dominate usage.

**During:** monitor spend/usage against approved thresholds and ensure the technical owner receives alerts. Avoid deleting customer data or stopping services without incident coordination when a budget threshold is crossed.

**After:** reconcile actual provider invoices and usage with measured activity. Define paid entitlement, refunds, payment reconciliation, taxation/invoicing and customer support before accepting money. Budget for isolated staging and verified backups rather than assuming current free/shared resources meet long-term needs.

Read [status](../STATUS.md), [risk register](../DECISIONS-AND-RISKS.md), [runbook](../RELEASE-RUNBOOK.md), and [handoff index](../index.md). Escalate unapproved recurring charges or plan conflicts to the business owner.
