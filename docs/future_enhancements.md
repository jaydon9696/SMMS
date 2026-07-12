# Future Enhancements

The architecture supports the following Phase 2+ features without major refactoring:

- **Mess Member Management**: Add `memberships` table with QR codes.
- **Student QR Meal Tracking**: Track meal redemptions.
- **Monthly Billing**: Add `billing` module and `invoices` table.
- **Inventory Management**: Add `inventory_items` and `stock_movements`.
- **Employee Management**: Add `employees` and `roles` tables.
- **Kitchen Display System**: Extend WebSocket to broadcast to kitchen screens.
- **Expense Tracking**: Add `expenses` table.
- **Loyalty Program**: Add `loyalty_points` table.
- **WhatsApp Notifications**: Add `NotificationService`.
- **Push Notifications**: Add `PushSubscription` table.
- **AI Analytics**: Add `reports` aggregation endpoints.
- **Multi-Branch Support**: Add `branches` table and tenant-aware queries.
- **SaaS Multi-Tenant Architecture**: Add `organizations` table and row-level tenancy.
- **Android & iOS Applications**: Reuse backend APIs and WebSockets.
