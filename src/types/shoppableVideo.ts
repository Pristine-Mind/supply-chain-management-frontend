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
    video_file: string;
    thumbnail: string | null;
    title: string;
    description: string;
    product: ShoppableVideoProduct;
    views_count: number;
    likes_count: number;
    shares_count: number;
    created_at: string;
    is_liked: boolean;
    is_saved: boolean;
    tags: string[];
    trend_score: number;
}

export interface ShoppableVideoListResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: ShoppableVideo[];
}
