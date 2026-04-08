# Payment API Documentation

## Payment Initialization

### Endpoint
`POST /api/v1/payments/initiate/`

### Request

**Headers:**
```
Authorization: Token {authToken}
Content-Type: application/json
```

**Body:**
```json
{
  "cart_id": 123,
  "gateway": "KHALTI",
  "bank": "1",
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "customer_phone": "9800000001",
  "address": "Kathmandu, Nepal",
  "city": "Kathmandu",
  "state": "Kathmandu",
  "zip_code": "44600",
  "tax_amount": 0,
  "shipping_cost": 0
}
```

### Response - Success

**Status Code:** 200

```json
{
  "status": "success",
  "payment_url": "https://khalti.com/checkout/pay/?pidx=1704067140_",
  "transaction_id": "TXN_1234567890",
  "pidx": "1704067140_",
  "amount": 50000
}
```

### Response - Error

**Status Code:** 400/500

```json
{
  "status": "error",
  "message": "Cart not found or is empty"
}
```

---

## Payment Verification

### Endpoint
`POST /api/v1/payments/verify/`

### Request

**Headers:**
```
Authorization: Token {authToken}
Content-Type: application/json
```

**Body:**
```json
{
  "pidx": "1704067140_",
  "reference": "TXN_1234567890"
}
```

### Response - Success

**Status Code:** 200

```json
{
  "status": "success",
  "payment_status": "COMPLETED",
  "message": "Payment verified successfully",
  "data": {
    "transaction_id": "TXN_1234567890",
    "pidx": "1704067140_",
    "payment_status": "COMPLETED",
    "marketplace_order": {
      "id": 456,
      "order_number": "ORD-2024-001",
      "total_amount": "50000",
      "payment_status": "completed",
      "payment_status_display": "Completed",
      "order_status": "pending_confirmation",
      "order_status_display": "Pending Confirmation"
    },
    "amount": 50000
  }
}
```

### Response - Failure

**Status Code:** 400

```json
{
  "status": "failure",
  "payment_status": "FAILED",
  "message": "Payment verification failed"
}
```

---

## Payment Status Values

| Status | Description |
|--------|-------------|
| `Completed` | Payment successfully processed |
| `Pending` | Payment is pending verification |
| `User canceled` | User cancelled the payment |
| `Expired` | Payment request expired |
| `Failed` | Payment transaction failed |

---

## Implementation Notes

### Payment Flow

1. **Initialize Payment** → Call `/api/v1/payments/initiate/` with cart and delivery info
2. **Redirect to Gateway** → User is redirected to payment gateway (Khalti) using `payment_url`
3. **Gateway Redirect Back** → Payment gateway redirects back to your app with `pidx` and `status` query parameters
4. **Verify Payment** → Call `/api/v1/payments/verify/` with `pidx` to confirm payment
5. **Create Order** → Backend creates MarketplaceOrder after successful verification

### Query Parameters on Return

When redirected back from payment gateway:
- `pidx`: Payment identifier from gateway
- `status`: Payment status (`Completed`, `User canceled`, `Expired`, `Failed`)

Example return URL:
```
https://yourfrontend.com/payment/success?pidx=1704067140_&status=Completed
```

### Base URL

```
${VITE_REACT_APP_API_URL}/api/v1/
```

### Special Cases

#### COD (Cash on Delivery)
- Skips payment gateway entirely
- Directly redirects to `/payment/success`
- No `pidx` or `status` parameters

#### Error Handling
- Missing `pidx`: Cannot verify payment
- Payment not completed: Show error message
- Verification failure: Contact support

### Code References

- Payment initiation: [Payment.tsx](src/components/Payment.tsx#L205-L208)
- Payment verification: [PaymentSuccess.tsx](src/components/PaymentSuccess.tsx#L109-L113)
- Khalti service: [khaltiService.ts](src/core/services/khaltiService.ts)
