# Shoppable Video API & Integration Reference

## Overview
The Shoppable Video feature enables creators to upload video/image content with embedded products that viewers can purchase directly. The system supports three content types: videos, images, and collections.

**Last Updated:** January 21, 2026

---

## API Endpoints

All endpoints use Bearer token authentication (required for most operations).

### Base URL
```
/api/v1/shoppable-videos/
/api/v1/shoppable-video-categories/
/api/v1/video-comments/
/api/v1/user-follows/
/api/v1/video-reports/
```

### Videos Endpoints

#### 1. Get Video Feed
```
GET /api/v1/shoppable-videos/
```

**Parameters:**
- `category` (optional): Filter by category ID
- `page` (optional): Pagination (default: 1)

**Response:**
```typescript
{
  count: number;
  next: string | null;
  previous: string | null;
  results: ShoppableVideo[];
}
```

**Usage:**
```typescript
const response = await shoppableVideosApi.getVideos(categoryId, page);
```

---

#### 2. Get Single Video Details
```
GET /api/v1/shoppable-videos/{id}/
```

**Response:** `ShoppableVideo`

**Usage:**
```typescript
const video = await shoppableVideosApi.getVideoDetails(videoId);
```

---

#### 3. Upload Video/Image Content
```
POST /api/v1/shoppable-videos/
Content-Type: multipart/form-data
```

**Request Body:**
```typescript
{
  content_type: 'VIDEO' | 'IMAGE' | 'COLLECTION';
  video_file?: File;           // For VIDEO type
  image_file?: File;           // For IMAGE type
  title: string;
  description: string;
  category: number;            // Category ID
  product: number;             // Primary product ID
  tags: string[];
}
```

**Response:** `ShoppableVideo`

**Usage:**
```typescript
const formData = new FormData();
formData.append('content_type', 'VIDEO');
formData.append('video_file', videoFile);
formData.append('title', 'My Video Title');
formData.append('description', 'Description');
formData.append('category', categoryId);
formData.append('product', productId);
formData.append('tags', JSON.stringify(['tag1', 'tag2']));

const video = await shoppableVideosApi.uploadContent(formData);
```

**File:** `src/components/ShoppableUploadModal.tsx`

---

#### 4. Add Item to Collection
```
POST /api/v1/shoppable-videos/{id}/add-item/
Content-Type: multipart/form-data
```

**Request Body:**
```typescript
{
  file: File;        // Image or video file
  order: number;     // Position in collection
  product_id: number;// Product for this item
}
```

**Response:** `{ id, file, order, thumbnail }`

**Usage:**
```typescript
const formData = new FormData();
formData.append('file', itemFile);
formData.append('order', 1);
formData.append('product_id', productId);

const item = await shoppableVideosApi.addItemToCollection(videoId, formData);
```

---

#### 5. Track Interaction (Analytics)
```
POST /api/v1/shoppable-videos/{id}/track-interaction/
```

**Request Body:**
```typescript
{
  event_type: 'watch_time' | 'cta_click' | 'scroll_pause';
  dwell_time?: number;        // Time in seconds
  extra_data?: Record<string, any>;
}
```

**Response:** `{ status: 'success' | 'error' }`

**Usage:**
```typescript
await shoppableVideosApi.trackInteraction(videoId, {
  event_type: 'watch_time',
  dwell_time: 45
});
```

**Implementations:**
- `src/components/ShoppableReels.tsx` - Tracks watch time when video becomes inactive
- `src/components/ForYouPage.tsx` - Tracks interactions on category changes

---

#### 6. Get "More Like This" Videos
```
GET /api/v1/shoppable-videos/{id}/more-like-this/
```

**Response:** `ShoppableVideo[]`

**Usage:**
```typescript
const relatedVideos = await shoppableVideosApi.getMoreLikeThis(videoId);
```

**Implementation:** `src/components/ShoppableReels.tsx` - Shows related videos in sidebar

---

#### 7. Get "Also Watched" Videos
```
GET /api/v1/shoppable-videos/{id}/also-watched/
```

**Response:** `ShoppableVideo[]`

