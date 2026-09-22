import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { createProduct, getCategories, getInventory, getProducts, getSuppliers } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    description: '',
    categoryId: '',
    supplierId: '',
    price: '',
    costPrice: '',
    reorderLevel: '10',
    safetyStock: '5',
  });

  const loadProducts = async () => {
    try {
      setLoading(true);
      const [productResponse, categoryResponse, supplierResponse, inventoryResponse] = await Promise.all([
        getProducts(),
        getCategories(),
        getSuppliers(),
        getInventory(),
      ]);

      setProducts(productResponse || []);
      setCategories(categoryResponse || []);
      setSuppliers(supplierResponse || []);
      setInventory(inventoryResponse || []);
      setError('');
    } catch (requestError) {
      setError(requestError.message || 'Unable to load products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const [productResponse, categoryResponse, supplierResponse, inventoryResponse] = await Promise.all([
          getProducts(),
          getCategories(),
          getSuppliers(),
          getInventory(),
        ]);

        setProducts(productResponse || []);
        setCategories(categoryResponse || []);
        setSuppliers(supplierResponse || []);
        setInventory(inventoryResponse || []);
        setError('');
      } catch (requestError) {
        setError(requestError.message || 'Unable to load products.');
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateProduct = async (event) => {
    event.preventDefault();

    if (!formData.name || !formData.sku || !formData.price) {
      setError('Product name, SKU, and price are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await createProduct({
        ...formData,
        price: Number(formData.price),
        costPrice: formData.costPrice ? Number(formData.costPrice) : null,
        reorderLevel: Number(formData.reorderLevel || 0),
        safetyStock: Number(formData.safetyStock || 0),
        categoryId: formData.categoryId ? Number(formData.categoryId) : null,
        supplierId: formData.supplierId ? Number(formData.supplierId) : null,
      });

      setIsModalOpen(false);
      setFormData({
        name: '',
        sku: '',
        barcode: '',
        description: '',
        categoryId: '',
        supplierId: '',
        price: '',
        costPrice: '',
        reorderLevel: '10',
        safetyStock: '5',
      });
      await loadProducts();
    } catch (requestError) {
      setError(requestError.message || 'Unable to create product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryMap = useMemo(() => Object.fromEntries(categories.map((category) => [category.id, category.name])), [categories]);
  const supplierMap = useMemo(() => Object.fromEntries(suppliers.map((supplier) => [supplier.id, supplier.name])), [suppliers]);

  const enrichedProducts = useMemo(() => products.map((product) => {
    const totalQuantity = inventory
      .filter((entry) => Number(entry.productId) === Number(product.id))
      .reduce((sum, entry) => sum + Number(entry.quantity || 0), 0);

    let status = 'in_stock';
    if (totalQuantity === 0) status = 'out_of_stock';
    else if (product.reorderLevel !== undefined && totalQuantity <= Number(product.reorderLevel)) status = 'low_stock';

    return {
      ...product,
      category: categoryMap[product.categoryId] || 'Uncategorized',
      supplier: supplierMap[product.supplierId] || 'Not assigned',
      totalQuantity,
      status,
    };
  }), [products, categories, suppliers, inventory]);

  const filteredProducts = enrichedProducts.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || product.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || product.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (loading) {
    return <div className="card"><div className="empty-state"><div className="empty-state-title">Loading products…</div></div></div>;
  }

  if (error) {
    return <div className="card"><div className="empty-state"><div className="empty-state-title">Unable to load products.</div><div className="empty-state-description">{error}</div></div></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Products</h1>
        <p className="page-subtitle">Manage your product catalog</p>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h3 className="card-title">Product List</h3>
          <button className="btn btn-primary" type="button" onClick={() => setIsModalOpen(true)}><span>➕</span> Add Product</button>
        </div>

        <div className="filters">
          <input type="search" className="filter-input" placeholder="Search by name or SKU..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <select className="filter-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="All">All Categories</option>
            {categories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}
          </select>
          <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Status</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Supplier</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length ? filteredProducts.map((product) => (
              <tr key={product.id}>
                <td><Link to={`/products/${product.id}`} className="link"><strong>{product.name}</strong></Link></td>
                <td>{product.sku}</td>
                <td>{product.category}</td>
                <td>{product.supplier}</td>
                <td>₹{Number(product.price || 0).toFixed(2)}</td>
                <td><strong>{product.totalQuantity}</strong> units</td>
                <td><StatusBadge status={product.status} /></td>
                <td><Link to={`/products/${product.id}`}><button className="btn btn-secondary btn-sm" type="button">View</button></Link></td>
              </tr>
            )) : (
              <tr><td colSpan="8" className="empty-state">No products found matching your criteria.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Product</h3>
              <button type="button" className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleCreateProduct} className="modal-form">
              <div className="form-grid">
                <label>
                  <span>Product Name</span>
                  <input name="name" value={formData.name} onChange={handleFieldChange} required />
                </label>
                <label>
                  <span>SKU</span>
                  <input name="sku" value={formData.sku} onChange={handleFieldChange} required />
                </label>
                <label>
                  <span>Barcode</span>
                  <input name="barcode" value={formData.barcode} onChange={handleFieldChange} />
                </label>
                <label>
                  <span>Category</span>
                  <select name="categoryId" value={formData.categoryId} onChange={handleFieldChange}>
                    <option value="">Select category</option>
                    {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                </label>
                <label>
                  <span>Supplier</span>
                  <select name="supplierId" value={formData.supplierId} onChange={handleFieldChange}>
                    <option value="">Select supplier</option>
                    {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
                  </select>
                </label>
                <label>
                  <span>Selling Price</span>
                  <input name="price" type="number" min="0" step="0.01" value={formData.price} onChange={handleFieldChange} required />
                </label>
                <label>
                  <span>Cost Price</span>
                  <input name="costPrice" type="number" min="0" step="0.01" value={formData.costPrice} onChange={handleFieldChange} />
                </label>
                <label>
                  <span>Reorder Level</span>
                  <input name="reorderLevel" type="number" min="0" value={formData.reorderLevel} onChange={handleFieldChange} />
                </label>
                <label>
                  <span>Safety Stock</span>
                  <input name="safetyStock" type="number" min="0" value={formData.safetyStock} onChange={handleFieldChange} />
                </label>
                <label className="full-width">
                  <span>Description</span>
                  <textarea name="description" rows="3" value={formData.description} onChange={handleFieldChange} />
                </label>
              </div>

              {error && <div className="form-error">{error}</div>}

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Product'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
