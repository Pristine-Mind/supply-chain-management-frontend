# Backend Implementation Specifications: Price & Quantity Negotiation

This document outlines the required backend changes to support the buyer-seller negotiation feature for B2B products.

## 1. Database models

### Negotiation Model
Tracks the overall state of a negotiation between a buyer and a seller for a specific product.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | BigInt | Primary Key |
| `buyer` | User (FK) | The user proposing the deal. |
| `seller` | User (FK) | The seller owning the product. |
| `product` | Product (FK) | The product being negotiated. |
| `proposed_price` | Decimal | The most recently proposed price. |
| `proposed_quantity` | Integer | The most recently proposed quantity. |
| `status` | Char(20) | Enum: `PENDING`, `ACCEPTED`, `REJECTED`, `COUNTER_OFFER`. |
| `last_offer_by` | User (FK) | Tracks who sent the last proposal to control turn-based actions. |
| `created_at` | DateTime | Auto-now-add timestamp. |
| `updated_at` | DateTime | Auto-now timestamp. |

### NegotiationHistory Model
Stores every iteration of the negotiation for auditing and chat-style history.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | BigInt | Primary Key |
| `negotiation` | Negotiation (FK) | Parent negotiation object. |
| `offer_by` | User (FK) | User who made this specific offer. |
| `price` | Decimal | Proposed price in this step. |
| `quantity` | Integer | Proposed quantity in this step. |
| `message` | Text | Optional note/message accompanying the offer. |
| `timestamp` | DateTime | Auto-now-add. |

---

## 2. API Endpoints

### `POST /api/v1/negotiations/`
**Action**: Create a new negotiation.
- **Request Body**: `{ product_id, proposed_price, proposed_quantity, message }`
- **Validation**: 
  - Ensure product exists.
  - Automatically set `buyer` to current user.
  - Automatically set `seller` to product owner.
  - Initial status: `PENDING`.
  - Initial `last_offer_by`: current user.

### `GET /api/v1/negotiations/`
**Action**: List negotiations for the authenticated user.
- **Filter**: Should return records where `buyer == user` OR `seller == user`.
- **Query Params**: `status`, `product_id`.

### `GET /api/v1/negotiations/active/`
**Action**: Helper to find an active (non-rejected/non-accepted) negotiation for a specific product.
- **Request Params**: `?product=<id>`
- **Logic**: Returns the single `Negotiation` object if one exists between the requester and the product owner that is still "open".

### `PATCH /api/v1/negotiations/:id/`
**Action**: Update status or send a counter-offer.
- **Allowed Transitions**:
  - `ACCEPTED`: Only if current user is NOT `last_offer_by`.
  - `REJECTED`: By either party.
  - `COUNTER_OFFER`: Only if current user is NOT `last_offer_by`. Update `proposed_price`, `proposed_quantity`, and `last_offer_by`.
- **Logic**: Every `PATCH` that changes price/quantity should create a new `NegotiationHistory` record.

---

## 3. Business Logic & Edge Cases

### Turn-Based Validation
To prevent a user from spamming offers or "accepting their own price", the logic must enforce that only the receiving party can `ACCEPT` or `COUNTER`. If User A sends an offer, User A cannot perform any action until User B responds (except perhaps cancelling/retracting).

### Order Integration (CRITICAL)
When an order is placed (`POST /api/v1/orders/`):
1. The backend must check if the `listed_price` in the order matches the actual product price.
2. If it **doesn't match**, the backend must check for an `ACCEPTED` negotiation for that specific user and product.
3. If a valid `ACCEPTED` negotiation exists, the order is permitted at the negotiated price.
4. If no such negotiation exists, the order should be rejected with a `400 Bad Request` (Price Mismatch).

### Stock Management
- Negotiation does **not** reserve stock.
- If a product sells out while a negotiation is `PENDING`, the negotiation should automatically move to `REJECTED` or stay `PENDING` but prevent conversion to an order.

### Notifications
Triggers for the Notification System:
- **New Offer**: Notify Seller.
- **Counter-Offer**: Notify previous proposer.
- **Accepted**: Notify party who didn't click accept.
- **Rejected**: Notify other party.

---

## 4. Security
- **Object-Level Permissions**: Ensure users cannot see or modify negotiations they are not a part of.
- **Price Sanitization**: Ensure prices are sanitized and quantities are within business-defined limits (e.g., above 0).
