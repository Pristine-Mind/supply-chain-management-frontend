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
    // optional fields returned by some endpoints
    is_following?: boolean;
    following?: boolean;
}

export interface PaginatedCreators {
    count: number;
    next: string | null;
    previous: string | null;
    results: CreatorProfile[];
}

export interface ProductTag {
    id: number;
    product_id: number;
    x: number;
    y: number;
    label?: string | null;
}

export interface ShoppableVideoBrief {
    id: number;
    title: string;
    video_url: string;
    thumbnail?: string | null;
    uploader_profile?: CreatorProfile | null;
    creator_profile?: CreatorProfile | null;
    product_tags?: ProductTag[];
    views_count: number;
    created_at: string;
}

export interface PaginatedVideos {
    count: number;
    next: string | null;
    previous: string | null;
    results: ShoppableVideoBrief[];
}

export interface FollowToggleResponse {
    following: boolean;
    follower_count: number;
}

export interface ShoppableVideoViewResponse {
    id: number;
    views_count: number;
}
