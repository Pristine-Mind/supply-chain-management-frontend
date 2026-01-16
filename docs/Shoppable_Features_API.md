# Shoppable Video — API & Types

Version: 1.0
Date: 2025-12-15

Overview
--------
This document lists the frontend-facing API calls, request/response shapes and TypeScript types used by the Shoppable Video feature.

API base & auth
----------------
- Base URL: the API base comes from `VITE_REACT_APP_API_URL`.
- Endpoints are under `/api/v1/shoppable-videos/`, `/api/v1/video-comments/`, `/api/v1/user-follows/`, `/api/v1/video-reports/`.
- Authentication: endpoints use Bearer token from `localStorage.getItem('accessToken')` in request headers.

Primary client files
--------------------
- API wrapper: [src/api/shoppableVideosApi.ts](src/api/shoppableVideosApi.ts)
- Types: [src/types/shoppableVideo.ts](src/types/shoppableVideo.ts)
- Related creators API: [src/api/creatorsApi.ts](src/api/creatorsApi.ts)
- Components using the API: [src/components/ShoppableVideoFeed.tsx](src/components/ShoppableVideoFeed.tsx), [src/components/CreatorVideos.tsx](src/components/CreatorVideos.tsx), [src/components/CreatorsList.tsx](src/components/CreatorsList.tsx), [src/components/Marketplace.tsx](src/components/Marketplace.tsx)

Endpoints (client wrapper)
--------------------------
All endpoints shown below mirror the methods in `shoppableVideosApi`.

- GET `/api/v1/shoppable-videos/` — `getVideos()`
  - Query: (currently no page params used by wrapper; API may support `page`/`page_size`)
  - Response: `ShoppableVideoListResponse`

- GET `/api/v1/shoppable-videos/{id}/` — `getVideoDetails(id)`
  - Response: `ShoppableVideo`

- POST `/api/v1/shoppable-videos/{id}/like/` — `likeVideo(id)`
  - Request body: none
  - Response: `{ status: string; liked: boolean; likes_count: number }`

- POST `/api/v1/shoppable-videos/{id}/save_video/` — `saveVideo(id)`
  - Request body: none
  - Response: `{ status: string; saved: boolean }`

- POST `/api/v1/shoppable-videos/{id}/share/` — `shareVideo(id)`
  - Request body: none
  - Response: `{ status: string; shares_count: number }`

- POST `/api/v1/shoppable-videos/{id}/view/` — `incrementView(id)`
  - Request body: none
  - Response: `{ status: string; views_count: number }`

- POST `/api/v1/shoppable-videos/{id}/add_to_cart/` — `addToCart(id, payload)`
  - Request body: `AddToCartPayload` (see types)
  - Response: `{ status: string; message: string; cart_item_count: number }`

- GET `/api/v1/video-comments/` — `getComments(video_id)`
  - Query: `video_id` (number)
  - Response: `VideoComment[]`

- POST `/api/v1/video-comments/` — `addComment(payload)`
  - Request body: `{ video: number; text: string; parent?: number | null }`
  - Response: `VideoComment`

- POST `/api/v1/user-follows/toggle_follow/` — `toggleFollow(followingId)`
  - Request body: `{ following_id: number }`
  - Response: `{ status: string; is_following: boolean }`

- POST `/api/v1/video-reports/` — `reportVideo(payload)`
  - Request body: `VideoReportPayload`
  - Response: `{ status: string; message: string }`

Type definitions (frontend)
---------------------------
The primary TS types live in `src/types/shoppableVideo.ts`. Key shapes are repeated below for quick reference.

```typescript
export interface ShoppableVideoProduct {
  id: number;
  name: string;
  listed_price: number;
  discounted_price: number | null;
  images: { id: number; image: string; alt_text: string | null }[];
}

export interface ShoppableVideo {
  id: number;
  uploader: number;
  uploader_name: string;
  uploader_avatar?: string;
  video_file: string;
  thumbnail: string | null;
  title: string;
  description: string;
  product: ShoppableVideoProduct;
  additional_products: ShoppableVideoProduct[];
  views_count: number;
  likes_count: number;
  shares_count: number;
  created_at: string;
  is_liked: boolean;
  is_saved: boolean;
  is_following?: boolean;
  tags: string[];
  trend_score: number;
}

export interface VideoComment {
  id: number;
  video: number;
  user: number;
  user_name: string;
  user_avatar?: string;
  text: string;
  created_at: string;
  parent: number | null;
  replies?: VideoComment[];
}

export interface VideoReportPayload {
  video: number;
  reason: 'spam' | 'inappropriate' | 'harassment' | 'misleading' | 'other';
  description: string;
}

export interface AddToCartPayload {
  product_id?: number;
  quantity: number;
}

export interface ShoppableVideoListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ShoppableVideo[];
}

// from creator types:
export interface ShoppableVideoViewResponse {
  id: number;
  views_count: number;
}
```

