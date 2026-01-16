# API & Performance Optimization Strategy

This document outlines recommended API-level and performance optimizations for the Pristine Minds Supply Chain Management frontend. The current architecture relies on manual state management and fetching patterns which can be significantly improved for better scalability, performance, and user experience.

## 1. Centralized API Client Architecture

### Current State
- Multiple components and service files (`authApi.ts`, `marketplaceApi.ts`) define `API_URL` independently.
- Tokens and headers are often managed manually.
- No global interceptors for logging or error handling.

### Recommended Optimization
Create a centralized `apiClient` using an Axios instance.
- **Interceptors**: Automatically attach the `Authorization` header to every request if a token exists in `localStorage` or `Cookies`.
- **Global Error Handling**: Use response interceptors to catch 401 (Unauthorized) errors and trigger a logout/redirect, or 500 errors to show a global notification.
- **Base Configuration**: Define timeouts and default headers in one place.

## 2. Implement Data Synchronization Library (TanStack Query/SWR)

### Current State
- Data is fetched inside `useEffect` and stored in local `useState`.
- Navigating away from a page and back triggers a full re-fetch (no caching).
- Loading and error states are manually managed in almost every component.

### Recommended Optimization
Adopt **TanStack Query (React Query)** or **SWR**.
- **Automatic Caching**: Fetched data is cached globally. Returning to a page shows cached data instantly while refreshing in the background (Stale-While-Revalidate).
- **Request Deduplication**: Prevents multiple identical API calls from triggering at the same time across different components.
- **Refetch on Window Focus**: Ensures data is always fresh when the user returns to the tab.
- **Built-in States**: Replaces manual `loading` and `error` states with standardized `isLoading`, `isError`, and `data` objects.

## 3. Race Condition & Request Cancellation

### Current State
- Long-running requests in search bars or paginated lists can result in "out-of-order" data if the user interacts quickly.

### Recommended Optimization
- **AbortController**: Use `AbortController` in Axios to cancel previous requests when a new one is initiated (especially in `SearchSuggestions.tsx` and filtered grids).
- **Query Keys**: TanStack Query handles this automatically by cancelling previous queries for the same key.

## 4. Polling & Real-time Efficiency

### Current State
- `ChatTab.tsx` uses a fixed 5-second `setInterval` to fetch messages.
- Polling continues at the same rate even if the tab is inactive or the server is struggling.

### Recommended Optimization
- **Adaptive Polling**: Use TanStack Query's `refetchInterval`. It can pause when the window is out of focus.
- **Exponential Backoff**: If a request fails, increase the time between polls.
- **WebSocket Migration**: For the Chat feature, moving to WebSockets would eliminate polling overhead entirely.

## 5. Optimistic UI Updates

### Current State
- User actions (like "Following" a creator or "Adding to Cart") wait for a server response before updating the UI, leading to a "heavy" or "slow" feel.

### Recommended Optimization
- **Optimistic Updates**: Immediately update the UI state (e.g., change the "Follow" button to "Following") and roll back only if the API call fails. This provides an "instant" feel to the application.

## 6. Batching & Payload Optimization

### Current State
- Some pages make multiple sequential requests (e.g., `CreatorProfilePage.tsx` fetches profile then follow status).

### Recommended Optimization
- **API Aggregation**: Where possible, modify backend endpoints to return related data in a single payload.
- **Select Fields**: If supported by the backend, request only necessary fields to reduce JSON payload size.

## 7. Prefetching & Perceived Speed

### Current State
- Data fetching only starts once the component mounts.

### Recommended Optimization
- **Hover Prefetching**: Start fetching data for a product or category when the user hovers over a link.
- **Router Integration**: Prefetch data required for a route during the navigation phase.

## 8. Pagination & Infinite Loading

### Current State
- Many components fetch the entire list or use simple "Next/Prev" buttons.

### Recommended Optimization
- **Infinite Scroll**: Use `useInfiniteQuery` (TanStack Query) combined with the `IntersectionObserver` pattern (like the `LazySection` implemented) for seamless product browsing.
- **Virtualization**: For very long lists (like Order History or Audit Logs), use `react-window` or `@tanstack/react-virtual` to render only the visible rows, reducing DOM nodes and improving scroll performance.