**Usage:**
```typescript
const alsoWatchedVideos = await shoppableVideosApi.getAlsoWatched(videoId);
```

**Implementation:** `src/components/ShoppableReels.tsx` - Shows videos other users watched

---

#### 8. Like Video
```
POST /api/v1/shoppable-videos/{id}/like/
```

**Response:**
```typescript
{
  status: 'success';
  liked: boolean;
  likes_count: number;
}
```

**Usage:**
```typescript
const response = await shoppableVideosApi.likeVideo(videoId);
setIsLiked(response.liked);
setLikesCount(response.likes_count);
```

**Implementations:**
- `src/components/ShoppableReels.tsx` - Heart button in reel interface
- `src/components/ShoppableVideoFeed.tsx` - Like functionality in feed

---

#### 9. Save Video
```
POST /api/v1/shoppable-videos/{id}/save_video/
```

**Response:**
```typescript
{
  status: 'success';
  saved: boolean;
}
```

**Usage:**
```typescript
const response = await shoppableVideosApi.saveVideo(videoId);
setIsSaved(response.saved);
```

**Implementations:**
- `src/components/ShoppableReels.tsx` - Bookmark button in reel interface
- `src/components/ShoppableVideoFeed.tsx` - Save functionality in feed

---

#### 10. Share Video
```
POST /api/v1/shoppable-videos/{id}/share/
```

**Response:**
```typescript
{
  status: 'success';
  shares_count: number;
}
```

**Usage:**
```typescript
const response = await shoppableVideosApi.shareVideo(videoId);
setSharesCount(response.shares_count);
```

**Implementations:**
- `src/components/ShoppableReels.tsx` - Share button in reel interface
- `src/components/ShoppableVideoFeed.tsx` - Share functionality in feed

---

#### 11. Increment View Count
```
POST /api/v1/shoppable-videos/{id}/view/
```

**Response:**
```typescript
{
  status: 'success';
  views_count: number;
}
```

**Usage:**
```typescript
const response = await shoppableVideosApi.incrementView(videoId);
```

**Implementations:**
- `src/components/ShoppableReels.tsx` - Increments when video plays
- `src/components/ShoppableVideoFeed.tsx` - Increments on view

---

#### 12. Add Product to Cart (from Video)
```
POST /api/v1/shoppable-videos/{id}/add_to_cart/
```

**Request Body:**
```typescript
{
  product_id?: number;  // Specific product (if multiple)
  quantity: number;
}
```

**Response:**
```typescript
{
  status: 'success';
  message: string;
  cart_item_count: number;
}
```

**Usage:**
```typescript
const response = await shoppableVideosApi.addToCart(videoId, {
  product_id: productId,
  quantity: 1
});
```

**Implementations:**
- `src/components/ShoppableReels.tsx` - Shopping bag button
- `src/components/ShoppableVideoFeed.tsx` - Product purchase interface

---

### Categories Endpoints

#### 1. Get All Categories
```
GET /api/v1/shoppable-video-categories/
```

**Response:** `ShoppableCategory[]`

**Usage:**
```typescript
const categories = await shoppableVideosApi.getCategories();
```

**Implementations:**
- `src/components/ForYouPage.tsx` - Loads categories for tab display
- `src/components/ShoppableUploadModal.tsx` - Category selection in upload form
- `src/components/ShoppableCategories.tsx` - Category carousel display

---

#### 2. Get Category Videos
```
GET /api/v1/shoppable-video-categories/{id}/videos/
```

**Response:** `ShoppableVideo[]`

**Usage:**
```typescript
const categoryVideos = await shoppableVideosApi.getCategoryVideos(categoryId);
```

**Implementation:** `src/components/ShoppableCategories.tsx` - Loads videos for selected category

---

#### 3. Get Category Creators
```
GET /api/v1/shoppable-video-categories/{id}/creators/
```

**Response:** `Creator[]`

**Usage:**
```typescript
const creators = await shoppableVideosApi.getCategoryCreators(categoryId);
```

---

### Comments Endpoints

#### 1. Get Video Comments
```
GET /api/v1/video-comments/?video_id={id}
```

**Response:** `VideoComment[]`