Usage notes
-----------
- Auth: Ensure `accessToken` is set in `localStorage` for protected actions (likes, comments, add_to_cart, report).
- Add-to-cart expects the `product_id` and `quantity`; the wrapper attaches video context by URL path.
- Pagination: the list endpoint returns a paginated response object; frontend wrappers may accept or pass `page` parameters if backend supports them.

Where used in UI
-----------------
- Feed view: `ShoppableVideoFeed` shows lists of videos and calls `getVideos`/`getVideoDetails`.
- Creator pages: `CreatorVideos` and `CreatorsList` fetch creator-specific videos and may call `incrementView`.
- Product flows: `addToCart` connects video product → site cart; see `Cart`/`CheckoutScreen` components for downstream flows.

Next steps / suggestions
------------------------
- Add explicit typing for responses from like/save/share endpoints in `src/types` if backend stabilizes shapes.
- Document expected HTTP status codes and error payload shapes (currently wrappers return `response.data` only).
- Add optional query params support (page, page_size, filters) to the `getVideos` wrapper for large feeds.

Generated from frontend code in the repo. For backend contract verification, compare these shapes with the backend API docs or server schemas.

UI Components & implementation
------------------------------
This section describes the main UI components that surface shoppable videos, how they are implemented, and which APIs they call.

- **ForYouPage** — [src/components/ForYouPage.tsx](src/components/ForYouPage.tsx)
  - Role: top-level page with tabs: `For You`, `Following`, `Store` and a search field.
  - Renders `ForYouGrid` for the feed, `MyFollowing` for following, and `CreatorsList` for store view.
  - Navigation: switches tabs, handles login modal for protected routes, navigates to creator pages.

- **ForYouGrid** — [src/components/ForYouGrid.tsx](src/components/ForYouGrid.tsx)
  - Role: primary feed/grid of shoppable videos; supports optional `query?: string`, `compact?: boolean`, `creatorId?: number` props.
  - Data sources: calls `shoppableVideosApi.getVideos()` for global feed; when `creatorId` is provided, calls `creatorsApi.getCreatorVideos(creatorId, page)`.
  - Pagination: implements infinite-scroll using `IntersectionObserver` on a sentinel element and `page` state.
  - Rendering: shows video thumbnail cards with product badge, price pill and `Buy Now` button.
  - Video behavior: per-card `VideoThumbnail` component auto-plays muted video (`autoPlay`, `loop`, `playsInline`), toggles audio on user interaction, and handles play errors gracefully.
  - Actions:
    - `Buy Now` → calls `shoppableVideosApi.addToCart(videoId, { quantity })` and shows toast messages.
    - Clicking product/name navigates to `/marketplace/{productId}`.
  - Error handling: catches load/add-to-cart errors and displays console logs/toasts.

- **CreatorsList** — [src/components/CreatorsList.tsx](src/components/CreatorsList.tsx)
  - Role: searchable listing of creators (store view) with masonry-style cards and follow buttons.
  - Data sources:
    - `creatorsApi.listCreators(q, page)` to fetch creators with pagination.
    - Also pre-fetches recent videos via `shoppableVideosApi.getVideos()` to show creator thumbnails (maps videos by uploader).
  - Follow state: uses `creatorsApi.getFollowers` and local logic to determine whether current user follows creators; renders `FollowButton` which toggles follow state.
  - Navigation: clicking a creator goes to `/creators/{id}`.

- **CreatorVideos** — [src/components/CreatorVideos.tsx](src/components/CreatorVideos.tsx)
  - Role: lists videos for a specific creator; used inside `CreatorProfilePage` and accepts `creatorId` and optional `compact` prop.
  - Data source: `creatorsApi.getCreatorVideos(creatorId, page)` (paginated `PaginatedVideos`).
  - Video behavior: similar `VideoThumbnail` component with autoplay-muted, toggle-audio, and modal player for selected video.
  - Actions:
    - `Buy Now` → `shoppableVideosApi.addToCart(videoId, { quantity })`.
    - When opening modal player, the component registers a view and calls `shoppableVideosApi.incrementView(id)` (debounced via sessionStorage to avoid duplicate increments).

