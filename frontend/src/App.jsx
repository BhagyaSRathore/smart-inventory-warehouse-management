import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Inventory from './pages/Inventory';
import Warehouses from './pages/Warehouses';
import WarehouseDetails from './pages/WarehouseDetails';
import Suppliers from './pages/Suppliers';
import Orders from './pages/Orders';
import StockMovements from './pages/StockMovements';
import AIAssistant from './pages/AIAssistant';
import Predictions from './pages/Predictions';
import Restock from './pages/Restock';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:id" element={<ProductDetails />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="warehouses" element={<Warehouses />} />
          <Route path="warehouses/:id" element={<WarehouseDetails />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="orders" element={<Orders />} />
          <Route path="stock-movements" element={<StockMovements />} />
          <Route path="ai-assistant" element={<AIAssistant />} />
          <Route path="predictions" element={<Predictions />} />
          <Route path="restock" element={<Restock />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
