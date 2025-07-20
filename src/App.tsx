import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import CryptoJS from 'crypto-js';
import Login from './components/Login';
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
import PurchaseOrdersPage from './components/PurchaseOrdersPage';
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
import BlogPage from './components/BlogPage';
import BackButton from './components/BackButton';

const generateHash = () => {
  const timestamp = new Date().toISOString();
  return CryptoJS.MD5(timestamp).toString().substring(0, 64);
};
const RouteWithHash: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const currentHash = window.location.search;
    if (!currentHash) {
      const newHash = generateHash();
      navigate(`${location.pathname}?v=${newHash}`, { replace: true });
    }
  }, [location, navigate]);

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <div className="p-4">
        <ConditionalBackButton />
        <Routes>
          <Route path="/" element={<Marketplace />} />
        </Routes>
        <RouteWithHash>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/home" element={<Home />} />
            <Route path="/producers" element={<AddProducer />} />
            <Route path="/products" element={<Products />} />
            <Route path="/customers" element={<CustomerList />} />
            <Route path="/orders" element={<OrderList />} />
            <Route path="/sales" element={<SaleList />} />
            <Route path="/stocks" element={<Stocks />} />
            <Route path="/stats" element={<StatsDashboard />} />
            <Route path="/marketplace/:productId" element={<ProductPage />} />
            <Route path="/audit-logs" element={<AuditLogList />} />
            <Route path="/audit-logs/new" element={<AuditLogForm />} />
            <Route path="/audit-logs/:id" element={<AuditLogForm />} />
            <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
            <Route path="/marketplace" element={<Navigate to="/" replace />} />
            <Route path="/marketplace/all-products" element={<MarketplaceAllProducts />} />
            <Route path="/about" element={<BlogPage />} />
            <Route path="/contact" element={<BlogPage />} />
            <Route path="/privacy" element={<BlogPage />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/delivery-details" element={<DeliveryDetails />} />
            <Route path="/checkout" element={<CheckoutScreen />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/sellers" element={<SellerLanding />} />
            <Route path="/register" element={<Register />} />
            <Route path="/business-register" element={<BusinessRegister />} />
            <Route path="/marketplace/user-product" element={<MarketplaceUserProduct />} />
            <Route path="/direct-sales" element={<DirectSales />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="*" element={<Navigate to="/marketplace" replace />} />
          </Routes>
        </RouteWithHash>
      </div>
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
