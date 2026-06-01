import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin 
} from 'lucide-react';
import api from '../services/api';
import Modal from '../components/UI/Modal';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const Customers = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const { showToast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Fetch customers list
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customers');
      setCustomers(res.data);
      setFilteredCustomers(res.data);
    } catch (error) {
      showToast('Failed to load customers.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Handle Search
  useEffect(() => {
    const filtered = customers.filter(c => 
      c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredCustomers(filtered);
  }, [searchQuery, customers]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear validation error when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.full_name.trim()) errors.full_name = 'Full name is required';
    
    // Simple email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenCreateModal = () => {
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      address: ''
    });
    setFormErrors({});
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (customer) => {
    setFormData({
      full_name: customer.full_name,
      email: customer.email,
      phone: customer.phone || '',
      address: customer.address || ''
    });
    setSelectedCustomerId(customer.id);
    setFormErrors({});
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const payload = {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone.trim(),
        address: formData.address || null
      };

      if (isEditMode) {
        await api.put(`/customers/${selectedCustomerId}`, payload);
        showToast('Customer registry updated successfully.', 'success');
      } else {
        await api.post('/customers', payload);
        showToast('Customer registered successfully.', 'success');
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (error) {
      const detail = error.detail || 'An error occurred during submission.';
      showToast(detail, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCustomer = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete customer "${name}"?\nWARNING: This will delete all orders associated with this customer.`)) {
      try {
        await api.delete(`/customers/${id}`);
        showToast('Customer deleted successfully.', 'success');
        fetchCustomers();
      } catch (error) {
        const detail = error.detail || 'Failed to delete customer.';
        showToast(detail, 'error');
      }
    }
  };

  return (
    <div className="page-container">
      {/* Header section */}
      <div className="page-header">
        <div className="header-info">
          <h1>Customer Directory</h1>
          <p>Register new accounts, update contact information, and review details.</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={handleOpenCreateModal}>
            <Plus size={18} />
            <span>Add Customer</span>
          </button>
        )}
      </div>

      {/* Filter and search block */}
      <div className="filter-bar glass-panel">
        <div className="search-box">
          <Search className="search-icon" size={18} />
          <input 
            type="text" 
            placeholder="Search by name or email address..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input search-input"
          />
        </div>
      </div>

      {/* Main customers table */}
      <div className="table-wrapper glass-panel">
        {loading ? (
          <div className="dashboard-loading">
            <div className="spinner"></div>
            <p>Loading customer accounts...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="empty-state">
            <Users size={48} className="empty-icon" />
            <h3>No Customers Found</h3>
            <p>We couldn't find any customers matching your criteria.</p>
            {searchQuery && (
              <button className="btn btn-secondary btn-xs-icon" onClick={() => setSearchQuery('')}>
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table responsive-table">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Email Address</th>
                  <th>Phone Number</th>
                  <th>Shipping Address</th>
                  {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td data-label="Customer Name">
                        <div className="font-semibold">{customer.full_name}</div>
                      </td>
                      <td data-label="Email Address">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Mail size={14} className="text-muted" />
                          <span>{customer.email}</span>
                        </div>
                      </td>
                      <td data-label="Phone Number">
                        {customer.phone ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Phone size={14} className="text-muted" />
                            <span>{customer.phone}</span>
                          </div>
                        ) : (
                          <span className="text-muted text-xs">—</span>
                        )}
                      </td>
                      <td data-label="Shipping Address">
                        {customer.address ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', maxWidth: '300px' }}>
                            <MapPin size={14} className="text-muted" style={{ flexShrink: 0 }} />
                            <span className="text-truncate">{customer.address}</span>
                          </div>
                        ) : (
                          <span className="text-muted text-xs">—</span>
                        )}
                      </td>
                      {isAdmin && (
                        <td data-label="Actions" style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                            <button 
                              className="btn btn-secondary btn-xs-icon"
                              onClick={() => handleOpenEditModal(customer)}
                              title="Edit Customer"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              className="btn btn-danger btn-xs-icon"
                              onClick={() => handleDeleteCustomer(customer.id, customer.full_name)}
                              title="Delete Customer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? 'Edit Customer Registry' : 'Register New Customer'}
        footer={
          <>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Registering...' : 'Save Customer'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label" htmlFor="full_name">Full Name *</label>
            <input 
              type="text" 
              id="full_name"
              name="full_name" 
              value={formData.full_name}
              onChange={handleInputChange}
              className={`form-input ${formErrors.full_name ? 'input-error' : ''}`}
              placeholder="e.g. John Doe"
            />
            {formErrors.full_name && <span className="error-message">{formErrors.full_name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address *</label>
            <input 
              type="email" 
              id="email"
              name="email" 
              value={formData.email}
              onChange={handleInputChange}
              className={`form-input ${formErrors.email ? 'input-error' : ''}`}
              placeholder="e.g. john@example.com"
            />
            {formErrors.email && <span className="error-message">{formErrors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="phone">Phone Number *</label>
            <input 
              type="text" 
              id="phone"
              name="phone" 
              value={formData.phone}
              onChange={handleInputChange}
              className={`form-input ${formErrors.phone ? 'input-error' : ''}`}
              placeholder="e.g. +1 (555) 019-2834"
            />
            {formErrors.phone && <span className="error-message">{formErrors.phone}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="address">Shipping Address</label>
            <textarea 
              id="address"
              name="address" 
              value={formData.address}
              onChange={handleInputChange}
              className="form-input"
              style={{ minHeight: '100px', resize: 'vertical' }}
              placeholder="Full mailing address for order shipping..."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Customers;
