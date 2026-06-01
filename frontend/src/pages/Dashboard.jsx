import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Package, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  AlertTriangle, 
  ArrowRight,
  TrendingUp,
  Plus
} from 'lucide-react';
import api from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    totalCustomers: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  const [lowStockItems, setLowStockItems] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Call endpoints in parallel
        const [productsRes, customersRes, ordersRes] = await Promise.all([
          api.get('/products'),
          api.get('/customers'),
          api.get('/orders'),
        ]);

        const products = productsRes.data;
        const customers = customersRes.data;
        const orders = ordersRes.data;

        // Calculate statistics
        const totalProducts = products.length;
        const totalStock = products.reduce((acc, p) => acc + p.stock_quantity, 0);
        const totalCustomers = customers.length;
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((acc, o) => acc + parseFloat(o.total_amount || 0), 0);

        setStats({
          totalProducts,
          totalStock,
          totalCustomers,
          totalOrders,
          totalRevenue,
        });

        // Filter low stock (stock <= 5)
        const lowStock = products.filter(p => p.stock_quantity <= 5);
        setLowStockItems(lowStock);

        // Get 5 most recent orders
        setRecentOrders(orders.slice(0, 5));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(val);
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Analyzing inventory and metrics...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Welcome banner */}
      <div className="dashboard-header-block glass-panel">
        <div className="header-text">
          <h1>Welcome to Veloce IMS</h1>
          <p>Monitor real-time inventory, customer orders, and supply chain status.</p>
        </div>
        <div className="header-action">
          <Link to="/orders?action=new" className="btn btn-primary">
            <Plus size={18} />
            <span>Place New Order</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="stats-grid">
        <div className="stat-card glass-panel border-blue">
          <div className="stat-icon-wrapper blue-glow">
            <Package size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Product Catalog</span>
            <h3 className="stat-value">{stats.totalProducts}</h3>
            <span className="stat-sub">{stats.totalStock} units in inventory</span>
          </div>
        </div>

        <div className="stat-card glass-panel border-emerald">
          <div className="stat-icon-wrapper emerald-glow">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Revenue</span>
            <h3 className="stat-value">{formatCurrency(stats.totalRevenue)}</h3>
            <span className="stat-sub">From {stats.totalOrders} processed orders</span>
          </div>
        </div>

        <div className="stat-card glass-panel border-purple">
          <div className="stat-icon-wrapper purple-glow">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Registered Customers</span>
            <h3 className="stat-value">{stats.totalCustomers}</h3>
            <span className="stat-sub">Active buyers in database</span>
          </div>
        </div>

        <div className="stat-card glass-panel border-amber">
          <div className="stat-icon-wrapper amber-glow">
            <ShoppingCart size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Orders</span>
            <h3 className="stat-value">{stats.totalOrders}</h3>
            <span className="stat-sub">Pending and completed orders</span>
          </div>
        </div>
      </div>

      {/* Main Dashboard Layout */}
      <div className="dashboard-main-grid">
        {/* Left Column: Recent Orders */}
        <div className="dashboard-card glass-panel list-card">
          <div className="card-header">
            <h3>Recent Orders</h3>
            <Link to="/orders" className="view-all-link">
              <span>View All</span>
              <ArrowRight size={16} />
            </Link>
          </div>
          
          {recentOrders.length === 0 ? (
            <div className="empty-state">
              <ShoppingCart size={40} className="empty-icon" />
              <p>No orders placed yet.</p>
              <Link to="/orders?action=new" className="empty-link">Create your first order</Link>
            </div>
          ) : (
            <div className="table-container">
              <table className="custom-table compact-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="clickable-row" onClick={() => navigate(`/orders/${order.id}`)}>
                      <td>
                        <div className="font-semibold">{order.customer?.full_name || 'Unknown'}</div>
                        <div className="text-muted text-xs">{order.customer?.email}</div>
                      </td>
                      <td>{new Date(order.created_at).toLocaleDateString()}</td>
                      <td>
                        {order.items?.reduce((acc, item) => acc + item.quantity, 0) || 0} units
                      </td>
                      <td className="font-bold text-success">
                        {formatCurrency(order.total_amount)}
                      </td>
                      <td>
                        <span className={`badge badge-success`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Alerts & Status */}
        <div className="dashboard-card glass-panel alerts-card">
          <div className="card-header">
            <h3>Inventory Stock Alerts</h3>
            {lowStockItems.length > 0 && (
              <span className="badge badge-danger">
                {lowStockItems.length} Warnings
              </span>
            )}
          </div>

          {lowStockItems.length === 0 ? (
            <div className="stock-healthy glass-panel">
              <div className="healthy-icon">✓</div>
              <div className="healthy-content">
                <h4>All Stocks Healthy</h4>
                <p>No products are currently low on stock.</p>
              </div>
            </div>
          ) : (
            <div className="alerts-list">
              {lowStockItems.map((item) => (
                <div key={item.id} className="alert-item glass-panel">
                  <div className="alert-icon-box">
                    <AlertTriangle size={18} />
                  </div>
                  <div className="alert-item-content">
                    <div className="alert-item-title">
                      <span>{item.name}</span>
                      <span className="alert-sku">{item.sku}</span>
                    </div>
                    <div className="alert-item-meta">
                      <span className="text-danger font-bold">
                        {item.stock_quantity === 0 ? 'Out of stock' : `${item.stock_quantity} left`}
                      </span>
                      <span>•</span>
                      <span>Price: {formatCurrency(item.price)}</span>
                    </div>
                  </div>
                  <button 
                    className="btn btn-secondary btn-xs-icon" 
                    onClick={() => navigate('/products', { state: { editProduct: item } })}
                    title="Restock"
                  >
                    Restock
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
