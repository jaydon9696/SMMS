# Testing

## Unit Tests

Run backend unit tests:

```bash
make test
```

This installs dev dependencies and runs `pytest` in the backend container.

## Manual Testing Checklist

### Admin

1. Login at `http://localhost/login`.
2. Add menu categories and items.
3. View dashboard summary and live orders.
4. Create an order from the customer QR endpoint.
5. Update order status and see it reflected in live orders and table cards.
6. Mark an order as paid.
7. View reports for daily revenue and popular items.

### Customer

1. Open `http://localhost/order/table/1`.
2. Add items to cart and place order.
3. Track order status at `http://localhost/order/track/{order_id}`.
4. Verify status updates in real-time when admin updates the order.

### QR

1. Generate QR codes for table URLs (`/order/table/{number}`).
2. Standing order URL is `/order/standing`.
