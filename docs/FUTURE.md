# Future roadmap

The Phase 1 schema and module boundaries support extension without putting
unreleased concepts into the active workflow.

## Near-term hardening

- Transactional outbox plus Redis/broker WebSocket fan-out.
- Tenant slug/domain resolution and tenant-aware login.
- Branch entity, branch timezone and business-day configuration.
- Refresh-token rotation, asymmetric JWT keys and session revocation.
- PostgreSQL integration/concurrency tests and browser end-to-end tests.
- Structured metrics, traces, audit export and backup alerts.
- Cloudinary asset cleanup on permanent deletion.

## Product modules

- Mess member and student identities.
- Student meal QR tracking and entitlement rules.
- Monthly plans, billing, invoices and payment gateways.
- Razorpay and UPI payment intents/webhooks.
- Inventory, recipes, purchase orders and stock alerts.
- Employees, schedules and permission roles.
- Kitchen display and preparation stations.
- Expenses, cash reconciliation and profit reporting.
- Loyalty, coupons and customer profiles.
- WhatsApp and push notification adapters.
- Forecasting and AI-assisted analytics.
- Multi-branch operations and SaaS tenant administration.
- Mobile applications using the same versioned API.

Each module should own its model, service, repository, API and tests. Introduce
new deployment services only when scale, fault isolation or team ownership makes
the operational cost worthwhile.
