import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Logout from './components/auth/Logout';
import { Toaster } from './components/ui/toaster';
import FeaturedSelectionPage from './components/FeaturedSelectionPage';
import Deals from './components/Deals';
import FlashSale from './components/FlashSale';
import CategoryProducts from './components/CategoryProducts';
import BrandProducts from './components/BrandProducts';

import Home from './components/Home';
import AddProducer from './components/AddProducer';
import Products from './components/Products';
import CustomerList from './components/CustomerList';
import OrderList from './components/Orderlist';
import SaleList from './components/SalesList';
import Stocks from './components/Stocks';
import StatsDashboard from './components/StatsDashboard';
import AuditLogList from './components/AuditLogList';
import AuditLogForm from './components/AuditLogForm';
import PurchaseOrderCards from './components/PurchaseOrderCards';
import Marketplace from './components/Marketplace';
import MarketplaceAllProducts from './components/MarketplaceAllProducts';
import ProductPage from './components/ProductPage';
import Cart from './components/Cart';
import DeliveryDetails from './components/DeliveryDetails';
import CheckoutScreen from './components/CheckoutScreen';
import Payment from './components/Payment';
import SellerLanding from './components/SellerLanding';
import Register from './components/Register';
import BusinessRegister from './components/BusinessRegister';
import MarketplaceUserProduct from './components/MarketplaceUserProduct';
import DirectSales from './components/DirectSales';
import FAQ from './components/FAQ';
import ShippingAndDelivery from './components/ShippingAndDelivery';
import ReturnsAndRefunds from './components/ReturnsAndRefunds';
import TermsofService from './components/TermsofService';
import Privacy from './components/Privacy';
import Contact from './components/Contact';
import BlogPage from './components/BlogPage';
import BlogDetail from './components/BlogDetail';
import CreatorsList from './components/CreatorsList';
import CreatorProfilePage from './components/CreatorProfilePage';
import ForYouPage from './components/ForYouPage';
import MyFollowing from './components/MyFollowing';
import BuyerRegister from './components/BuyerRegister';
import BackButton from './components/BackButton';
import PaymentSuccess from './components/PaymentSuccess';
import AccountDialog from './components/AccountDialog';
import Login from './components/Login';
import TransporterRegistration from './components/TransporterRegistration';
import TransporterProfile from './components/TransporterProfile';
import TransporterDeliveries from './components/TransporterDeliveries';
import AvailableDeliveries from './components/AvailableDeliveries';
import NearbyDeliveries from './components/NearbyDeliveries';
import DeliveryHistory from './components/DeliveryHistory';
import TransporterEarnings from './components/TransporterEarnings';
import AboutUs from './components/AboutUs';
import TransporterDocuments from './components/TransporterDocuments';
import SupportComponent from './components/SupportComponent';
import TransporterLanding from './components/TransporterLanding';
import MyOrders from './components/MyOrders';
import UserProfile from './components/UserProfile';
import UserAdminProfile from './components/UserAdminProfile';
import FindBusinessPage from './components/FindBusinessPage';
import DistributorProfile from './components/DistributorProfile';
import DistributorOrders from './components/DistributorOrders';
import DistributorNegotiations from './components/DistributorNegotiations';

const protectedRoutes = [
  { path: '/home', element: <Home /> },
  { path: '/producers', element: <AddProducer /> },
  { path: '/products', element: <Products /> },
  { path: '/customers', element: <CustomerList /> },
  { path: '/orders', element: <OrderList /> },
  { path: '/sales', element: <SaleList /> },
  { path: '/stocks', element: <Stocks /> },
  { path: '/stats', element: <StatsDashboard /> },
  { path: '/audit-logs', element: <AuditLogList /> },
  { path: '/audit-logs/new', element: <AuditLogForm /> },
  { path: '/audit-logs/:id', element: <AuditLogForm /> },
  { path: '/purchase-orders', element: <PurchaseOrderCards /> },
  { path: '/cart', element: <Cart /> },
  { path: '/my-orders', element: <MyOrders /> },
  { path: '/creators/me_following', element: <MyFollowing /> },
  { path: '/delivery-details', element: <DeliveryDetails /> },
  { path: '/checkout', element: <CheckoutScreen /> },
  { path: '/payment', element: <Payment /> },
  { path: '/marketplace/user-product', element: <MarketplaceUserProduct /> },
  { path: '/direct-sales', element: <DirectSales /> },
  { path: '/profile', element: <TransporterProfile /> },
  { path: '/deliveries/my', element: <TransporterDeliveries /> },
  { path: '/deliveries/available', element: <AvailableDeliveries /> },
  { path: '/deliveries/nearby', element: <NearbyDeliveries /> },
  { path: '/deliveries/history', element: <DeliveryHistory /> },
  { path: '/earnings', element: <TransporterEarnings /> },
  { path: '/documents', element: <TransporterDocuments /> },
  { path: '/support', element: <SupportComponent /> },
  { path: '/my-orders', element: <MyOrders /> },
  { path: '/find-business', element: <FindBusinessPage /> },
  { path: '/find-business/:userId', element: <FindBusinessPage /> },
  { path: '/marketplace-dashboard', element: <DistributorProfile /> },
  { path: '/marketplace-dashboard/orders', element: <DistributorOrders /> },
  { path: '/marketplace-dashboard/negotiations', element: <DistributorNegotiations /> },
];