**Usage:**
```typescript
const comments = await shoppableVideosApi.getComments(videoId);
```

**Implementations:**
- `src/components/ShoppableReels.tsx` - Comments sheet with nested replies
- `src/components/ShoppableVideoFeed.tsx` - Comments section in feed

---

#### 2. Add Comment
```
POST /api/v1/video-comments/
```

**Request Body:**
```typescript
{
  video: number;
  text: string;
  parent?: number | null;  // For replies
}
```

**Response:** `VideoComment`

**Usage:**
```typescript
const comment = await shoppableVideosApi.addComment({
  video: videoId,
  text: 'Great video!',
  parent: null
});
```

**Implementations:**
- `src/components/ShoppableReels.tsx` - Comment submission and reply logic
- `src/components/ShoppableVideoFeed.tsx` - Comment form integration

---

### Follow Endpoints

#### 1. Toggle Follow Creator
```
POST /api/v1/user-follows/toggle_follow/
```

**Request Body:**
```typescript
{
  following_id: number;  // Creator/user ID to follow
}
```

**Response:**
```typescript
{
  status: 'success';
  is_following: boolean;
}
```

**Usage:**
```typescript
const response = await shoppableVideosApi.toggleFollow(creatorId);
setIsFollowing(response.is_following);
```

**Implementations:**
- `src/components/ShoppableReels.tsx` - UserPlus button in reel header
- `src/components/ShoppableVideoFeed.tsx` - Follow button in creator card
- `src/components/FollowButton.tsx` - Reusable follow button component

---

### Report Endpoints

#### 1. Report Video
```
POST /api/v1/video-reports/
```

**Request Body:**
```typescript
{
  video: number;
  reason: 'spam' | 'inappropriate' | 'harassment' | 'misleading' | 'other';
  description: string;
}
```

**Response:**
```typescript
{
  status: 'success';
  message: string;
}
```

**Usage:**
```typescript
await shoppableVideosApi.reportVideo({
  video: videoId,
  reason: 'inappropriate',
  description: 'This video violates community guidelines'
});
```

**Implementation:** `src/components/ShoppableReels.tsx` - More menu with report option

---

## Data Models

### ShoppableVideo
```typescript
interface ShoppableVideo {
  id: number;
  uploader: number;                          // Creator/uploader user ID
  uploader_name: string;
  uploader_avatar?: string;
  content_type: 'VIDEO' | 'IMAGE' | 'COLLECTION';
  video_file?: string | null;               // URL to video file
  image_file?: string | null;               // URL to image file
  items?: ShoppableVideoItem[];             // For COLLECTION type
  thumbnail: string | null;                 // Video thumbnail
  category?: number;
  category_details?: ShoppableCategory;
  title: string;
  description: string;
  product: ShoppableVideoProduct;           // Primary product
  additional_products: ShoppableVideoProduct[]; // Related products
  views_count: number;
  likes_count: number;
  shares_count: number;
  comments_count?: number;
  created_at: string;                       // ISO 8601 timestamp
  is_liked: boolean;                        // Current user liked?
  is_saved: boolean;                        // Current user saved?
  is_following?: boolean;                   // Following creator?
  tags: string[];
  trend_score: number;                      // Algorithm ranking score
}
```

### ShoppableVideoProduct
```typescript
interface ShoppableVideoProduct {
  id: number;
  name: string;
  listed_price: number;
  discounted_price: number | null;
  images: {
    id: number;
    image: string;
    alt_text: string | null;
  }[];
}
```

### ShoppableVideoItem
```typescript
interface ShoppableVideoItem {
  id: number;
  video: number;
  file: string;                   // Image/video URL
  order: number;                  // Position in collection
  thumbnail?: string | null;
}
```

### ShoppableCategory
```typescript
interface ShoppableCategory {
  id: number;
  name: string;
  icon?: string | null;
  image?: string | null;
  slug?: string;
  is_active?: boolean;
  order?: number;
}
```

### VideoComment
```typescript
interface VideoComment {
  id: number;
  video: number;
  user: number;
  user_name: string;
  user_avatar?: string;
  text: string;
  created_at: string;              // ISO 8601 timestamp
  parent: number | null;           // Parent comment ID for replies
  replies?: VideoComment[];         // Nested replies
}
```

