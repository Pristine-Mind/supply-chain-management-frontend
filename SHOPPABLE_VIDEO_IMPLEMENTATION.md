# Shoppable Video Feed Implementation Documentation

## Overview
The Shoppable Video Feed is a TikTok-style, full-screen vertical video scrolling feature integrated into the marketplace. It allows users to discover products through engaging short-form video content. Users can interact with videos (like, save, share, comment), follow creators, and purchase products directly from the feed.

## Features
- **Personalized Feed**: Infinite scroll of videos tailored to user interests.
- **Product Integration**: Direct links to the primary product and additional related products.
- **Social Interactions**:
  - **Like**: Heart videos to show appreciation.
  - **Save**: Bookmark videos for later viewing.
  - **Share**: Share videos via Web Share API or copy link.
  - **Comment**: View and post comments in a slide-up sheet.
  - **Follow**: Follow video creators/sellers.
- **Commerce Features**:
  - **Add to Cart**: One-click add to cart for the featured product.
  - **Product Details**: Quick view of product price and images.
- **Moderation**: Report inappropriate content.
- **Metrics**: View counts, like counts, and share counts.
- **Responsive Design**: Optimized for both mobile (full screen) and desktop (modal) experiences.

## Data Models

### `ShoppableVideo`
Represents a single video item in the feed.
```typescript
interface ShoppableVideo {
    id: number;
    uploader: number;
    uploader_name: string;
    uploader_avatar?: string;
    video_file: string;       // URL to the video file
    thumbnail: string | null; // URL to the poster image
    title: string;
    description: string;
    product: ShoppableVideoProduct;           // Primary product
    additional_products: ShoppableVideoProduct[]; // Related products
    views_count: number;
    likes_count: number;
    shares_count: number;
    created_at: string;
    is_liked: boolean;        // Current user's like status
    is_saved: boolean;        // Current user's save status
    is_following?: boolean;   // Current user's follow status for uploader
    tags: string[];
    trend_score: number;
}
```

### `ShoppableVideoProduct`
Simplified product details used within the video object.
```typescript
interface ShoppableVideoProduct {
    id: number;
    name: string;
    listed_price: number;
    discounted_price: number | null;
    images: { id: number; image: string; alt_text: string | null }[];
}
```

### `VideoComment`
Represents a user comment on a video.
```typescript
interface VideoComment {
    id: number;
    video: number;
    user: number;
    user_name: string;
    user_avatar?: string;
    text: string;
    created_at: string;
    parent: number | null; // ID of parent comment if this is a reply
    replies?: VideoComment[];
}
```

## API Endpoints

Base URL: `/api/v1/`

### Shoppable Videos (`/shoppable-videos/`)

| Method | Endpoint | Description | Payload / Params | Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | Get paginated video feed | `page`, `page_size` | `ShoppableVideoListResponse` |
| `GET` | `/{id}/` | Get single video details | - | `ShoppableVideo` |
| `POST` | `/{id}/like/` | Toggle like status | - | `{ status, liked, likes_count }` |
| `POST` | `/{id}/save_video/` | Toggle save status | - | `{ status, saved }` |
| `POST` | `/{id}/share/` | Increment share count | - | `{ status, shares_count }` |
| `POST` | `/{id}/view/` | Increment view count | - | `{ status, views_count }` |
| `POST` | `/{id}/add_to_cart/` | Add product to cart | `{ product_id?, quantity }` | `{ status, message, cart_item_count }` |

### Comments (`/video-comments/`)

| Method | Endpoint | Description | Payload / Params | Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | Get comments for a video | `video_id` | `VideoComment[]` |
| `POST` | `/` | Post a new comment | `{ video, text, parent? }` | `VideoComment` |

### User Follows (`/user-follows/`)

| Method | Endpoint | Description | Payload / Params | Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/toggle_follow/` | Follow/Unfollow user | `{ following_id }` | `{ status, is_following }` |

### Moderation (`/video-reports/`)

| Method | Endpoint | Description | Payload / Params | Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/` | Report a video | `{ video, reason, description }` | `{ status, message }` |

## Frontend Implementation