- **CreatorProfilePage** — [src/components/CreatorProfilePage.tsx](src/components/CreatorProfilePage.tsx)
  - Role: creator detail page showing profile header, follower counts, bio, tabs for `Posts` and `Products`.
  - Data sources: `creatorsApi.getCreator(id)` for profile; `CreatorVideos` for posts; marketplace product list (direct axios call to `/api/v1/marketplace/`) when `Products` tab active.
  - Follows: uses `creatorsApi.isFollowing` and `FollowButton` to manage follow state and update local counts.

Implementation notes / patterns
-----------------------------
- Video playback: components auto-play videos muted and provide a visible unmute/mute toggle; `play()` rejections are caught and muted state preserved until user interaction.
- Add-to-cart flow: all `Buy Now` buttons call `shoppableVideosApi.addToCart` with `{ quantity }`. UI shows toast success/failure.
- View tracking: `incrementView` is called from both `shoppableVideosApi` and `creatorsApi.incrementVideoView` (creators wrapper calls the same endpoint). Modal players use `sessionStorage` to limit duplicate increments per session.
- Follow flow: `FollowButton` centralizes follow/unfollow behavior; listing pages use `creatorsApi.getFollowers`/`isFollowing` to precompute initial state.
- Error handling: API wrappers return `response.data`; calling components catch errors and display toast messages or fallbacks.

Links to files
-------------
- For feed components: [src/components/ForYouPage.tsx](src/components/ForYouPage.tsx), [src/components/ForYouGrid.tsx](src/components/ForYouGrid.tsx)
- Creators & profile: [src/components/CreatorsList.tsx](src/components/CreatorsList.tsx), [src/components/CreatorProfilePage.tsx](src/components/CreatorProfilePage.tsx), [src/components/CreatorVideos.tsx](src/components/CreatorVideos.tsx)

Shoppable Video Feed
---------------------
Component: [src/components/ShoppableVideoFeed.tsx](src/components/ShoppableVideoFeed.tsx)

- Role: immersive full-screen feed (TikTok-style) for shoppable videos; supports vertical swipe navigation, active-video tracking, and inline actions.
- Structure:
  - `ShoppableVideoFeed` — main container: fetches videos via `shoppableVideosApi.getVideos(page)`, handles pagination, scroll/snap behavior, and active index tracking via `IntersectionObserver`.
  - `VideoItem` — per-video display: video element, overlay metadata, action column (like, comment, save, share, report, mute, product quick-add), and product strip.
  - `CommentsSheet` — inline comments modal/sheet inside `ShoppableVideoFeed` (fetches via `shoppableVideosApi.getComments`, posts via `shoppableVideosApi.addComment`).

- Key behaviours and UI patterns:
  - Autoplay muted videos; toggle sound on tap; `muteAllOthers` helper mutes other playing items when one is unmuted.
  - Swipe navigation via touch handlers: detects swipe up/down and scrolls container to next/previous video.
  - Active video detection via `IntersectionObserver` threshold (0.65) and updates `activeVideoIndex`.
  - View deduplication: stores seen video ids in `sessionStorage` under `viewed_video_ids` to avoid duplicate increments; calls `creatorsApi.incrementVideoView(video.id)` on first view.
  - Product interactions: product strip displays `product` and `additional_products` with images/prices; clicking opens `/marketplace/{productId}`.
  - `Buy` quick-add: `handleAddToCart` calls `shoppableVideosApi.addToCart(video.id, { quantity: 1 })` and shows toast messages.
  - Like/Save/Share/Report flows call `shoppableVideosApi.likeVideo`, `saveVideo`, `shareVideo`, `reportVideo` respectively and update optimistic UI state.
  - Comments: opens `CommentsSheet` which fetches and posts comments; posting requires auth and uses `addComment`.

- API calls used by `ShoppableVideoFeed`:
  - `shoppableVideosApi.getVideos(page?)` — list feed
  - `creatorsApi.incrementVideoView(videoId)` — record view (wrapper posts to `/shoppable-videos/{id}/view/`)
  - `shoppableVideosApi.likeVideo(id)` — like/unlike
  - `shoppableVideosApi.saveVideo(id)` — save/unsave
  - `shoppableVideosApi.shareVideo(id)` — record share
  - `shoppableVideosApi.addToCart(id, payload)` — quick add to cart
  - `shoppableVideosApi.getComments(videoId)` — fetch comments
  - `shoppableVideosApi.addComment(payload)` — post comment
  - `shoppableVideosApi.reportVideo(payload)` — report
  - `creatorsApi.toggleFollow(uploaderId)` — follow/unfollow uploader (used via `FollowButton` / local handler)

- Types used: `ShoppableVideo`, `VideoComment`, `ShoppableVideoProduct`, `ShoppableVideoListResponse` (see types files linked above).