### InteractionPayload
```typescript
interface InteractionPayload {
  event_type: 'watch_time' | 'cta_click' | 'scroll_pause';
  dwell_time?: number;            // Time spent in seconds
  extra_data?: Record<string, any>;
}
```

### VideoReportPayload
```typescript
interface VideoReportPayload {
  video: number;
  reason: 'spam' | 'inappropriate' | 'harassment' | 'misleading' | 'other';
  description: string;
}
```

### AddToCartPayload
```typescript
interface AddToCartPayload {
  product_id?: number;  // Specific product from video
  quantity: number;
}
```

---

## Component Integration Map

### Core Components

#### 1. ShoppableVideoFeed.tsx (641 lines)
**Purpose:** Main feed view for shoppable videos with product cards

**Key Features:**
- Video feed with lazy loading
- Product display below each video
- Like/save/share functionality
- Comments section with nested replies
- Creator follow button
- Video reporting (spam, inappropriate, etc.)
- Related product suggestions
- Add to cart from video

**APIs Used:**
- `getComments()` - Fetch video comments
- `addComment()` - Post new comment
- `likeVideo()` - Toggle like
- `saveVideo()` - Save/bookmark video
- `shareVideo()` - Track shares
- `toggleFollow()` - Follow/unfollow creator
- `reportVideo()` - Report content
- `trackInteraction()` - Analytics
- `addToCart()` - Add product from video

**State Management:**
- Comments loading/display
- Like/save toggles with counts
- Follow status
- Comment form with reply threading
- Report modal state

---

#### 2. ShoppableReels.tsx (794 lines)
**Purpose:** Vertical reel/TikTok-like view for shoppable videos

**Key Features:**
- Vertical scroll through videos
- Auto-play when in view, pause when out
- Muted by default, toggle volume
- Dwell time tracking (watch analytics)
- Like/save/share on swipe-up menu
- Comments sheet overlay
- Creator profile and follow button
- Product showcase and add to cart
- More menu with report option
- Related videos sidebar
- Also watched recommendations

**APIs Used:**
- `trackInteraction()` - Track dwell time on each video
- `likeVideo()` - Like/unlike video
- `saveVideo()` - Save/bookmark
- `shareVideo()` - Share video
- `getComments()` - Fetch comments
- `addComment()` - Post comment
- `toggleFollow()` - Follow creator
- `getMoreLikeThis()` - Related videos
- `getAlsoWatched()` - Recommendation videos
- `reportVideo()` - Report inappropriate content
- `addToCart()` - Add product to cart

**State Management:**
- Active video for auto-play logic
- Mute/unmute state
- Like/save/follow toggles
- Comments sheet visibility
- Report modal with reason selection
- Related videos carousel
- Collection item selection

---

#### 3. ShoppableUploadModal.tsx (286 lines)
**Purpose:** Modal for creators to upload new shoppable content

**Key Features:**
- Multi-step upload wizard
- Support for video, image, or collection types
- Product search and selection
- Category selection
- Tags input
- Content type selector
- File preview
- Loading states

**APIs Used:**
- `getCategories()` - Load available categories
- `uploadContent()` - Upload video/image with metadata
- `marketplaceApi.getProducts()` - Search for products

**Implementation:**
- Step 1: Select content type and upload file
- Step 2: Add metadata (title, description, category, tags)
- Step 3: Select primary product
- Step 4: Preview and confirm

---

#### 4. ShoppableCategories.tsx
**Purpose:** Category carousel/filter component

**Key Features:**
- Category list with icons/images
- Click to filter videos
- Dynamic category loading

**APIs Used:**
- `getCategories()` - Fetch all categories
- `getCategoryVideos()` - Get videos for category

---

#### 5. ForYouPage.tsx (224 lines)
**Purpose:** Main page for "For You" video feed

**Key Features:**
- Tab view: For You / Following / Store
- Grid vs Reels view toggle
- Search/filter functionality
- Category selection
- Upload content button
- Creator list display
- Trending creators section

