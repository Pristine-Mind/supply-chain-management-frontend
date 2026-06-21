import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { creatorsApi } from '../api/creatorsApi';
import { CreatorProfile } from '../types/creator';
import CreatorVideos from './CreatorVideos';
import FollowButton from './FollowButton';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import Pagination from './Pagination';
import { ProductCard, type ProductCardData } from './product/ProductCard';
import { EmptyState } from './ui/empty-state';
import { Spinner } from './ui/spinner';
import { User, ShoppingBag } from 'lucide-react';

interface CreatorProduct {
  id: number;
  product_details?: {
    name?: string;
    title?: string;
    image?: string;
    images?: { image?: string }[];
    category_details?: string;
    stock?: number;
    price?: number;
  };
  listed_price?: number;
  discounted_price?: number | null;
  percent_off?: number;
  is_available?: boolean;
  average_rating?: number;
  total_reviews?: number;
}

const toProductCardData = (p: CreatorProduct): ProductCardData => {
  const price = p.discounted_price ?? p.listed_price ?? (p.product_details?.price ?? 0);
  const originalPrice = p.listed_price ?? (p.product_details?.price ?? null);
  const hasDiscount =
    p.discounted_price != null &&
    originalPrice != null &&
    p.discounted_price > 0 &&
    p.discounted_price < originalPrice;

  return {
    id: p.id,
    name: p.product_details?.name || p.product_details?.title || 'Product',
    image: p.product_details?.images?.[0]?.image || p.product_details?.image || '/product-placeholder.png',
    href: `/marketplace/${p.id}`,
    price,
    originalPrice: hasDiscount ? originalPrice : null,
    percentOff: p.percent_off,
    savings: hasDiscount ? originalPrice! - p.discounted_price! : 0,
    stock: p.product_details?.stock ?? 0,
    category: p.product_details?.category_details,
    rating: p.average_rating,
    reviewCount: p.total_reviews,
    isAvailable: p.is_available ?? true,
  };
};

const CreatorProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'products'>('posts');
  const [sellerProducts, setSellerProducts] = useState<CreatorProduct[]>([]);
  const [sellerLoading, setSellerLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editDisplayName, setEditDisplayName] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 24;
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    creatorsApi.getCreator(Number(id)).then((p) => {
      setProfile(p);
      setEditBio(p.bio || '');
      setEditDisplayName(p.display_name || '');
      if (isAuthenticated) {
        creatorsApi.isFollowing(p.id).then((f) => setIsFollowing(f)).catch(() => setIsFollowing(false));
      } else {
        setIsFollowing(false);
      }
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const fetchSellerProducts = async (p = 1) => {
      if (!id) return;
      setSellerLoading(true);
      try {
        const data = await creatorsApi.getCreatorProducts(Number(id), p);
        const results = data && Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []);
        setSellerProducts(results);
        
        if (data && typeof data.count === 'number') {
          setTotalCount(data.count);
        } else {
          setTotalCount(results.length < itemsPerPage ? (p - 1) * itemsPerPage + results.length : null);
        }
        setPage(p);
      } catch (err) {
        console.error('Failed to load creator products', err);
        setSellerProducts([]);
        setTotalCount(null);
      } finally {
        setSellerLoading(false);
      }
    };

    if (activeTab === 'products') fetchSellerProducts(page);
  }, [activeTab, id, page]);

  const handleUpdateProfile = async () => {
    if (!profile) return;
    try {
      const updated = await creatorsApi.updateCreator(profile.id, {
        bio: editBio,
        display_name: editDisplayName,
      });
      setProfile(updated);
      setIsEditing(false);
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" color="neutral" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <EmptyState
          icon={User}
          title="Creator not found"
          description="The creator you're looking for doesn't exist or has been removed."
          action={
            <Link
              to="/creators"
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Back to Creators
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-start gap-6 mb-6">
          <img
            src={profile.profile_image || profile.avatar || '/placeholder-avatar.png'}
            alt={profile.display_name || profile.handle}
            className="w-20 h-20 rounded-full object-cover flex-shrink-0 border-2 border-gray-100"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              {isEditing ? (
                <input 
                  value={editDisplayName} 
                  onChange={e => setEditDisplayName(e.target.value)}
                  className="text-2xl font-bold text-gray-900 border-b border-gray-300 focus:outline-none"
                />
              ) : (
                <h1 className="text-2xl font-bold text-gray-900">
                  {profile.display_name || profile.handle}
                </h1>
              )}
              {isAuthenticated && user && (user.id === profile.user) ? (
                <button 
                  onClick={() => isEditing ? handleUpdateProfile() : setIsEditing(true)}
                  className="text-xs font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 px-3 py-1 rounded-full transition-colors"
                >
                  {isEditing ? 'Save Changes' : 'Edit Profile'}
                </button>
              ) : (
                isFollowing !== null && (
                  <FollowButton
                    creatorId={profile.id}
                    initialFollowing={!!isFollowing}
                    onToggle={(following, follower_count) => {
                      setIsFollowing(following);
                      if (typeof follower_count === 'number') {
                        setProfile((p) => (p ? { ...p, follower_count } : p));
                      } else {
                        setProfile((p) => (p ? { ...p, follower_count: p.follower_count + (following ? 1 : -1) } : p));
                      }
                    }}
                    className="px-6 py-1.5"
                  />
                )
              )}
            </div>
            <div className="flex gap-4 text-sm text-gray-600 mb-3">
              <span><strong>{profile.follower_count || 0}</strong> followers</span>
              <span><strong>{profile.following_count || 0}</strong> following</span>
              <span><strong>{profile.views_count || 0}</strong> views</span>
            </div>
            {isEditing ? (
              <textarea
                value={editBio}
                onChange={e => setEditBio(e.target.value)}
                className="w-full text-sm text-gray-700 leading-relaxed border border-gray-200 rounded-lg p-2 focus:ring-1 focus:ring-primary-500 outline-none"
                rows={3}
              />
            ) : (
              <p className="text-sm text-gray-700 leading-relaxed">
                {profile.bio || 'No bio available'}
              </p>
            )}
          </div>
        </div>

        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('posts')}
              className={`pb-3 px-1 text-sm font-semibold relative transition-colors ${
                activeTab === 'posts'
                  ? 'text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Posts
              {activeTab === 'posts' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`pb-3 px-1 text-sm font-semibold relative transition-colors ${
                activeTab === 'products'
                  ? 'text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Products
              {activeTab === 'products' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>
              )}
            </button>
          </div>
        </div>

        <div className="mb-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search all posts"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:bg-white transition-colors"
            />
          </div>
        </div>

        {activeTab === 'posts' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent posts</h2>
            <CreatorVideos creatorId={profile.id} />
          </div>
        )}

        {activeTab === 'products' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Products</h2>

            {sellerLoading ? (
              <div className="py-12 flex justify-center">
                <Spinner size="lg" color="neutral" />
              </div>
            ) : sellerProducts.length === 0 ? (
              <EmptyState
                icon={ShoppingBag}
                title="No products available"
                description="This creator hasn't listed any products yet."
                action={
                  <button
                    onClick={() => navigate('/marketplace/all-products')}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Browse Marketplace
                  </button>
                }
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {sellerProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={toProductCardData(p)}
                    size="sm"
                  />
                ))}
              </div>
            )}

            <div className="mt-6">
              <Pagination
                page={page}
                totalPages={totalCount ? Math.ceil(totalCount / itemsPerPage) : null}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatorProfilePage;
