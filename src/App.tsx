import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Logout from './components/auth/Logout';

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
import BackButton from './components/BackButton';
import AccountDialog from './components/AccountDialog';
import Login from './components/Login';
import TransporterRegistration from './components/TransporterRegistration';
import TransporterProfile from './components/TransporterProfile';

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
  { path: '/delivery-details', element: <DeliveryDetails /> },
  { path: '/checkout', element: <CheckoutScreen /> },
  { path: '/payment', element: <Payment /> },
  { path: '/marketplace/user-product', element: <MarketplaceUserProduct /> },
  { path: '/direct-sales', element: <DirectSales /> },
  { path: '/profile', element: <TransporterProfile /> },
];

const publicRoutes = [
  { path: '/', element: <Marketplace /> },
  { path: '/marketplace', element: <Navigate to="/" replace /> },
  { path: '/marketplace/all-products', element: <MarketplaceAllProducts /> },
  { path: '/marketplace/:productId', element: <ProductPage /> },
  { path: '/about', element: <BlogPage /> },
  { path: '/contact', element: <Contact /> },
  { path: '/sellers', element: <SellerLanding /> },
  { path: '/account', element: <AccountDialog /> },
  { path: '/register', element: <Register /> },
  { path: '/business-register', element: <BusinessRegister /> },
  { path: '/transporter-register', element: <TransporterRegistration /> },
  { path: '/blog', element: <BlogPage /> },
  { path: '/shipping', element: <ShippingAndDelivery /> },
  { path: '/login', element: <Login /> },
  { path: '/logout', element: <Logout /> },
  { path: '/faq', element: <FAQ /> },
  { path: '/returns', element: <ReturnsAndRefunds /> },
  { path: '/terms', element: <TermsofService /> },
  { path: '/privacy', element: <Privacy /> },
];

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="p-4">
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
    '/delivery-details',
    '/checkout',
    '/payment',
  ];

  const shouldShowBackButton = backPaths.some(p => 
    location.pathname.startsWith(p)
  );
  
  return shouldShowBackButton ? <BackButton /> : null;
};

export default App;