**APIs Used:**
- `getCategories()` - Load categories
- `trackInteraction()` - Track UI interactions

**Sub-components:**
- `ForYouGrid` - Grid view
- `MyFollowing` - Following tab
- `CreatorsList` - Featured creators
- `TrendingCreators` - Trending section
- `ShoppableUploadModal` - Upload dialog

---

### Related Components

#### CreatorsList.tsx (102 lines)
**Purpose:** Display list of creators and their videos

**APIs Used:**
- `getVideos()` - Load creator videos

**Integration:**
- Shows creator profiles with recent videos
- Navigates to creator profile on click
- Part of ForYouPage

---

#### CreatorProfilePage.tsx
**Purpose:** Individual creator profile view

**APIs Used:**
- Creator profile data
- Creator's shoppable videos

---

#### FollowButton.tsx
**Purpose:** Reusable follow/unfollow button component

**APIs Used:**
- `toggleFollow()` - Toggle follow status

**Used In:**
- ShoppableVideoFeed
- ShoppableReels
- CreatorsList
- Creator profile pages

---

### Integration Points in Other Components

#### Marketplace.tsx
**Integration:**
- ShoppableVideoFeed lazy loaded below product grid
- Separate section showing "Just For You" videos
- Swaps to shoppable video section based on user preference
- Reuses cart functionality

**Code:**
```typescript
const ShoppableVideoFeed = React.lazy(() => import('./ShoppableVideoFeed'));

// In render:
{currentSection === 'videos' && <ShoppableVideoFeed />}
```

---

#### ForYouPage Integration in App Routes
**Location:** Used in main navigation as "For You" tab

**Features:**
- Full-page shoppable video experience
- Grid or reel viewing modes
- Category filtering
- Creator discovery
- Content upload

---

## Authentication & Storage

### Authentication
```typescript
const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};
```

All endpoints require Bearer token except:
- Public video feed (can be viewed without auth, but personalization requires auth)
- Deliverability check (no auth needed)

### Local State Management
- `isLiked` - Stored locally in component state, synced with API
- `isSaved` - Local state
- `likesCount`, `sharesCount`, `viewsCount` - Updated on API calls

### Session Storage
- Comments are cached during session but refreshed on comment sheet open
- Related/also watched videos cached in component state

---

## Error Handling

### Common Errors

#### 401 Unauthorized
- User not authenticated
- Access token expired
- Solution: Redirect to login

#### 404 Not Found
- Video doesn't exist
- Product not found
- Solution: Show error message, navigate back

#### 400 Bad Request
- Invalid payload format
- Missing required fields
- Solution: Validate form before submission

#### 429 Too Many Requests
- Rate limit exceeded (mostly on upload)
- Solution: Throttle requests, show user message

#### 500 Server Error
- Backend issue
- Solution: Retry with exponential backoff

### Error Handling Pattern
```typescript
try {
  const response = await shoppableVideosApi.trackInteraction(videoId, payload);
} catch (error) {
  console.error('Failed to track interaction', error);
  // Gracefully degrade - don't break user experience
}
```

---

## Performance Optimization

### Lazy Loading
```typescript
const ShoppableVideoFeed = React.lazy(() => import('./ShoppableVideoFeed'));

// In component:
<Suspense fallback={<LoadingSpinner />}>
  <ShoppableVideoFeed />
</Suspense>
```

### Pagination
- Videos fetched with `page` parameter
- Page parameter increments for load more
- Handled in ForYouPage and ShoppableVideoFeed

### Caching Strategy
- Comments cached in component state during session
- Related videos cached in component state
- User state (likes, saves) cached locally until API confirmation

### Media Optimization
- Thumbnail generation on backend
- Video files stored separately
- Image compression on upload

---

## Testing Checklist

### Upload Flow
- [ ] Create new video with title, description, category
- [ ] Select primary product from search results
- [ ] Add tags
- [ ] Preview before upload
- [ ] Verify video appears in feed
- [ ] Check creator profile shows new video

### Interaction Tracking
- [ ] Open video in ShoppableReels
- [ ] Track dwell time when video is active
- [ ] Switch to another video
- [ ] Verify interaction posted (check network tab)
- [ ] Check analytics backend