Files & other usages discovered
--------------------------------
- `src/components/ShoppableVideoFeed.tsx` — immersive feed (detailed above)
- `src/components/ForYouGrid.tsx` — grid-style feed; calls `shoppableVideosApi.getVideos`, uses `addToCart` per-card
- `src/components/CreatorsList.tsx` — creators listing prefetches videos via `shoppableVideosApi.getVideos(200)` for thumbnails
- `src/components/CreatorVideos.tsx` — creator-specific list; calls `creatorsApi.getCreatorVideos` and `shoppableVideosApi.addToCart`/`incrementView`
- `src/components/CreatorProfilePage.tsx` — mounts `CreatorVideos` and handles products tab (marketplace fetch)
- `src/api/shoppableVideosApi.ts` — API wrapper for all video endpoints (getVideos, getVideoDetails, like/save/share/view/add_to_cart, comments, follows, reports)
- `src/api/creatorsApi.ts` — creators wrapper (list/get, getCreatorVideos, toggleFollow, incrementVideoView)
- `src/types/shoppableVideo.ts`, `src/types/creator.ts` — all relevant type definitions


Creators API & types
--------------------
This section documents the creator-related API calls and TypeScript types used by the ForYou / Creator UI.

Client wrapper: [src/api/creatorsApi.ts](src/api/creatorsApi.ts)

Endpoints
- GET `/api/v1/creators/` — `listCreators(q?: string, page?: number)`
  - Query params: `q` (search string), `page` (number)
  - Response: `PaginatedCreators` — { count, next, previous, results: CreatorProfile[] }

- GET `/api/v1/creators/{id}/` — `getCreator(id)`
  - Response: `CreatorProfile`

- GET `/api/v1/creators/{id}/videos/` — `getCreatorVideos(id, page?)`
  - Query params: `page` (number)
  - Response: `PaginatedVideos` — { count, next, previous, results: ShoppableVideoBrief[] }

- POST `/api/v1/creators/{id}/follow/` — `toggleFollow(id)`
  - Request body: none (wrapper posts empty body)
  - Response: `FollowToggleResponse` — `{ following: boolean; follower_count: number }`

- GET `/api/v1/creators/{id}/followers/` — `getFollowers(id)`
  - Response: paginated followers list (wrapper normalizes results)

- GET `/api/v1/creators/me_following/` — `getMyFollowing()` / `isFollowing(creatorId)`
  - Response: array or paginated list of `CreatorProfile` entries representing followed creators

- POST `/api/v1/shoppable-videos/{videoId}/view/` — `incrementVideoView(videoId)` (also called via `creatorsApi.incrementVideoView`)
  - Response: `ShoppableVideoViewResponse` — `{ id: number; views_count: number }`

Key TypeScript types (from `src/types/creator.ts`)
```typescript
export interface CreatorProfile {
  id: number;
  user: number;
  handle: string;
  display_name: string;
  bio?: string | null;
  follower_count: number;
  views_count: number;
  profile_image?: string | null;
  social_links?: { [key: string]: string } | null;
  is_following?: boolean;
  following?: boolean;
}

export interface PaginatedCreators { count: number; next: string | null; previous: string | null; results: CreatorProfile[] }

export interface ProductTag { id: number; product_id: number; x: number; y: number; label?: string | null }

export interface ShoppableVideoBrief {
  id: number; title: string; video_url: string; thumbnail?: string | null;
  uploader_profile?: CreatorProfile | null; creator_profile?: CreatorProfile | null;
  product_tags?: ProductTag[]; views_count: number; created_at: string;
}

export interface PaginatedVideos { count: number; next: string | null; previous: string | null; results: ShoppableVideoBrief[] }

export interface FollowToggleResponse { following: boolean; follower_count: number }

export interface ShoppableVideoViewResponse { id: number; views_count: number }
```

How components use these calls
- `CreatorsList` calls `creatorsApi.listCreators` and also prefetches recent videos via `shoppableVideosApi.getVideos()` to display thumbnails per creator.
- `CreatorProfilePage` calls `creatorsApi.getCreator` for profile data and renders `CreatorVideos` (which calls `creatorsApi.getCreatorVideos`).
- `CreatorVideos` calls `creatorsApi.getCreatorVideos` and calls `shoppableVideosApi.addToCart` / `incrementView` for interactions.

Notes
- The creators API wrapper normalizes different backend responses (arrays vs paginated objects) in several helper return paths; consumers defensively handle either shape.
- Follow state may be computed client-side by fetching followers for a creator and comparing to current user id; `creatorsApi.isFollowing` provides a helper wrapper.

