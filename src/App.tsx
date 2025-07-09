import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Home from './components/Home';
import AddProducer from './components/AddProducer';
import Products from './components/Products';
import CustomerList from './components/CustomerList';
import OrderList from './components/Orderlist';
import SaleList from './components/SalesList';
import Stocks from './components/Stocks';
import ProductInstanceView from './components/ProductInstanceView';  
import StatsDashboard from './components/StatsDashboard';
import AuditLogList from './components/AuditLogList';
import AuditLogForm from './components/AuditLogForm';
import PurchaseOrdersPage from './components/PurchaseOrdersPage';
import Marketplace from './components/Marketplace';
import MarketplaceAllProducts from './components/MarketplaceAllProducts';
import BackButton from './components/BackButton';
import AboutUs from './components/AboutUs';
import Contact from './components/Contact';
import PrivacyPolicy from './components/PrivacyPolicy';
import ProductPage from './components/ProductPage';

const App: React.FC = () => {
  return (
    <Router>
      <div className="p-4">
        <ConditionalBackButton />
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
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
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/marketplace/all-products" element={<MarketplaceAllProducts />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
};

const ConditionalBackButton: React.FC = () => {
  const location = useLocation();
  const routesWithBackButton = [
    '/producers',
    '/products',
    '/customers',
    '/orders',
    '/sales',
    '/stocks',
    '/stats',
    '/purchase-orders',
    '/audit-logs'
  ];

  const shouldShowBackButton = routesWithBackButton.some(route => location.pathname.startsWith(route));

  return shouldShowBackButton ? <BackButton /> : null;
};

export default App;
