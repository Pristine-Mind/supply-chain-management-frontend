# FindBusinessPage API Documentation & Workflow

## Overview

The FindBusinessPage is the entry point for the B2B (Business-to-Business) directory feature, enabling users to discover, connect with, and negotiate with verified business partners. The system consists of two main views:

1. **B2B Search/Directory** (`/find-business`) - Browse and search verified B2B users
2. **B2B User Profile** (`/find-business/:userId`) - View business details, products, and initiate negotiations

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           FindBusinessPage                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         Route: /find-business                            │   │
│  │                              │                                           │   │
│  │                              ▼                                           │   │
│  │                    ┌─────────────────┐                                   │   │
│  │                    │   userId?       │                                   │   │
│  │                    │  (URL Param)    │                                   │   │
│  │                    └────────┬────────┘                                   │   │
│  │                             │                                           │   │
│  │              ┌──────────────┴──────────────┐                            │   │
│  │              ▼                              ▼                            │   │
│  │    ┌─────────────────┐          ┌─────────────────┐                     │   │
│  │    │  B2BSearch      │          │ B2BUserProfile  │                     │   │
│  │    │  (No userId)    │          │  (With userId)  │                     │   │
│  │    └────────┬────────┘          └────────┬────────┘                     │   │
│  │             │                            │                              │   │
│  │             ▼                            ▼                              │   │
│  │    ┌─────────────────┐          ┌─────────────────┐                     │   │
│  │    │• Directory Grid │          │• Business Info  │                     │   │
│  │    │• Search/Filter  │          │• Product Grid   │                     │   │
│  │    │• Chat Modal     │          │• Negotiation    │                     │   │
│  │    │• Pagination     │          │• Product Chat   │                     │   │
│  │    └─────────────────┘          └─────────────────┘                     │   │
│  │                                                                             │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### 1. B2BUser

Represents a verified B2B business user in the directory.

```typescript
interface B2BUser {
  id: number;                           // Unique identifier
  username: string;                     // Business username
  first_name: string;                   // Contact person's first name
  last_name: string;                    // Contact person's last name
  email: string;                        // Business email
  registered_business_name?: string;    // Official business name
  description?: string;                 // Business description (HTML)
  business_type?: string;               // Type of business (Corporation, LLC, etc.)
}
```

### 2. MiniProduct

Lightweight product representation shown in B2B product listings.

```typescript
interface MiniProduct {
  id: number;                           // Product ID
  name: string;                         // Product name
  brand_name?: string;                  // Brand/manufacturer name
  price?: number;                       // Listed price (NPR)
  thumbnail?: string;                   // Product image URL
  description?: string;                 // Product description (HTML)
  category_info?: {                     // Category details
    id: number;
    name: string;
  };
  marketplace_id?: number;              // Associated marketplace listing ID
  min_order?: number;                   // Minimum order quantity
  stock?: number;                       // Available stock
}
```

### 3. Negotiation

Price negotiation between buyer and seller for a specific product.

```typescript
interface Negotiation {
  id: number;                           // Negotiation ID
  buyer: number;                        // Buyer user ID
  seller: number;                       // Seller user ID
  product: number;                      // Product ID
  product_details?: {                   // Embedded product info
    name: string;
    thumbnail: string;
    price: number;
  };
  buyer_details?: {                     // Embedded buyer info
    username: string;
    full_name: string;
  };
  proposed_price: number;               // Negotiated price per unit
  masked_price?: string;                // Masked display for non-owners
  proposed_quantity: number;            // Negotiated quantity
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTER_OFFER' | 'ORDERED' | 'LOCKED';
  last_offer_by: number;                // User ID who made last offer
  lock_owner?: number;                  // User ID who has editing lock
  lock_expires_at?: string;             // ISO timestamp when lock expires
  is_locked?: boolean;                  // Whether negotiation is locked
  lock_expires_in?: number;             // Seconds until lock expires
  created_at: string;                   // ISO creation timestamp
  updated_at: string;                   // ISO update timestamp
  history?: NegotiationHistory[];       // Previous offers history
}
```

### 4. NegotiationHistory

Individual offer in the negotiation history.

```typescript
interface NegotiationHistory {
  id: number;                           // History entry ID
  negotiation: number;                  // Parent negotiation ID
  offer_by: number;                     // User who made this offer
  price: number;                        // Proposed price
  quantity: number;                     // Proposed quantity
  message: string;                      // Offer message
  timestamp: string;                    // ISO timestamp
}
```

