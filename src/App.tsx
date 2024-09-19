import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

const App: React.FC = () => {
  const isAuthenticated = !!localStorage.getItem('token');
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/home"
          element={isAuthenticated ? <Home /> : <Navigate to="/login" />}
        />
        <Route path="/producers" element={<AddProducer />} />
        <Route path='/products' element={<Products />}></Route>
        <Route path='/customers' element={<CustomerList />}></Route>
        <Route path='/orders' element={<OrderList />}></Route>
        <Route path='/sales' element={<SaleList />}></Route>
        <Route path='/stocks' element={<Stocks />}></Route>
        {/* <Route path='/marketplace' element={<Marketplace />}></Route> */}
        <Route path='/stats' element={<StatsDashboard />}></Route>
        <Route path='/marketplace/:productId' element={<ProductInstanceView />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
