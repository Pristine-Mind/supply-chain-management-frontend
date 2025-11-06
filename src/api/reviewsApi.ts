import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL;

export interface ReviewData {
  id?: number;
  product: number;
  user?: string;
  user_id?: number;
  username?: string;
  rating: number;
  review_text?: string;
  created_at?: string;
}

export interface CreateReviewData {
  product: number;
  rating: number;
  review_text?: string;
}

export interface UpdateReviewData {
  rating?: number;
  review_text?: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Token ${token}` } : {};
};

// Get all reviews for a product
export const getProductReviews = async (productId: number): Promise<ReviewData[]> => {
  const response = await axios.get(
    `${API_BASE_URL}/api/v1/reviews/?product_id=${productId}`
  );
  return response.data;
};

// Get a specific review by ID
export const getReviewById = async (reviewId: number): Promise<ReviewData> => {
  const response = await axios.get(
    `${API_BASE_URL}/api/v1/reviews/${reviewId}/`,
    { headers: getAuthHeaders() }
  );
  return response.data;
};

// Create a new review (requires authentication)
export const createReview = async (reviewData: CreateReviewData): Promise<ReviewData> => {
  const response = await axios.post(
    `${API_BASE_URL}/api/v1/reviews/`,
    reviewData,
    { headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' } }
  );
  return response.data;
};

// Update an existing review (requires authentication, user can only update their own review)
export const updateReview = async (reviewId: number, reviewData: UpdateReviewData): Promise<ReviewData> => {
  const response = await axios.patch(
    `${API_BASE_URL}/api/v1/reviews/${reviewId}/`,
    reviewData,
    { headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' } }
  );
  return response.data;
};

// Delete a review (requires authentication, user can only delete their own review)
export const deleteReview = async (reviewId: number): Promise<void> => {
  await axios.delete(
    `${API_BASE_URL}/api/v1/reviews/${reviewId}/`,
    { headers: getAuthHeaders() }
  );
};

// Get current user's reviews (requires authentication)
export const getUserReviews = async (): Promise<ReviewData[]> => {
  const response = await axios.get(
    `${API_BASE_URL}/api/v1/reviews/my-reviews/`,
    { headers: getAuthHeaders() }
  );
  return response.data;
};

// Check if user has already reviewed a product
export const getUserReviewForProduct = async (productId: number): Promise<ReviewData | null> => {
  try {
    const userReviews = await getUserReviews();
    const existingReview = userReviews.find(review => review.product === productId);
    return existingReview || null;
  } catch (error) {
    // If user is not authenticated or API call fails, return null
    return null;
  }
};