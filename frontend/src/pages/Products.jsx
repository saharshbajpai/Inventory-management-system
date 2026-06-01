import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Package, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  AlertTriangle 
} from 'lucide-react';
import api from '../services/api';
import Modal from '../components/UI/Modal';
import { useToast } from '../context/ToastContext';

const Products = () => {
  const location = useLocation();
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    price: '',
    stock_quantity: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Fetch products function
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products');
      setProducts(res.data);
      setFilteredProducts(res.data);
    } catch (error) {
      showToast('Failed to load products.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle passed edit states from Dashboard navigation
  useEffect(() => {
    if (location.state && location.state.editProduct) {
      handleOpenEditModal(location.state.editProduct);
      // Clear location state so modal doesn't re-open on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Handle Search
  useEffect(() => {
    const filtered = products.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchQuery, products]);

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
    if (!formData.name.trim()) errors.name = 'Product name is required';
    if (!formData.sku.trim()) errors.sku = 'SKU is required';
    if (formData.price === '' || isNaN(formData.price) || parseFloat(formData.price) < 0) {
      errors.price = 'Price must be a number greater than or equal to 0';
    }
    if (formData.stock_quantity === '' || isNaN(formData.stock_quantity) || parseInt(formData.stock_quantity) < 0) {
      errors.stock_quantity = 'Stock quantity must be an integer greater than or equal to 0';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenCreateModal = () => {
    setFormData({
      name: '',
      sku: '',
      description: '',
      price: '',
      stock_quantity: ''
    });
    setFormErrors({});
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setFormData({
      name: product.name,
      sku: product.sku,
      description: product.description || '',
      price: product.price.toString(),
      stock_quantity: product.stock_quantity.toString()
    });
    setSelectedProductId(product.id);
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
        name: formData.name,
        sku: formData.sku,
        description: formData.description || null,
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock_quantity)
      };

      if (isEditMode) {
        await api.put(`/products/${selectedProductId}`, payload);
        showToast('Product updated successfully.', 'success');
      } else {
        await api.post('/products', payload);
        showToast('Product created successfully.', 'success');
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (error) {
      const detail = error.detail || 'An error occurred.';
      showToast(detail, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await api.delete(`/products/${id}`);
        showToast('Product deleted successfully.', 'success');
        fetchProducts();
      } catch (error) {
        const detail = error.detail || 'Failed to delete product.';
        showToast(detail, 'error');
      }
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(val);
  };

  return (
    <div className="page-container">
      {/* Header section */}
      <div className="page-header">
        <div className="header-info">
          <h1>Product Catalog</h1>
          <p>Create, update, and manage your inventory stock items.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreateModal}>
          <Plus size={18} />
          <span>Add Product</span>
        </button>
      </div>

      {/* Filter and search block */}
      <div className="filter-bar glass-panel">
        <div className="search-box">
          <Search className="search-icon" size={18} />
          <input 
            type="text" 
            placeholder="Search by product name or SKU..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input search-input"
          />
        </div>
      </div>

      {/* Main product inventory table */}
      <div className="table-wrapper glass-panel">
        {loading ? (
          <div className="dashboard-loading">
            <div className="spinner"></div>
            <p>Loading products catalog...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state">
            <Package size={48} className="empty-icon" />
            <h3>No Products Found</h3>
            <p>We couldn't find any products matching your criteria.</p>
            {searchQuery && (
              <button className="btn btn-secondary btn-xs-icon" onClick={() => setSearchQuery('')}>
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Product Details</th>
                  <th>SKU</th>
                  <th>Unit Price</th>
                  <th>Stock Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const isOutOfStock = product.stock_quantity === 0;
                  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5;

                  return (
                    <tr key={product.id}>
                      <td>
                        <div className="font-semibold">{product.name}</div>
                        {product.description && (
                          <div className="text-muted text-xs text-truncate" style={{ maxWidth: '280px' }}>
                            {product.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <code className="sku-code">{product.sku}</code>
                      </td>
                      <td className="font-semibold">{formatCurrency(product.price)}</td>
                      <td>
                        {isOutOfStock ? (
                          <span className="badge badge-danger">Out of Stock</span>
                        ) : isLowStock ? (
                          <span className="badge badge-warning">Low Stock ({product.stock_quantity})</span>
                        ) : (
                          <span className="badge badge-success">Healthy ({product.stock_quantity})</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button 
                            className="btn btn-secondary btn-xs-icon"
                            onClick={() => handleOpenEditModal(product)}
                            title="Edit Product"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            className="btn btn-danger btn-xs-icon"
                            onClick={() => handleDeleteProduct(product.id, product.name)}
                            title="Delete Product"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? 'Edit Product' : 'Add New Product'}
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
              {submitting ? 'Saving...' : 'Save Product'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label" htmlFor="name">Product Name *</label>
            <input 
              type="text" 
              id="name"
              name="name" 
              value={formData.name}
              onChange={handleInputChange}
              className={`form-input ${formErrors.name ? 'input-error' : ''}`}
              placeholder="e.g. Wireless Mouse"
            />
            {formErrors.name && <span className="error-message">{formErrors.name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="sku">SKU Code *</label>
            <input 
              type="text" 
              id="sku"
              name="sku" 
              value={formData.sku}
              onChange={handleInputChange}
              className={`form-input ${formErrors.sku ? 'input-error' : ''}`}
              placeholder="e.g. WM-1001"
              disabled={isEditMode} // Usually SKU is fixed once created
            />
            {formErrors.sku && <span className="error-message">{formErrors.sku}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="price">Unit Price ($) *</label>
            <input 
              type="number" 
              id="price"
              name="price" 
              step="0.01"
              value={formData.price}
              onChange={handleInputChange}
              className={`form-input ${formErrors.price ? 'input-error' : ''}`}
              placeholder="e.g. 29.99"
            />
            {formErrors.price && <span className="error-message">{formErrors.price}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="stock_quantity">Initial Stock Quantity *</label>
            <input 
              type="number" 
              id="stock_quantity"
              name="stock_quantity" 
              value={formData.stock_quantity}
              onChange={handleInputChange}
              className={`form-input ${formErrors.stock_quantity ? 'input-error' : ''}`}
              placeholder="e.g. 100"
            />
            {formErrors.stock_quantity && <span className="error-message">{formErrors.stock_quantity}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="description">Product Description</label>
            <textarea 
              id="description"
              name="description" 
              value={formData.description}
              onChange={handleInputChange}
              className="form-input"
              style={{ minHeight: '100px', resize: 'vertical' }}
              placeholder="Brief description of the product features..."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Products;
