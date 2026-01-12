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
    comments_count?: number;
    created_at: string;
    is_liked: boolean;
    is_saved: boolean;
    is_following?: boolean;
    tags: string[];
    trend_score: number;
}

export interface ShoppableCategory {
    id: number;
    name: string;
    icon?: string | null;
    image?: string | null; // Keep for backward compatibility if needed
    slug?: string;
    is_active?: boolean;
    order?: number;
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