### Comments System
- [ ] Open comments sheet
- [ ] Load existing comments
- [ ] Post new comment
- [ ] Reply to comment (nested)
- [ ] View threaded replies
- [ ] Check comment count updates

### Like/Save/Share
- [ ] Like video - button toggles, count updates
- [ ] Unlike video - button toggles back
- [ ] Save video - bookmark toggles
- [ ] Share video - share count increments
- [ ] Verify state persists on refresh

### Cart Integration
- [ ] View video with product
- [ ] Click "Add to Cart" button
- [ ] Verify product added to cart
- [ ] Check cart count badge updates
- [ ] Verify product details correct in cart

### Creator Follow
- [ ] Click follow button on creator
- [ ] Button state changes to following
- [ ] Unfollow creator
- [ ] Button state reverts
- [ ] Verify follow count updates

### Video Reporting
- [ ] Open more menu
- [ ] Click "Report"
- [ ] Select reason
- [ ] Enter description
- [ ] Submit report
- [ ] Verify success message

### Category Filtering
- [ ] Click category
- [ ] Load category videos
- [ ] Verify videos match category
- [ ] Switch categories
- [ ] Verify different videos load

---

## API Rate Limits & Quotas

- **Upload:** 10 videos per hour per creator
- **Interactions:** Unlimited tracking calls
- **Comments:** No specific limit, but may have post cooldown
- **Like/Save/Share:** No limit, per-video per-user
- **View Count:** Incremented once per session per user

---

## Troubleshooting

### Videos Not Loading
1. Check network tab for API errors
2. Verify accessToken in localStorage
3. Check API base URL configuration
4. Verify category ID is valid

### Comments Not Showing
1. Check video ID is correct
2. Verify getComments API call in network tab
3. Check response structure (might be wrapped in results array)
4. Check user permissions

### Upload Failing
1. Verify file size within limits
2. Check file format (mp4, webm for video; jpg, png for image)
3. Verify product_id exists
4. Verify category_id exists
5. Check form data serialization

### Cart Integration Issues
1. Verify useCart hook is available
2. Check product_id is being passed correctly
3. Verify addToCart function accepts payload format
4. Check error response from backend

---

## Future Enhancements

1. **Live Streaming Integration** - Real-time video streaming with shopping
2. **Product Deep Links** - Direct links to specific products in videos
3. **Video Analytics Dashboard** - Creator insights on views, engagement
4. **Influencer Metrics** - Track trend scores and creator performance
5. **Advanced Search** - Filter by trending, creator, product category
6. **Recommendations** - ML-based video recommendations
7. **Video Editing Tools** - In-app video trimming and effects
8. **Playlist Support** - Create and share video playlists
9. **Affiliate Tracking** - Track sales from specific creators
10. **Multi-language Support** - Subtitle and caption support

---

## File Structure Summary

```
src/
├── api/
│   └── shoppableVideosApi.ts          # All API calls
├── components/
│   ├── ShoppableVideoFeed.tsx          # Main feed view
│   ├── ShoppableReels.tsx              # Vertical reel view
│   ├── ShoppableUploadModal.tsx        # Upload wizard
│   ├── ShoppableCategories.tsx         # Category carousel
│   ├── ForYouPage.tsx                  # Main page container
│   ├── CreatorsList.tsx                # Creators display
│   ├── FollowButton.tsx                # Reusable follow button
│   ├── CreatorProfilePage.tsx          # Creator profile
│   └── CreatorVideos.tsx               # Creator's video list
├── types/
│   └── shoppableVideo.ts               # TypeScript interfaces
└── hooks/
    └── useCart.ts                      # Cart integration
```

---

## References

- **Backend API Docs:** `/docs/Shoppable_Features_API.md`
- **Implementation Guide:** Previous implementation documentation
- **Related Features:** Geographic API, Cart System, Creator Profiles

---

## Support & Contact

For questions or issues:
1. Check the troubleshooting section above
2. Review network requests in browser DevTools
3. Check component console for error messages
4. Verify API endpoint is responding correctly
5. Contact backend team for API issues