const publicRoutes = [
  { path: '/', element: <Marketplace /> },
  { path: '/marketplace', element: <Navigate to="/" replace /> },
  { path: '/flash-sale', element: <FlashSale /> },
  { path: '/deals', element: <Deals /> },
  { path: '/marketplace/categories/:categorySlug', element: <CategoryProducts /> },
  { path: '/marketplace/categories/:categorySlug/:subcategorySlug', element: <CategoryProducts /> },
  { path: '/marketplace/all-products', element: <MarketplaceAllProducts /> },
  { path: '/brand-products/:brandId', element: <BrandProducts /> },
  { path: '/marketplace/:productId', element: <ProductPage /> },
  { path: '/about', element: <AboutUs /> },
  { path: '/contact', element: <Contact /> },
  { path: '/sell', element: <SellerLanding /> },
  { path: '/featured', element: <FeaturedSelectionPage /> },
  { path: '/support', element: <SupportComponent /> },
  { path: '/sellers', element: <SellerLanding /> },
  { path: '/creators', element: <CreatorsList /> },
  { path: '/creators/:id', element: <CreatorProfilePage /> },
  { path: '/creators/:id/videos', element: <CreatorProfilePage /> },
  { path: '/just-for-you', element: <ForYouPage /> },
  { path: '/account', element: <AccountDialog /> },
  { path: '/register', element: <Register /> },
  { path: '/business-register', element: <BusinessRegister /> },
  { path: '/transporter-register', element: <TransporterRegistration /> },
  { path: '/transporters', element: <TransporterLanding /> },
  { path: '/blog', element: <BlogPage /> },
  { path: '/blog/:id', element: <BlogDetail /> },
  { path: '/buyer/register', element: <BuyerRegister /> },
  { path: '/shipping', element: <ShippingAndDelivery /> },
  { path: '/login', element: <Login /> },
  { path: '/logout', element: <Logout /> },
  { path: '/faq', element: <FAQ /> },
  { path: '/returns', element: <ReturnsAndRefunds /> },
  { path: '/terms', element: <TermsofService /> },
  { path: '/privacy', element: <Privacy /> },
  { path: '/payment/success', element: <PaymentSuccess /> },
  { path: '/my-orders', element: <MyOrders /> },
  { path: '/user-profile', element: <UserProfile /> },
  { path: '/user-admin-profile', element: <UserAdminProfile /> },
];

const GoogleAnalyticsTracker: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const trackingId = import.meta.env.VITE_GA_TRACKING_ID;
    if (trackingId && typeof window.gtag === 'function') {
      window.gtag('config', trackingId, {
        page_path: location.pathname + location.search,
      });
    }
  }, [location]);

  return null;
};

const App: React.FC = () => {
  return (
    <Router>
      <GoogleAnalyticsTracker />
      <AuthProvider>
        <ToastProvider>
          <CartProvider>
            <div className="p-4">
              <Toaster />
              <ConditionalBackButton />
              <Routes>
                {publicRoutes.map((route, index) => (
                  <Route key={`public-${index}`} path={route.path} element={route.element} />
                ))}
                <Route element={<ProtectedRoute />}>
                  {protectedRoutes.map((route, index) => (
                    <Route key={`protected-${index}`} path={route.path} element={route.element} />
                  ))}
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </CartProvider>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
};

const ConditionalBackButton: React.FC = () => {
  const location = useLocation();
  
  const backPaths = [
    '/producers',
    '/products',
    '/customers',
    '/orders',
    '/sales',
    '/stocks',
    '/stats',
    '/purchase-orders',
    '/audit-logs',
    '/cart',
    // '/delivery-details',
    // '/checkout',
    // '/payment',
  ];

  const shouldShowBackButton = backPaths.some(p => 
    location.pathname.startsWith(p)
  );
  
  return shouldShowBackButton ? <BackButton /> : null;
};

export default App;
