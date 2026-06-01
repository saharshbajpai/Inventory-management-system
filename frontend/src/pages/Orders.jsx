import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  Trash2, 
  FileText, 
  Calendar, 
  DollarSign,
  User,
  ChevronRight,
  ArrowLeft,
  AlertTriangle
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import './Orders.css';

const Orders = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const isCreatingOrder = searchParams.get('action') === 'new';

  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search filter for listing
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOrders, setFilteredOrders] = useState([]);

  // Create Order State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [orderItems, setOrderItems] = useState([
    { product_id: '', quantity: 1, available_stock: 0, price: 0, sku: '', name: '' }
  ]);
  const [submitting, setSubmitting] = useState(false);

  // Fetch initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersRes, customersRes, productsRes] = await Promise.all([
        api.get('/orders'),
        api.get('/customers'),
        api.get('/products')
      ]);
      setOrders(ordersRes.data);
      setFilteredOrders(ordersRes.data);
      setCustomers(customersRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      showToast('Failed to load orders data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter orders by customer name
  useEffect(() => {
    const filtered = orders.filter(o => 
      o.customer?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredOrders(filtered);
  }, [searchQuery, orders]);

  // Handle Action state change
  const handleStartCreate = () => {
    setSearchParams({ action: 'new' });
    setSelectedCustomerId('');
    setOrderItems([{ product_id: '', quantity: 1, available_stock: 0, price: 0, sku: '', name: '' }]);
  };

  const handleCancelCreate = () => {
    setSearchParams({});
  };

  // Add Item to creation list
  const handleAddItemRow = () => {
    setOrderItems(prev => [
      ...prev,
      { product_id: '', quantity: 1, available_stock: 0, price: 0, sku: '', name: '' }
    ]);
  };

  // Remove Item from creation list
  const handleRemoveItemRow = (index) => {
    if (orderItems.length === 1) return;
    setOrderItems(prev => prev.filter((_, i) => i !== index));
  };

  // Handle item dropdown selection
  const handleProductSelect = (index, productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setOrderItems(prev => {
      const items = [...prev];
      items[index] = {
        product_id: product.id,
        quantity: items[index].quantity,
        available_stock: product.stock_quantity,
        price: parseFloat(product.price),
        sku: product.sku,
        name: product.name
      };
      return items;
    });
  };

  // Handle item quantity change
  const handleQuantityChange = (index, qty) => {
    const val = parseInt(qty) || 0;
    setOrderItems(prev => {
      const items = [...prev];
      items[index].quantity = val;
      return items;
    });
  };

  // Calculate Order Total
  const calculateTotal = () => {
    return orderItems.reduce((acc, item) => {
      return acc + (item.price * (item.quantity || 0));
    }, 0);
  };

  // Submit Order Creation
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      showToast('Please select a customer.', 'warning');
      return;
    }

    // Filter empty lines
    const validItems = orderItems.filter(item => item.product_id !== '');
    if (validItems.length === 0) {
      showToast('Please add at least one product to the order.', 'warning');
      return;
    }

    // Check client-side stock before placing
    const outOfStockItems = validItems.filter(item => item.quantity > item.available_stock);
    if (outOfStockItems.length > 0) {
      showToast(`Insufficient stock for ${outOfStockItems[0].name}. Only ${outOfStockItems[0].available_stock} units left.`, 'error');
      return;
    }

    // Check zero/negative quantities
    const invalidQtyItems = validItems.filter(item => item.quantity <= 0);
    if (invalidQtyItems.length > 0) {
      showToast(`Quantity for ${invalidQtyItems[0].name} must be greater than zero.`, 'warning');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        customer_id: selectedCustomerId,
        items: validItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity
        }))
      };

      const res = await api.post('/orders', payload);
      showToast('Order placed successfully!', 'success');
      
      // Reset search params and reload
      setSearchParams({});
      fetchData();
      
      // Redirect to newly created order details page
      navigate(`/orders/${res.data.id}`);
    } catch (error) {
      // Catch our structured error details
      if (error.detail && typeof error.detail === 'object') {
        const detailMsg = error.detail.message || 'Validation error.';
        showToast(detailMsg, 'error');
      } else {
        const errorMsg = error.detail || 'Failed to create order.';
        showToast(errorMsg, 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

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
        <p>Loading orders directory...</p>
      </div>
    );
  }

  // --- RENDERING ORDER PLACEMENT VIEW ---
  if (isCreatingOrder) {
    return (
      <div className="page-container">
        <div className="page-header">
          <button className="btn btn-secondary btn-xs-icon btn-back" onClick={handleCancelCreate}>
            <ArrowLeft size={16} />
            <span>Back to Orders</span>
          </button>
          <div className="header-info" style={{ marginTop: '1rem' }}>
            <h1>Place New Order</h1>
            <p>Assemble products, select a customer, and validate stock instantly.</p>
          </div>
        </div>

        <div className="order-create-grid">
          {/* Main order assembly form */}
          <div className="order-form-panel glass-panel">
            <form onSubmit={handlePlaceOrder}>
              {/* Customer selection */}
              <div className="form-group customer-select-group">
                <label className="form-label" htmlFor="customer_id">Select Customer *</label>
                <select
                  id="customer_id"
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="form-input"
                  required
                >
                  <option value="">-- Choose a Registered Customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Items Table */}
              <div className="order-items-builder">
                <h3 className="section-title">Order Line Items</h3>
                <div className="items-list-container">
                  {orderItems.map((item, index) => {
                    const isOverStock = item.product_id && item.quantity > item.available_stock;
                    
                    return (
                      <div key={index} className="order-item-row glass-panel">
                        {/* Select Product */}
                        <div className="field-product">
                          <label className="form-label text-xs">Product *</label>
                          <select
                            value={item.product_id}
                            onChange={(e) => handleProductSelect(index, e.target.value)}
                            className="form-input"
                            required
                          >
                            <option value="">-- Select Product --</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name} (SKU: {p.sku}) — {formatCurrency(p.price)}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quantity */}
                        <div className="field-quantity">
                          <label className="form-label text-xs">Quantity *</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(index, e.target.value)}
                            className={`form-input ${isOverStock ? 'input-error' : ''}`}
                            disabled={!item.product_id}
                            required
                          />
                        </div>

                        {/* Summary Metrics */}
                        <div className="field-metrics">
                          <span className="text-muted text-xs">Unit Price</span>
                          <span className="font-semibold">{formatCurrency(item.price)}</span>
                        </div>

                        <div className="field-metrics">
                          <span className="text-muted text-xs">Line Subtotal</span>
                          <span className="font-bold text-success">
                            {formatCurrency(item.price * (item.quantity || 0))}
                          </span>
                        </div>

                        {/* Remove Row Button */}
                        <div className="field-actions">
                          <button
                            type="button"
                            className="btn btn-danger btn-xs-icon btn-remove"
                            onClick={() => handleRemoveItemRow(index)}
                            disabled={orderItems.length === 1}
                            title="Remove Row"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* Live Stock Warning Overlay */}
                        {item.product_id && (
                          <div className="stock-info-row">
                            {isOverStock ? (
                              <span className="stock-warning">
                                <AlertTriangle size={12} />
                                Insufficient stock! Only {item.available_stock} available (requested: {item.quantity}).
                              </span>
                            ) : (
                              <span className="stock-healthy-indicator">
                                Available stock: {item.available_stock} units.
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  className="btn btn-secondary btn-add-row"
                  onClick={handleAddItemRow}
                >
                  <Plus size={16} />
                  <span>Add Line Item</span>
                </button>
              </div>
            </form>
          </div>

          {/* Checkout summary sidebar */}
          <div className="order-summary-panel glass-panel">
            <h3 className="sidebar-title">Order Summary</h3>
            <div className="summary-details">
              <div className="summary-row">
                <span>Unique Line Items:</span>
                <span>{orderItems.filter(i => i.product_id !== '').length}</span>
              </div>
              <div className="summary-row">
                <span>Total Units Count:</span>
                <span>{orderItems.reduce((acc, i) => acc + (i.product_id ? (i.quantity || 0) : 0), 0)}</span>
              </div>
              <div className="summary-total">
                <span>Grand Total:</span>
                <span className="text-success font-bold">{formatCurrency(calculateTotal())}</span>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-success btn-checkout-submit"
              onClick={handlePlaceOrder}
              disabled={submitting}
            >
              <ShoppingCart size={18} />
              <span>{submitting ? 'Processing Order...' : 'Submit & Place Order'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDERING ORDER LISTING VIEW ---
  return (
    <div className="page-container">
      {/* Header section */}
      <div className="page-header">
        <div className="header-info">
          <h1>Order Management</h1>
          <p>Review customer checkout logs, order summaries, and track transactions.</p>
        </div>
        <button className="btn btn-primary" onClick={handleStartCreate}>
          <Plus size={18} />
          <span>New Order</span>
        </button>
      </div>

      {/* Search and filters */}
      <div className="filter-bar glass-panel">
        <div className="search-box">
          <Search className="search-icon" size={18} />
          <input 
            type="text" 
            placeholder="Search by customer name or order ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input search-input"
          />
        </div>
      </div>

      {/* Orders log table */}
      <div className="table-wrapper glass-panel">
        {filteredOrders.length === 0 ? (
          <div className="empty-state">
            <ShoppingCart size={48} className="empty-icon" />
            <h3>No Orders Found</h3>
            <p>No orders matched your search queries.</p>
            {searchQuery ? (
              <button className="btn btn-secondary btn-xs-icon" onClick={() => setSearchQuery('')}>
                Clear Search
              </button>
            ) : (
              <button className="btn btn-primary btn-xs-icon" onClick={handleStartCreate}>
                Place First Order
              </button>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer Account</th>
                  <th>Order Date</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="clickable-row" onClick={() => navigate(`/orders/${order.id}`)}>
                    <td>
                      <div className="flex-center font-bold" style={{ gap: '0.4rem' }}>
                        <FileText size={14} className="text-muted" />
                        <span className="order-id-trunc" title={order.id}>{order.id.slice(0, 8)}...</span>
                      </div>
                    </td>
                    <td>
                      <div className="font-semibold">{order.customer?.full_name || 'Deleted Customer'}</div>
                      <div className="text-muted text-xs">{order.customer?.email}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Calendar size={14} className="text-muted" />
                        <span>{new Date(order.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td>
                      <span className="font-bold text-success">{formatCurrency(order.total_amount)}</span>
                    </td>
                    <td>
                      <span className="badge badge-success">{order.status}</span>
                    </td>
                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <button 
                        className="btn btn-secondary btn-xs-icon"
                        onClick={() => navigate(`/orders/${order.id}`)}
                        title="View Details"
                      >
                        <span>Details</span>
                        <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
