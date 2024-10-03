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
// import Marketplace from './components/Marketplace';
import BackButton from './components/BackButton';

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
          <Route path="/marketplace/:productId" element={<ProductInstanceView />} />
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
    '/marketplace'
  ];

  const shouldShowBackButton = routesWithBackButton.some(route => location.pathname.startsWith(route));

  return shouldShowBackButton ? <BackButton /> : null;
};

export default App;
