# technical deep dive: supply chain marketplace platform

This document provides a highly detailed breakdown of the platform's architecture, core modules, and implementation logic. It maps specific features to their underlying components and API layers.

---

## 1. Global User Experience & Navigation
### 1.1 Keyboard-Driven Navigation (Command Palette)
*   **Component**: [src/components/CommandPalette.tsx](src/components/CommandPalette.tsx)
*   **Feature**: Users can press `Cmd+K` (macOS) or `Ctrl+K` (Windows/Linux) to open a global search overlay.
*   **Implementation**: 
    *   Uses a centralized list of searchable actions and routes.
    *   Implements `Mousetrap` or native event listeners to capture global hotkeys.
    *   Fuzzy search logic matches user input against page titles and common actions (e.g., "Go to Orders", "Logout").

### 1.2 Interactive Global Search
*   **Component**: [src/components/ProductSearchBar.tsx](src/components/ProductSearchBar.tsx)
*   **Feature**: Real-time product search with suggestions.
*   **Logic**:
    *   **Auto-Complete**: Fetches partial matches from the marketplace API as the user types.
    *   **Voice Integration**: Uses the **Web Speech API** to handle hands-free queries. It converts audio to text locally, updates the input field, and triggers a search event.

---

## 2. Interactive Commerce & Personalization
### 2.1 Shoppable Video Feed (Vertical Reels)
*   **Component**: [src/components/ShoppableVideoFeed.tsx](src/components/ShoppableVideoFeed.tsx)
*   **Technical Implementation**:
    *   **Infinite Scroll**: Uses `IntersectionObserver` to track which video is in view and set it as `isActive`.
    *   **Video Playback Logic**: Only the active video is played; others are paused to save bandwidth.
    *   **Engagement**: Includes a slide-up `CommentsSheet` using local state to manage the visibility of the message thread without refreshing the feed.
    *   **Uploader API**: Integrated with [src/api/creatorsApi.ts](src/api/creatorsApi.ts) to handle following/unfollowing creators on the fly.

### 2.2 Intelligent Product View
*   **Component**: [src/components/ProductInstanceView.tsx](src/components/ProductInstanceView.tsx)
*   **Pricing Logic**:
    *   **B2B Pricing Discovery**: Calculates the "Display Price" by checking `user.b2b_verified` against `product.is_b2b_eligible`.
    *   **Bulk Tiers**: Manages a complex object array (`bulk_price_tiers`) to show tiered discounts (e.g., "Buy 10 for 5% off, Buy 50 for 10% off").
    *   **Popularity Scoring**: Displays a [PopularityScore](src/components/ui/PopularityScore.tsx) based on views, sales, and ratings.

---

## 3. B2B Negotiation & Lock Discovery
### 3.1 Real-Time Negotiation Logic
*   **Component**: [src/components/DistributorNegotiations.tsx](src/components/DistributorNegotiations.tsx)
*   **Feature**: A private bargaining room between wholesale buyers and suppliers.
*   **Mechanism**:
    *   **Locking System**: When a distributor opens a negotiation, a "lock" is requested via [src/api/b2bApi.ts](src/api/b2bApi.ts). This prevents multiple reps from chatting with the same buyer at once.
    *   **Force Release**: Admins can force-release a lock if a session becomes stale.
    *   **State Management**: Real-time status updates (`PENDING`, `ACCEPTED`, `REJECTED`, `COUNTER_OFFER`) are handled via polling or WebSockets.

---

## 4. Logistics & Supply Chain Logic
### 4.1 Order & Stock Automated replenishment (OAR)
*   **Component**: [src/components/Stocks.tsx](src/components/Stocks.tsx)
*   **Logic**:
    *   Calculates `Safety Stock` and `Reorder Point` using the average daily demand and standard deviation of sales.
    *   Visual indicators (Low Stock Badge) appear when inventory levels cross the reorder threshold defined in the product metadata.

### 4.2 Transporter Geolocation
*   **Component**: [src/components/NearbyDeliveries.tsx](src/components/NearbyDeliveries.tsx)
*   **Feature**: Radius-based job searching.
*   **Implementation**:
    *   Uses browser geolocation to find the transporter's current coordinates.
    *   Passes `latitude` and `longitude` to the [transporterApi.ts](src/api/transporterApi.ts) to filter available deliveries by distance.
    *   Integrates with a map view ([src/components/maps/](src/components/maps/)) to visualize routes.

---

## 5. Enterprise Analytics & Reporting
### 5.1 RFM Segmentation (Customer Intelligence)
*   **File**: [src/components/reports/RFMSegments.tsx](src/components/reports/RFMSegments.tsx)
*   **The "RFM" Formula**:
    *   **Recency**: How recently did the customer purchase?
    *   **Frequency**: How often do they buy?
    *   **Monetary**: How much total value have they brought?
*   **Implementation**: Categorizes customers into groups like "Champions," "At Risk," and "Hibernating" using API-driven scoring.

### 5.2 System Health & Observability
*   **File**: [src/components/reports/SystemHealth.tsx](src/components/reports/SystemHealth.tsx)
*   **Details**:
    *   Monitors **API Target Availability**.
    *   Renders real-time graphs showing response latency and throughput (requests per hour) across different platform modules (B2B vs Marketplace).

---

## 6. Checkout & Fulfillment Workflow
### 6.1 Multi-Stage Checkout
*   **Files**: [src/components/CheckoutScreen.tsx](src/components/CheckoutScreen.tsx) and [src/components/DeliveryDetails.tsx](src/components/DeliveryDetails.tsx)
*   **Sequence**:
    1.  **Cart Validation**: Validates stock availability for the requested quantities.
    2.  **Address Pinning**: Integrated with a `LocationPicker` to save exact lat/long for transporters.
    3.  **Payment Processing**: Routes to the [Payment.tsx](src/components/Payment.tsx) component which interacts with external payment gateways (e.g., Stripe, khalti).
    4.  **Order Success**: Triggers notifications and moves the order to the [OrderList.tsx](src/components/Orderlist.tsx) for fulfillment.

---

## 7. Security & Compliance
### 7.1 Immutable Audit Logs
*   **File**: [src/components/AuditLogList.tsx](src/components/AuditLogList.tsx)
*   **Feature**: Tracks every database mutation.
*   **Technical Detail**: Records `transaction_type`, `reference_id`, and `entity_id`. Frontend allows searching and filtering logs by date or transaction amount to identify anomalies.
