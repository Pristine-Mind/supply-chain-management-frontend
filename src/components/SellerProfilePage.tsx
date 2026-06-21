import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Store,
  BadgeCheck,
  Package,
  AlertCircle,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  getSellerProfileById,
  type SellerProfile,
  type SellerMarketplaceProduct,
  type SellerProductsPagination,
} from '../api/marketplaceApi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import LoginModal from './auth/LoginModal';
import ProductSearchBar from './ProductSearchBar';
import Footer from './Footer';
import SEOHead from './SEOHead';
import { getSellerProfiles } from '../api/marketplaceApi';
import { ProductCard, type ProductCardData } from './product/ProductCard';

/** Build the seller URL segment from their username */
export const buildSellerSlug = (_id: number, _name: string, username: string): string => username;

const AVATAR_PLACEHOLDER = 'https://via.placeholder.com/80x80?text=Seller';
const PAGE_SIZE = 20;

const SellerProfilePage: React.FC = () => {
  const { sellerSlug } = useParams<{ sellerSlug: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<SellerProductsPagination | null>(null);
  const [products, setProducts] = useState<SellerMarketplaceProduct[]>([]);
  const [resolvedId, setResolvedId] = useState<number | null>(null);

  useEffect(() => {
    if (!sellerSlug) {
      setError('Seller not found');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    getSellerProfiles({ search: sellerSlug, page_size: 10 })
      .then((res) => {
        const match = res.results.find((s) => s.username === sellerSlug);
        if (!match) throw new Error('Seller not found');
        setResolvedId(match.id);
      })
      .catch((err: Error) => {
        setError(err.message || 'Seller not found');
        setLoading(false);
      });
  }, [sellerSlug]);

  const fetchPage = useCallback(
    async (page: number, isInitial = false) => {
      if (!resolvedId) return;

      if (isInitial) {
        setLoading(true);
      } else {
        setProductsLoading(true);
      }

      try {
        const data = await getSellerProfileById(resolvedId, {
          products_page: page,
          products_page_size: PAGE_SIZE,
        });
        setSeller(data);
        setProducts(data.marketplace_products);
        setPagination(data.products_pagination ?? null);
        setCurrentPage(page);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load seller profile');
      } finally {
        setLoading(false);
        setProductsLoading(false);
      }
    },
    [resolvedId]
  );

  useEffect(() => {
    if (resolvedId) fetchPage(1, true);
  }, [resolvedId]);

  const handlePageChange = (page: number) => {
    fetchPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = async (mp: SellerMarketplaceProduct) => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }
    try {
      await addToCart(mp as any, 1);
      setAddedIds((prev) => new Set(prev).add(mp.id));
      setTimeout(() => {
        setAddedIds((prev) => {
          const next = new Set(prev);
          next.delete(mp.id);
          return next;
        });
      }, 2000);
    } catch {
      // cart context handles errors
    }
  };

  const toProductCardData = (mp: SellerMarketplaceProduct): ProductCardData => {
    const details = mp.product_details as any;
    const displayPrice =
      mp.discounted_price && mp.discounted_price > 0 ? mp.discounted_price : mp.listed_price;
    const percentOff =
      (mp as any).percent_off ??
      (mp.listed_price > 0 && mp.discounted_price != null && mp.discounted_price < mp.listed_price
        ? Math.round(((mp.listed_price - mp.discounted_price) / mp.listed_price) * 100)
        : 0);
    const hasDiscount =
      percentOff > 0 &&
      mp.discounted_price !== null &&
      mp.discounted_price !== undefined &&
      mp.discounted_price > 0 &&
      mp.discounted_price < mp.listed_price;

    return {
      id: mp.id,
      name: details?.name || 'Unnamed Product',
      image: details?.images?.[0]?.image,
      href: `/marketplace/${mp.id}`,
      price: displayPrice,
      originalPrice: hasDiscount ? mp.listed_price : null,
      percentOff,
      savings: hasDiscount ? mp.listed_price - mp.discounted_price : 0,
      stock: details?.stock ?? 0,
      isDeliveryFree: false,
      category: null,
      rating: (mp as any).average_rating ?? 0,
      reviewCount: (mp as any).total_reviews ?? mp.reviews?.length ?? 0,
      isB2B: false,
      isAvailable: mp.is_available,
    };
  };

  /* ─── Initial Loading ─── */
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <ProductSearchBar />
        <div className="max-w-7xl mx-auto px-4 py-10 space-y-6 animate-pulse">
          <div className="h-40 bg-neutral-200 rounded-xl" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 bg-neutral-200 rounded-xl" />
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  /* ─── Error ─── */
  if (error || !seller) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <ProductSearchBar />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <AlertCircle className="w-12 h-12 text-accent-error-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-neutral-800 mb-2">Seller Not Found</h2>
          <p className="text-neutral-600 mb-6">{error || 'This seller profile does not exist.'}</p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const displayName =
    seller.registered_business_name ||
    `${seller.first_name} ${seller.last_name}`.trim() ||
    seller.username;

  const locationLabel = [seller.city, seller.state, seller.country].filter(Boolean).join(', ');

  const totalPages = pagination?.total_pages ?? 1;
  const totalProducts = pagination?.total ?? seller.total_products;
  const startItem = pagination ? (currentPage - 1) * pagination.page_size + 1 : 1;
  const endItem = pagination ? Math.min(currentPage * pagination.page_size, pagination.total) : products.length;

  return (
    <div className="min-h-screen bg-neutral-50">
      <SEOHead
        title={`${displayName} — Seller on Mulya Bazzar`}
        description={`Shop from ${displayName} on Mulya Bazzar. ${totalProducts} products available${locationLabel ? ` · Based in ${locationLabel}` : ''}. Fast delivery across Nepal.`}
        image={seller.profile_image ?? undefined}
        url={`/marketplace/seller/${sellerSlug}`}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'Store',
          name: displayName,
          image: seller.profile_image ?? undefined,
          url: `https://appmulyabazzar.com/marketplace/seller/${sellerSlug}`,
          address: locationLabel
            ? { '@type': 'PostalAddress', addressLocality: seller.city ?? '', addressRegion: seller.state ?? '', addressCountry: seller.country ?? 'NP' }
            : undefined,
        }}
      />
      <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-neutral-200">
        <ProductSearchBar />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-primary-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* ─── Seller Hero Card ─── */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <div className="flex-shrink-0">
              {seller.profile_image ? (
                <img
                  src={seller.profile_image}
                  alt={displayName}
                  className="w-20 h-20 rounded-full object-cover border-2 border-primary-200"
                  onError={(e) => (e.currentTarget.src = AVATAR_PLACEHOLDER)}
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary-100 border-2 border-primary-200 flex items-center justify-center">
                  <User className="w-10 h-10 text-primary-400" />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-neutral-900 truncate">{displayName}</h1>
                {seller.b2b_verified && (
                  <span className="inline-flex items-center gap-1 bg-secondary-100 text-secondary-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                    <BadgeCheck className="w-3.5 h-3.5" />
                    B2B Verified
                  </span>
                )}
                {seller.business_type && (
                  <span className="inline-flex items-center gap-1 bg-accent-success-100 text-accent-success-700 text-xs font-medium px-2 py-0.5 rounded-full capitalize">
                    <Store className="w-3 h-3" />
                    {seller.business_type}
                  </span>
                )}
              </div>
              {seller.bio && (
                <p className="text-sm text-neutral-700 leading-relaxed">{seller.bio}</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-neutral-600 pt-1">
                {locationLabel && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-neutral-400" />
                    {locationLabel}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Package className="w-4 h-4 text-neutral-400" />
                  {seller.total_products.toLocaleString()} product{seller.total_products !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Products Grid ─── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-neutral-900">
              Products by {displayName}
            </h2>
            {pagination && totalProducts > 0 && (
              <span className="text-sm text-neutral-500">
                {startItem}–{endItem} of {totalProducts.toLocaleString()}
              </span>
            )}
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 animate-pulse">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <div key={i} className="h-64 bg-neutral-200 rounded-lg" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
              <Package className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-500">No products currently listed.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {products.map((mp) => (
                  <ProductCard
                    key={mp.id}
                    product={toProductCardData(mp)}
                    size="sm"
                    showAddToCart
                    added={addedIds.has(mp.id)}
                    onAddToCart={() => handleAddToCart(mp)}
                  />
                ))}
              </div>

              {/* ─── Pagination ─── */}
              {pagination && totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!pagination.has_previous}
                    className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (p) =>
                        p === 1 ||
                        p === totalPages ||
                        Math.abs(p - currentPage) <= 2
                    )
                    .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                      if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                        acc.push('ellipsis');
                      }
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((item, idx) =>
                      item === 'ellipsis' ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-neutral-400 text-sm">
                          …
                        </span>
                      ) : (
                        <button
                          key={item}
                          onClick={() => handlePageChange(item as number)}
                          className={`min-w-[36px] h-9 px-2 rounded-lg text-sm font-medium transition-colors ${
                            item === currentPage
                              ? 'bg-primary-600 text-white'
                              : 'border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                          }`}
                        >
                          {item}
                        </button>
                      )
                    )}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!pagination.has_next}
                    className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Footer />

      {isLoginModalOpen && (
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onSuccess={() => setIsLoginModalOpen(false)}
        />
      )}
    </div>
  );
};

export default SellerProfilePage;