### `ShoppableVideoFeed.tsx`
The main container component.
- **State**: Manages the list of videos (`videos`), loading state, and active video index.
- **Scrolling**: Uses CSS Scroll Snap (`snap-y`, `snap-mandatory`) for the TikTok-like feel.
- **Intersection Observer**: Detects which video is currently in view to handle auto-play/pause and view counting.
- **Responsive Layout**: 
  - **Mobile**: Full viewport height (`100dvh`), fixed position.
  - **Desktop**: Centered modal with fixed aspect ratio.

### `VideoItem` (Sub-component)
Renders a single video slide.
- **Video Player**: Handles play/pause based on `isActive` prop. Mute toggle.
- **Overlay UI**: Displays title, description, uploader info, and music.
- **Interactions**: Buttons for Like, Comment, Save, Share, Report.
- **Product Card**: Glassmorphism card linking to the product page with an "Add to Cart" button.
- **Additional Products**: Horizontal scroll list of related items.

### `CommentsSheet` (Sub-component)
A slide-up overlay for viewing and posting comments.
- **Animation**: Slides in from the bottom.
- **Real-time**: Fetches comments on open and updates list immediately after posting.

## Usage Example

```tsx
import ShoppableVideoFeed from './components/ShoppableVideoFeed';

// ... inside your component
const [showVideoFeed, setShowVideoFeed] = useState(false);

return (
  <>
    <button onClick={() => setShowVideoFeed(true)}>
      Open Just For You
    </button>

    {showVideoFeed && (
      <ShoppableVideoFeed 
        onClose={() => setShowVideoFeed(false)}
        onRequireLogin={() => setShowLoginModal(true)}
      />
    )}
  </>
);
```

## Frontend Additions (files added)

- `src/types/creator.ts`: TypeScript interfaces for `CreatorProfile`, paginated responses, `ProductTag`, and brief `ShoppableVideo` view types.
- `src/api/creatorsApi.ts`: Axios-based client for creators endpoints: list, retrieve, videos, follow toggle, and view increment (wraps shoppable videos view endpoint).
- `src/components/CreatorsList.tsx`: Public creators list and search page (`/creators`).
- `src/components/CreatorProfilePage.tsx`: Creator profile header and embedded videos (`/creators/:id`).
- `src/components/CreatorVideos.tsx`: Paginated creator videos grid used by profile page (`/creators/:id/videos`).

These are lightweight, intentional starting points — expand UI and styling to match product requirements.

## Quick integration notes for frontend engineers

- Routes: added public routes for `/creators`, `/creators/:id`, and `/creators/:id/videos` in `App.tsx`.
- API base: usages follow existing pattern (`VITE_REACT_APP_API_URL`) and attach `Authorization: Bearer <token>` from `localStorage` when available.
- Pagination: all list endpoints return DRF style pagination — use `next` / `previous` and `count` instead of fetching all pages.

Follow button pattern (recommended):

1. Optimistic update: increment/decrement local `follower_count` immediately and set a small spinner.
2. POST to `/api/v1/creators/{id}/follow/` (`creatorsApi.toggleFollow`) and reconcile on response.
3. On 401, redirect to login.

View tracking pattern:

1. When a video becomes the active view (via IntersectionObserver or on playback start), call `creatorsApi.incrementVideoView(videoId)` once per user session/view session.
2. Avoid double-counting by storing a `Set` of viewed video IDs in `sessionStorage` or `localStorage` for the session.

Affiliate links:

- Use the backend redirect URL (e.g. `/api/v1/affiliate/redirect/?post_id=123&product_id=456`) as an anchor/href or via `window.location` to let the browser follow the 302. Do not fetch that URL via XHR.

Prefetching / N+1:

- If the UI needs extra nested fields (avatars, stats) in lists, ask backend to include or prefetch them in `ProducerProfileViewSet` / `ShoppableVideoSerializer` to avoid extra fetches per item.

## Next steps you may want me to do

- Wire the follow button into the `CreatorProfilePage` header with optimistic updates.
- Add unit/integration tests for the `creatorsApi` client.
- Expand `CreatorVideos` items to open the video player and call view tracking on play.

