import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
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
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Profile from './pages/Profile';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
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
            <Route path="notifications" element={<Notifications />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