### 5. ProductMessage

Chat message about a specific product.

```typescript
interface ProductMessage {
  id: number;                           // Message ID
  message: string;                      // Message content
  timestamp: string;                    // ISO timestamp
  sender_details?: {                    // Sender information
    username: string;
  };
}
```

### 6. SellerChatMessage

Direct message between users (business-level chat).

```typescript
interface SellerChatMessage {
  id: number;                           // Message ID
  sender: number;                       // Sender user ID
  target_user: number | null;           // Recipient user ID
  message: string;                      // Message content
  created_at: string;                   // ISO timestamp
}
```

---

## API Endpoints

### B2B User Directory

#### 1. List B2B Verified Users

```http
GET /api/v1/b2b-verified-users-products/
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| q | string | No | Search query (business name, niche, username) |
| page | integer | No | Page number (default: 1) |
| page_size | integer | No | Items per page (default: 12) |

**Response:**
```json
{
  "count": 150,
  "next": "https://api.example.com/api/v1/b2b-verified-users-products/?page=2",
  "previous": null,
  "results": [
    {
      "id": 123,
      "username": "acme_corp",
      "first_name": "John",
      "last_name": "Doe",
      "email": "contact@acme.com",
      "registered_business_name": "Acme Corporation",
      "description": "Leading supplier of industrial equipment...",
      "business_type": "Corporation"
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Successful retrieval
- `401 Unauthorized` - Invalid or missing authentication token

---

#### 2. Get B2B User Details

```http
GET /api/v1/b2b-verified-users-products/{userId}/
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | integer | Yes | B2B user ID |

**Response:**
```json
{
  "id": 123,
  "username": "acme_corp",
  "first_name": "John",
  "last_name": "Doe",
  "email": "contact@acme.com",
  "registered_business_name": "Acme Corporation",
  "description": "Leading supplier of industrial equipment...",
  "business_type": "Corporation"
}
```

---

#### 3. List B2B User Products

```http
GET /api/v1/b2b-verified-users-products/{userId}/products/
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | integer | Yes | B2B user ID |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| q | string | No | Search query (product name, brand, SKU) |
| page | integer | No | Page number (default: 1) |
| page_size | integer | No | Items per page (default: 24) |

**Response:**
```json
{
  "count": 45,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 456,
      "name": "Industrial Drill X2000",
      "brand_name": "PowerTools Inc",
      "price": 25000,
      "thumbnail": "https://cdn.example.com/images/drill.jpg",
      "description": "Heavy-duty industrial drill...",
      "category_info": {
        "id": 10,
        "name": "Power Tools"
      },
      "marketplace_id": 789,
      "min_order": 5,
      "stock": 100
    }
  ]
}
```

---

#### 4. Get Product Chat Messages

```http
GET /api/v1/b2b-verified-users-products/{userId}/products/{productId}/chat/
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | integer | Yes | B2B user (seller) ID |
| productId | integer | Yes | Product ID |

**Response:**
```json
{
  "results": [
    {
      "id": 1,
      "message": "Is this available in bulk?",
      "timestamp": "2024-01-15T10:30:00Z",
      "sender_details": {
        "username": "buyer_corp"
      }
    }
  ]
}
```

---

#### 5. Send Product Chat Message

```http
POST /api/v1/b2b-verified-users-products/{userId}/products/{productId}/chat/
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | integer | Yes | B2B user (seller) ID |
| productId | integer | Yes | Product ID |

**Request Body:**
```json
{
  "message": "Is this available in bulk?"
}
```

**Response:**
```json
{
  "id": 2,
  "message": "Is this available in bulk?",
  "timestamp": "2024-01-15T10:30:00Z",
  "sender_details": {
    "username": "buyer_corp"
  }
}
```

---

### Recommendations

#### 6. Get Recommended Businesses

```http
GET /api/v1/recommendations/
```

**Response:**
```json
[
  {
    "user_id": 123,
    "business_name": "Acme Corporation",
    "match_score": 0.95
  },
  {
    "user_id": 456,
    "business_name": "Tech Solutions Ltd",
    "match_score": 0.88
  }
]
```

---

### Negotiations

#### 7. Create Negotiation

```http
POST /api/v1/negotiations/
```

**Request Body:**
```json
{
  "product": 789,
  "proposed_price": 22000,
  "proposed_quantity": 10,
  "message": "Looking for bulk discount on 10 units"
}
```

**Validation Rules:**
- `proposed_price` must not exceed listed price
- `proposed_price` below 50% of listed price triggers warning
- `proposed_quantity` must meet minimum order requirement
- `proposed_quantity` must not exceed available stock

**Response:** `201 Created` with Negotiation object

---

#### 8. Get Active Negotiation

```http
GET /api/v1/negotiations/active/
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| product | integer | Yes | Marketplace product ID |

**Response:** Negotiation object or `404 Not Found`

---

#### 9. Update Negotiation

```http
PATCH /api/v1/negotiations/{negotiationId}/
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| negotiationId | integer | Yes | Negotiation ID |

**Request Body (Counter Offer):**
```json
{
  "price": 23000,
  "quantity": 8,
  "message": "Can we meet at 23k for 8 units?",
  "status": "COUNTER_OFFER"
}
```

**Request Body (Accept):**
```json
{
  "status": "ACCEPTED"
}
```

**Request Body (Reject):**
```json
{
  "status": "REJECTED"
}
```

---

#### 10. Extend Lock

```http
POST /api/v1/negotiations/{negotiationId}/extend_lock/
```

**Request Body:**
```json
{
  "additional_seconds": 300
}
```

**Response:** Updated Negotiation object

---

#### 11. Force Release Lock (Admin/Seller Only)

```http
POST /api/v1/negotiations/{negotiationId}/force_release_lock/
```

**Response:** Success confirmation

---

### Seller Chat

#### 12. List Seller Chats

```http
GET /api/v1/seller-chats/
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| direction | string | No | 'inbox' or 'sent' (default: inbox) |
| page | integer | No | Page number |
| page_size | integer | No | Items per page |
| user_id | integer | No | Filter by specific user |

---

#### 13. Send Seller Message

```http
POST /api/v1/seller-chats/
```

**Request Body:**
```json
{
  "target_user": 123,
  "message": "Hello, I'm interested in your products",
  "subject": "Business Inquiry"
}
```

---

## Workflow Diagrams

### Workflow 1: B2B Directory Discovery

```
┌─────────────┐
│   Start     │
└──────┬──────┘
       ▼
┌─────────────────────────┐
│ Navigate to /find-business│
└───────────┬─────────────┘
            ▼
┌──────────────────────────────┐
│  FindBusinessPage renders    │
│  B2BSearch component         │
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐     ┌─────────────────────┐
│ useB2BSearch hook initializes │────▶│ Fetch B2B users     │
│                              │     │ (listB2BUsers)      │
│                              │────▶│ Get recommended     │
│                              │     │ (getRecommended)    │
└──────────────┬───────────────┘     └─────────────────────┘
               ▼
┌──────────────────────────────┐
│  Display business directory  │
│  - Recommended section (★)   │
│  - All businesses grid       │
└──────────────┬───────────────┘
               │
       ┌───────┴───────┐
       ▼               ▼
┌─────────────┐  ┌─────────────────┐
│  Search     │  │  Select User    │
│  (filter)   │  │  (BusinessCard) │
└──────┬──────┘  └────────┬────────┘
       │                  │
       ▼                  ▼
┌──────────────────────────────┐
│  Navigate to profile:        │
│  /find-business/:userId      │
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│  B2BUserProfile renders      │
│  - Business info header      │
│  - Product grid              │
│  - Search within products    │
└──────────────────────────────┘
```

### Workflow 2: Product Negotiation

```
┌─────────────────────────────┐
│ User on B2BUserProfile      │
│ viewing products            │
└──────────────┬──────────────┘
               ▼
┌──────────────────────────────┐
│ Click "Negotiate Price"      │
│ (Only B2B verified users)    │
└──────────────┬───────────────┘
               │
       ┌───────┴───────┐
       ▼               ▼
┌─────────────┐  ┌─────────────────┐
│ Not Verified│  │  Verified User  │
│    (❌)     │  │     (✅)        │
└──────┬──────┘  └────────┬────────┘
       │                  │
       ▼                  ▼
┌─────────────────┐  ┌──────────────────────────────┐
│ Show error toast│  │  Fetch active negotiation    │
│ "Only B2B users"│  │  (getActiveNegotiation)      │
└─────────────────┘  └──────────────┬───────────────┘
                                   │
                       ┌───────────┴───────────┐
                       ▼                       ▼
              ┌─────────────────┐    ┌─────────────────┐
              │ No existing     │    │ Existing        │
              │ negotiation     │    │ negotiation     │
              └────────┬────────┘    └────────┬────────┘
                       │                      │
                       ▼                      ▼
              ┌─────────────────┐    ┌──────────────────────────┐
              │ Show "Start     │    │ Display current offer    │
              │ Negotiation"    │    │ with status badge        │
              │ button          │    │                          │
              └────────┬────────┘    └───────────┬──────────────┘
                       │                         │
                       └─────────┬───────────────┘
                                 ▼
                  ┌──────────────────────────────┐
                  │ Enter negotiation form:      │
                  │ - Proposed price             │
                  │ - Proposed quantity          │
                  │ - Message                    │
                  └──────────────┬───────────────┘
                                 ▼
                  ┌──────────────────────────────┐
                  │ Client validation:           │
                  │ - Price ≤ listed price       │
                  │ - Price ≥ 50% listed (warn)  │
                  │ - Quantity ≥ min_order       │
                  │ - Quantity ≤ stock           │
                  └──────────────┬───────────────┘
                                 ▼
                  ┌──────────────────────────────┐
                  │ Submit negotiation:          │
                  │ - New: createNegotiation()   │
                  │ - Counter: updateNegotiation │
                  └──────────────┬───────────────┘
                                 ▼
                  ┌──────────────────────────────┐
                  │ Poll every 30s for updates   │
                  │ while PENDING/COUNTER        │
                  └──────────────────────────────┘
```

### Workflow 3: Negotiation State Machine

```
                         ┌─────────────┐
                         │    START    │
                         └──────┬──────┘
                                ▼
                    ┌───────────────────────┐
                    │   Create Negotiation  │
                    │   (Buyer initiates)   │
                    └───────────┬───────────┘
                                ▼
                    ┌───────────────────────┐
              ┌────▶│        PENDING        │◀────┐
              │     │  (Awaiting response)  │     │
              │     └───────────┬───────────┘     │
              │                 │                 │
        Counter │         ┌─────┴─────┐     Counter │
        Offer   │         │           │     Offer
              │      Reject │      Accept │
              │           │           │           │
              │           ▼           ▼           │
              │    ┌───────────┐  ┌───────────┐   │
              └────│  REJECTED │  │  ACCEPTED ├───┘
                   └───────────┘  └─────┬─────┘
                                        │
                                        ▼
                              ┌───────────────────┐
                              │ Buyer can purchase│
                              │ at negotiated     │
                              │ price             │
                              └───────────────────┘
```

**Status Definitions:**
- **PENDING**: Initial offer made, awaiting response
- **COUNTER_OFFER**: Counter offer submitted, awaiting response
- **ACCEPTED**: Offer accepted, buyer can purchase at negotiated price
- **REJECTED**: Offer rejected, negotiation ended
- **ORDERED**: Item purchased at negotiated price
- **LOCKED**: Editing locked by another user

### Workflow 4: Lock Management

```
┌─────────────────────────────┐
│ User attempts negotiation   │
│ action (update/accept/etc)  │
└──────────────┬──────────────┘
               ▼
┌──────────────────────────────┐
│ Check if negotiation locked  │
│ (is_locked flag)             │
└──────────────┬───────────────┘
               │
       ┌───────┴───────┐
       ▼               ▼
  ┌─────────┐    ┌──────────────┐
  │ Locked  │    │  Not Locked  │
  └────┬────┘    └──────┬───────┘
       │                │
       ▼                ▼
┌──────────────────┐  ┌────────────────────────┐
│ Check lock_owner │  │ Action proceeds        │
└────────┬─────────┘  │ Lock acquired for      │
         │            │ duration of operation  │
    ┌────┴────┐       └────────────────────────┘
    ▼         ▼
┌────────┐ ┌──────────┐
│ Is Self│ │Is Another│
└───┬────┘ └────┬─────┘
    │           │
    ▼           ▼
┌──────────────────┐  ┌────────────────────────┐
│ Show "You have   │  │ Show lock notice with: │
│ editing lock"    │  │ - Lock owner info      │
│ + Extend button  │  │ - Time remaining       │
└──────────────────┘  │ - Disabled actions     │
                      └────────────────────────┘
```

### Workflow 5: Direct Business Chat

```
┌─────────────────────────────┐
│ User on B2BSearch page      │
│ viewing business directory  │
└──────────────┬──────────────┘
               ▼
┌──────────────────────────────┐
│ Click "Message" on          │
│ BusinessCard component       │
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│ ChatModal opens              │
│ - Load conversation history  │
│ (getSellerConversation)      │
└──────────────┬───────────────┘
               │
       ┌───────┴───────┐
       ▼               ▼
┌─────────────┐  ┌─────────────────┐
│ Send Message│  │  Close Chat     │
└──────┬──────┘  └─────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ sendSellerMessage()          │
│ Optimistic UI update         │
│ Refresh conversation         │
└──────────────────────────────┘
```

### Workflow 6: Product Purchase Flow

```
┌─────────────────────────────┐
│ User on B2BUserProfile      │
│ sets quantity for product   │
└──────────────┬──────────────┘
               │
       ┌───────┴───────┐
       ▼               ▼
┌─────────────┐  ┌─────────────────┐
│ Not Logged  │  │  Logged In      │
│    In       │  │  (✅)           │
└──────┬──────┘  └────────┬────────┘
       │                  │
       ▼                  ▼
┌─────────────────┐  ┌──────────────────────────────┐
│ Show LoginModal │  │ Check for accepted           │
│ Store pending   │  │ negotiation for product      │
│ action context  │  └──────────────┬───────────────┘
└────────┬────────┘                 │
         │               ┌──────────┴──────────┐
         │               ▼                     ▼
         │      ┌──────────────┐      ┌─────────────────┐
         │      │ No accepted  │      │ Accepted neg.   │
         │      │ negotiation  │      │ exists          │
         │      └──────┬───────┘      └────────┬────────┘
         │             │                       │
         │             ▼                       ▼
         │    ┌─────────────────┐    ┌────────────────────────┐
         │    │ Use listed price│    │ Use negotiated price   │
         │    │ Use user qty    │    │ Use negotiated qty     │
         │    └────────┬────────┘    └───────────┬────────────┘
         │             │                         │
         │             └─────────┬───────────────┘
         │                       ▼
         │          ┌──────────────────────────────┐
         │          │ transformMiniToMarketplace() │
         │          │ - Convert MiniProduct to     │
         │          │   Marketplace format         │
         │          │ - Apply negotiated price     │
         │          └──────────────┬───────────────┘
         │                         ▼
         │          ┌──────────────────────────────┐
         │          │ addToCart(product, qty)      │
         │          │ Navigate to delivery-details │
         │          └──────────────────────────────┘
         │
         └────────▶ (After login) ───────────────▶
```

---

## Component Hierarchy

```
FindBusinessPage
│
├── Route: /find-business
│   └── B2BSearch (modal/overlay)
│       ├── Header (title, close button)
│       ├── SearchBar (query input)
│       ├── Main Content
│       │   ├── RecommendedUsers (★ starred businesses)
│       │   └── OtherUsers (all results grid)
│       │       └── BusinessCard[]
│       │           ├── Business info display
│       │           ├── View Profile button → /find-business/:userId
│       │           └── Message button → opens ChatModal
│       ├── Pagination controls
│       └── ChatModal (when activeChatUser set)
│           ├── Header (user info)
│           ├── Message list
│           └── Input area
│
└── Route: /find-business/:userId
    └── B2BUserProfile
        ├── Header (back button)
        ├── Business Info Card
        │   ├── Name, username, email
        │   ├── Business type
        │   └── Description (expandable)
        ├── Products Section
        │   ├── Search bar
        │   ├── Products Grid
        │   │   └── Product cards with:
        │   │       ├── Image, name, brand
        │   │       ├── Price
        │   │       ├── Quantity selector
        │   │       ├── Buy Now button
        │   │       └── Negotiate Price button
        │   └── Pagination
        ├── Product Detail Modal
        │   ├── Product info display
        │   ├── Negotiation Section
        │   │   ├── Status badge
        │   │   ├── Lock indicators
        │   │   ├── Offer display/edit
        │   │   └── Action buttons (Accept/Reject/Counter)
        │   └── Product Chat Section
        │       ├── Message history
        │       └── Message input
        └── LoginModal (when auth required)
```

---

## State Management

### useB2BSearch Hook State

```typescript
{
  // Search State
  query: string;                    // Current search term
  users: B2BUser[];                 // Fetched users
  loading: boolean;                 // Fetch loading state
  page: number;                     // Current page
  count: number;                    // Total results count
  recommendedIds: number[];         // IDs of recommended users
  
  // Chat State
  activeChatUser: B2BUser | null;   // Currently chatting with
  conversation: any[];              // Chat messages
  convLoading: boolean;             // Messages loading
  currentUserId: number;            // Logged in user ID
}
```

### B2BUserProfile Component State

```typescript
{
  // User Data
  user: B2BUser | null;
  loadingUser: boolean;
  showFullDescription: boolean;
  
  // Products
  products: MiniProduct[];
  prodLoading: boolean;
  page: number;
  count: number;
  q: string;                        // Product search query
  quantities: Record<number, number>; // Selected quantities
  
  // Product Modal
  modalProduct: MiniProduct | null;
  
  // Chat
  chatMessage: string;
  sendingChat: boolean;
  chatSentSuccess: string | null;
  productMessages: ProductMessage[];
  prodMsgsLoading: boolean;
  
  // Authentication
  showLoginModal: boolean;
  pendingProductForAuth: PendingProductAuth | null;
  
  // Negotiation
  activeNegotiation: Negotiation | null;
  negotiationLoading: boolean;
  negotiationPrice: string;
  negotiationQty: string;
  negotiationMsg: string;
  isNegotiating: boolean;
}
```

---

## Error Handling

### API Error Responses

| Endpoint | Error Code | Handling |
|----------|-----------|----------|
| All | 401 | Redirect to login / show LoginModal |
| listB2BUsers | 500 | Show toast, empty results |
| createNegotiation | 400 | Show validation errors in form |
| createNegotiation | 409 | Negotiation already exists, refresh state |
| updateNegotiation | 423 | Lock conflict, show lock status |
| sendProductChat | 403 | Not authenticated, show login |

### Client-Side Validations

| Validation | Error Message | Trigger |
|------------|---------------|---------|
| Price > Listed | "Proposed price cannot exceed listed price" | On negotiation submit |
| Price < 50% Listed | "Note: 50%+ below list, may be rejected" | Warning toast |
| Qty < Min Order | "Minimum order is X units" | On negotiation submit |
| Qty > Stock | "Only X units available" | On negotiation submit |
| Not B2B Verified | "Only B2B verified users can negotiate" | On negotiate click |

---

## Security Considerations

1. **Authentication Required**: All B2B endpoints require valid token
2. **B2B Verification**: Negotiation features restricted to b2b_verified users
3. **Lock Mechanism**: Prevents concurrent negotiation edits
4. **Ownership Checks**: Users can only modify their own negotiations
5. **Price Masking**: Sensitive pricing hidden via `masked_price` field

---

## Polling Strategy

The negotiation section polls for updates every 30 seconds when:
- A product modal is open
- There's an active negotiation
- Status is `PENDING` or `COUNTER_OFFER`

```typescript
useEffect(() => {
  let interval: NodeJS.Timeout;
  if (modalProduct && activeNegotiation && 
      (activeNegotiation.status === 'PENDING' || 
       activeNegotiation.status === 'COUNTER_OFFER')) {
    interval = setInterval(() => {
      fetchProductMessages(modalProduct.id, ...);
    }, 30000);
  }
  return () => {
    if (interval) clearInterval(interval);
  };
}, [modalProduct, activeNegotiation, fetchProductMessages]);
```

---

## Related Files

| File | Purpose |
|------|---------|
| `src/components/FindBusinessPage.tsx` | Main route component |
| `src/components/b2b/B2BSearch.tsx` | Directory search UI |
| `src/components/b2b/useB2BSearch.tsx` | Search state management hook |
| `src/components/b2b/BusinessCard.tsx` | Business listing card |
| `src/components/b2b/ChatModal.tsx` | Direct messaging modal |
| `src/components/b2b/B2BUserProfile.tsx` | Business profile page |
| `src/api/b2bApi.ts` | B2B API functions |
| `src/api/chatApi.ts` | Chat API functions |
