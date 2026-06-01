import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  FileText, 
  Package, 
  ShieldCheck 
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import './OrderDetails.css';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/orders/${id}`);
        setOrder(res.data);
      } catch (error) {
        showToast('Failed to load order details.', 'error');
        navigate('/orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id, navigate, showToast]);

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
        <p>Retrieving order receipt details...</p>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="page-container">
      {/* Back button */}
      <div className="page-header">
        <button className="btn btn-secondary btn-xs-icon btn-back" onClick={() => navigate('/orders')}>
          <ArrowLeft size={16} />
          <span>Back to Orders Log</span>
        </button>
      </div>

      {/* Main Details block */}
      <div className="order-details-wrapper">
        
        {/* Row 1: Order Header */}
        <div className="order-details-header glass-panel">
          <div className="header-meta">
            <span className="badge badge-success">
              <ShieldCheck size={12} style={{ marginRight: '0.25rem' }} />
              {order.status}
            </span>
            <span className="date-display">
              <Calendar size={14} />
              {new Date(order.created_at).toLocaleString()}
            </span>
          </div>
          <h1 className="order-title">
            Order Receipt <span className="title-id">#{order.id}</span>
          </h1>
        </div>

        {/* Row 2: Customer and Summary Info */}
        <div className="details-grid-columns">
          
          {/* Customer Profile Box */}
          <div className="glass-panel profile-card">
            <h3 className="details-card-title">
              <User size={18} />
              <span>Customer Information</span>
            </h3>
            
            {order.customer ? (
              <div className="profile-info-list">
                <div className="profile-item">
                  <span className="profile-label">Full Name</span>
                  <span className="profile-value font-bold">{order.customer.full_name}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Email Address</span>
                  <span className="profile-value">
                    <Mail size={14} className="text-muted" />
                    {order.customer.email}
                  </span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Phone Number</span>
                  <span className="profile-value">
                    {order.customer.phone ? (
                      <>
                        <Phone size={14} className="text-muted" />
                        {order.customer.phone}
                      </>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Shipping Address</span>
                  <span className="profile-value">
                    {order.customer.address ? (
                      <>
                        <MapPin size={14} className="text-muted" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                        <span>{order.customer.address}</span>
                      </>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-danger">Customer profile has been deleted.</p>
            )}
          </div>

          {/* Items List Box */}
          <div className="glass-panel items-card">
            <h3 className="details-card-title">
              <Package size={18} />
              <span>Purchased Items</span>
            </h3>

            <div className="table-container">
              <table className="custom-table compact-table">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>SKU</th>
                    <th style={{ textAlign: 'right' }}>Price</th>
                    <th style={{ textAlign: 'center' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <span className="font-semibold">{item.product?.name || 'Deleted Product'}</span>
                      </td>
                      <td>
                        <code className="sku-code">{item.product?.sku || 'UNKNOWN'}</code>
                      </td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(item.unit_price)}</td>
                      <td style={{ textAlign: 'center' }} className="font-bold">{item.quantity}</td>
                      <td style={{ textAlign: 'right' }} className="font-bold text-success">
                        {formatCurrency(item.line_total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Receipt Summary Calculation */}
            <div className="receipt-total-block">
              <div className="receipt-total-row">
                <span>Subtotal:</span>
                <span>{formatCurrency(order.total_amount)}</span>
              </div>
              <div className="receipt-total-row">
                <span>Shipping & Tax:</span>
                <span>$0.00</span>
              </div>
              <div className="receipt-total-row grand-total-row">
                <span>Order Total:</span>
                <span className="text-success font-bold">{formatCurrency(order.total_amount)}</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default OrderDetails;
