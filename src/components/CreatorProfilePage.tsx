import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { creatorsApi } from '../api/creatorsApi';
import { CreatorProfile } from '../types/creator';
import CreatorVideos from './CreatorVideos';
import axios from 'axios';
import FollowButton from './FollowButton';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Pagination from './Pagination';

const CreatorProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const [savingFollow, setSavingFollow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'products'>('posts');
  const [sellerProducts, setSellerProducts] = useState<any[]>([]);
  const [sellerLoading, setSellerLoading] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 24;
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    creatorsApi.getCreator(Number(id)).then((p) => {
      setProfile(p);
      // if authenticated, check whether current user follows this creator
      if (isAuthenticated) {
        creatorsApi.isFollowing(p.id).then((f) => setIsFollowing(f)).catch(() => setIsFollowing(false));
      } else {
        setIsFollowing(false);
      }
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    // when products tab is active, fetch seller marketplace products with pagination
    const fetchSellerProducts = async (p = 1) => {
      if (!profile) return;
      setSellerLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Token ${token}` } : {};
        const url = `${import.meta.env.VITE_REACT_APP_API_URL}/api/v1/marketplace/`;
        const params: any = { user_id: profile.user, limit: itemsPerPage, offset: (p - 1) * itemsPerPage };
        const { data } = await axios.get(url, { params, headers });
        const results = data && Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []);
        setSellerProducts(results);
        setTotalCount(typeof data.count === 'number' ? data.count : (results.length < itemsPerPage ? (p - 1) * itemsPerPage + results.length : null));
        setPage(p);
      } catch (err) {
        console.error('Failed to load seller marketplace products', err);
        setSellerProducts([]);
        setTotalCount(null);
      } finally {
        setSellerLoading(false);
      }
    };

    if (activeTab === 'products') fetchSellerProducts(page);
  }, [activeTab, profile, page]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Creator not found</h2>
          <Link to="/creators" className="text-blue-600 hover:underline">
            Back to Creators
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="flex items-start gap-6 mb-6">
          <img
            src={profile.profile_image || profile.avatar || '/placeholder-avatar.png'}
            alt={profile.display_name || profile.handle}
            className="w-20 h-20 rounded-full object-cover flex-shrink-0 border-2 border-gray-100"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {profile.display_name || profile.handle}
              </h1>
              {isFollowing !== null && (
                <FollowButton
                  creatorId={profile.id}
                  initialFollowing={!!isFollowing}
                  onToggle={(following, follower_count) => {
                    setIsFollowing(following);
                    if (typeof follower_count === 'number') {
                      setProfile((p) => (p ? { ...p, follower_count } : p));
                    } else {
                      // best-effort local adjust
                      setProfile((p) => (p ? { ...p, follower_count: p.follower_count + (following ? 1 : -1) } : p));
                    }
                  }}
                  className="px-6 py-1.5"
                />
              )}
            </div>
            <div className="text-sm text-gray-600 mb-3">
              {profile.follower_count || 0} followers
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {profile.bio || 'No bio available'}
            </p>
          </div>
        </div>

        {/* Tabs */}
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

        {/* Search Bar */}
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

        {/* Collections Section */}
        {activeTab === 'posts' && (
          <>

            {/* Recent Posts Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent posts</h2>
              <CreatorVideos creatorId={profile.id} />
            </div>
          </>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Products</h2>

            {sellerLoading ? (
              <div className="p-6">Loading products...</div>
            ) : sellerProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No products available</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {sellerProducts.map((p) => {
                  const img = p.product_details?.images?.[0]?.image || p.product_details?.image || '/product-placeholder.png';
                  const name = p.product_details?.name || p.product_details?.title || 'Product';
                  const price = p.discounted_price ?? p.listed_price ?? (p.product_details?.price ?? null);
                  return (
                    <div
                      key={p.id}
                      className="bg-white rounded-lg overflow-hidden shadow hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/marketplace/${p.id}`)}
                    >
                      <div className="w-full h-40 bg-gray-100">
                        <img src={img} alt={name} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-3">
                        <div className="text-sm font-medium text-gray-800 line-clamp-2 mb-2">{name}</div>
                        <div className="text-sm text-gray-600">Rs. {price}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {/* Pagination controls */}
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
