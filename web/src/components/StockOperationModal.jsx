import { useState, useEffect } from 'react';
import { X, Package, TrendingUp, TrendingDown, RefreshCw, Edit } from 'lucide-react';
import { getProducts, getWarehouses, getRacks, getInventory, stockIn, stockOut, transferStock, adjustInventory } from '../services/api';

export default function StockOperationModal({ isOpen, onClose, onSuccess, initialOperation = 'in', initialProductId = null, initialWarehouseId = null }) {
  const [operation, setOperation] = useState(initialOperation);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [racks, setRacks] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sourceInventoryInfo, setSourceInventoryInfo] = useState(null);
  
  const [formData, setFormData] = useState({
    productId: initialProductId || '',
    warehouseId: initialWarehouseId || '',
    rackId: '',
    quantity: '',
    referenceNumber: '',
    notes: '',
    // For transfer
    sourceWarehouseId: initialWarehouseId || '',
    sourceRackId: '',
    destinationWarehouseId: '',
    destinationRackId: '',
    // For adjustment
    newQuantity: '',
    reason: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadData();
      setError('');
    }
  }, [isOpen]);

  useEffect(() => {
    setOperation(initialOperation);
  }, [initialOperation]);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      productId: initialProductId || '',
      warehouseId: initialWarehouseId || '',
      sourceWarehouseId: initialWarehouseId || '',
    }));
  }, [initialProductId, initialWarehouseId]);

  const loadData = async () => {
    try {
      console.log('Loading products, warehouses, racks, and inventory...');
      const [productsRes, warehousesRes, racksRes, inventoryRes] = await Promise.all([
        getProducts(),
        getWarehouses(),
        getRacks(),
        getInventory(),
      ]);
      console.log('Loaded:', { 
        products: productsRes?.length || 0, 
        warehouses: warehousesRes?.length || 0, 
        racks: racksRes?.length || 0,
        inventory: inventoryRes?.length || 0
      });
      setProducts(productsRes || []);
      setWarehouses(warehousesRes || []);
      setRacks(racksRes || []);
      setInventory(inventoryRes || []);
      
      if (!productsRes || productsRes.length === 0) {
        setError('No products available. Please add products first.');
      }
      if (!warehousesRes || warehousesRes.length === 0) {
        setError('No warehouses available. Please add warehouses first.');
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load required data. Please refresh and try again.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    
    // For transfer operation, check available inventory when product and source warehouse are selected
    if (operation === 'transfer') {
      const newFormData = { ...formData, [name]: value };
      if (newFormData.productId && newFormData.sourceWarehouseId) {
        checkSourceInventory(newFormData.productId, newFormData.sourceWarehouseId, newFormData.sourceRackId);
      }
    }
  };

  const checkSourceInventory = (productId, warehouseId, rackId) => {
    if (!inventory || inventory.length === 0) return;
    
    // Find all inventory records for this product in this warehouse
    const availableInventory = inventory.filter(inv => 
      Number(inv.productId) === Number(productId) && 
      Number(inv.warehouseId) === Number(warehouseId)
    );
    
    console.log('Available inventory for transfer:', availableInventory);
    
    if (availableInventory.length === 0) {
      setSourceInventoryInfo({ available: false, message: 'No stock available in source warehouse' });
      setError('No stock available in the selected source warehouse for this product.');
    } else if (rackId) {
      // If rack is specified, check specific rack
      const rackInventory = availableInventory.find(inv => Number(inv.rackId) === Number(rackId));
      if (rackInventory) {
        setSourceInventoryInfo({ 
          available: true, 
          quantity: rackInventory.quantity,
          message: `Available in selected rack: ${rackInventory.quantity} units`
        });
      } else {
        setSourceInventoryInfo({ 
          available: false, 
          message: 'No stock in selected rack. Available in other racks.'
        });
        setError('No stock in the selected rack. Please select a different rack or leave it empty.');
      }
    } else {
      // No rack specified, show total available across all racks
      const totalQty = availableInventory.reduce((sum, inv) => sum + Number(inv.quantity || 0), 0);
      const rackList = availableInventory.map(inv => {
        const rack = racks.find(r => r.id === inv.rackId);
        return `${rack?.name || 'Unknown'} (${inv.quantity} units)`;
      }).join(', ');
      
      setSourceInventoryInfo({ 
        available: true, 
        quantity: totalQty,
        message: `Total available: ${totalQty} units in racks: ${rackList}`,
        needsRack: true
      });
      setError('Please select the source rack to transfer from.');
    }
  };

  const resetForm = () => {
    setFormData({
      productId: initialProductId || '',
      warehouseId: initialWarehouseId || '',
      rackId: '',
      quantity: '',
      referenceNumber: '',
      notes: '',
      sourceWarehouseId: initialWarehouseId || '',
      sourceRackId: '',
      destinationWarehouseId: '',
      destinationRackId: '',
      newQuantity: '',
      reason: '',
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let result;
      
      switch (operation) {
        case 'in':
          if (!formData.productId || !formData.warehouseId || !formData.quantity) {
            throw new Error('Product, warehouse, and quantity are required');
          }
          if (Number(formData.quantity) <= 0) {
            throw new Error('Quantity must be greater than 0');
          }
          console.log('Stock IN payload:', {
            productId: Number(formData.productId),
            warehouseId: Number(formData.warehouseId),
            rackId: formData.rackId ? Number(formData.rackId) : null,
            quantity: Number(formData.quantity),
            referenceNumber: formData.referenceNumber || null,
            notes: formData.notes || null,
          });
          result = await stockIn({
            productId: Number(formData.productId),
            warehouseId: Number(formData.warehouseId),
            rackId: formData.rackId ? Number(formData.rackId) : null,
            quantity: Number(formData.quantity),
            referenceNumber: formData.referenceNumber || null,
            notes: formData.notes || null,
          });
          break;

        case 'out':
          if (!formData.productId || !formData.warehouseId || !formData.quantity) {
            throw new Error('Product, warehouse, and quantity are required');
          }
          if (Number(formData.quantity) <= 0) {
            throw new Error('Quantity must be greater than 0');
          }
          console.log('Stock OUT payload:', {
            productId: Number(formData.productId),
            warehouseId: Number(formData.warehouseId),
            rackId: formData.rackId ? Number(formData.rackId) : null,
            quantity: Number(formData.quantity),
            referenceNumber: formData.referenceNumber || null,
            notes: formData.notes || null,
          });
          result = await stockOut({
            productId: Number(formData.productId),
            warehouseId: Number(formData.warehouseId),
            rackId: formData.rackId ? Number(formData.rackId) : null,
            quantity: Number(formData.quantity),
            referenceNumber: formData.referenceNumber || null,
            notes: formData.notes || null,
          });
          break;

        case 'transfer':
          if (!formData.productId || !formData.sourceWarehouseId || !formData.destinationWarehouseId || !formData.quantity) {
            throw new Error('Product, source warehouse, destination warehouse, and quantity are required');
          }
          if (!formData.sourceRackId) {
            throw new Error('Source rack is required for transfer. Please select the rack to transfer from.');
          }
          if (Number(formData.quantity) <= 0) {
            throw new Error('Quantity must be greater than 0');
          }
          if (formData.sourceWarehouseId === formData.destinationWarehouseId && 
              formData.sourceRackId === formData.destinationRackId) {
            throw new Error('Source and destination cannot be the same');
          }
          console.log('Transfer payload:', {
            productId: Number(formData.productId),
            sourceWarehouseId: Number(formData.sourceWarehouseId),
            sourceRackId: Number(formData.sourceRackId),
            destinationWarehouseId: Number(formData.destinationWarehouseId),
            destinationRackId: formData.destinationRackId ? Number(formData.destinationRackId) : null,
            quantity: Number(formData.quantity),
            referenceNumber: formData.referenceNumber || null,
            notes: formData.notes || null,
          });
          result = await transferStock({
            productId: Number(formData.productId),
            sourceWarehouseId: Number(formData.sourceWarehouseId),
            sourceRackId: Number(formData.sourceRackId),
            destinationWarehouseId: Number(formData.destinationWarehouseId),
            destinationRackId: formData.destinationRackId ? Number(formData.destinationRackId) : null,
            quantity: Number(formData.quantity),
            referenceNumber: formData.referenceNumber || null,
            notes: formData.notes || null,
          });
          break;

        case 'adjustment':
          if (!formData.productId || !formData.warehouseId || formData.newQuantity === '' || !formData.reason) {
            throw new Error('Product, warehouse, new quantity, and reason are required');
          }
          if (Number(formData.newQuantity) < 0) {
            throw new Error('New quantity cannot be negative');
          }
          console.log('Adjustment payload:', {
            productId: Number(formData.productId),
            warehouseId: Number(formData.warehouseId),
            rackId: formData.rackId ? Number(formData.rackId) : null,
            newQuantity: Number(formData.newQuantity),
            reason: formData.reason,
          });
          result = await adjustInventory({
            productId: Number(formData.productId),
            warehouseId: Number(formData.warehouseId),
            rackId: formData.rackId ? Number(formData.rackId) : null,
            newQuantity: Number(formData.newQuantity),
            reason: formData.reason,
          });
          break;

        default:
          throw new Error('Invalid operation');
      }

      console.log('Operation successful:', result);
      alert(`✅ ${config.title} completed successfully!`);
      resetForm();
      if (onSuccess) onSuccess(result);
      onClose();
    } catch (err) {
      console.error('Stock operation error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Operation failed. Please try again.';
      setError(errorMessage);
      alert(`❌ Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredRacks = (warehouseId) => {
    if (!warehouseId) return [];
    return racks.filter(rack => Number(rack.warehouseId) === Number(warehouseId));
  };

  const getOperationConfig = () => {
    const configs = {
      in: { title: 'Stock In', icon: <TrendingUp size={20} />, color: '#10b981', bgColor: '#d1fae5' },
      out: { title: 'Stock Out', icon: <TrendingDown size={20} />, color: '#ef4444', bgColor: '#fee2e2' },
      transfer: { title: 'Transfer Stock', icon: <RefreshCw size={20} />, color: '#3b82f6', bgColor: '#dbeafe' },
      adjustment: { title: 'Adjust Inventory', icon: <Edit size={20} />, color: '#f59e0b', bgColor: '#fef3c7' },
    };
    return configs[operation] || configs.in;
  };

  if (!isOpen) return null;

  const config = getOperationConfig();

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: config.bgColor,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ color: config.color }}>{config.icon}</div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: config.color }}>
              {config.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              color: config.color,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Operation Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '16px 24px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb',
        }}>
          {[
            { key: 'in', label: 'Stock In', icon: '📥' },
            { key: 'out', label: 'Stock Out', icon: '📤' },
            { key: 'transfer', label: 'Transfer', icon: '🔄' },
            { key: 'adjustment', label: 'Adjust', icon: '⚖️' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => { setOperation(tab.key); resetForm(); }}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: operation === tab.key ? `2px solid ${config.color}` : '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: operation === tab.key ? 'white' : 'transparent',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: operation === tab.key ? '600' : '400',
                color: operation === tab.key ? config.color : '#6b7280',
                transition: 'all 0.2s',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {error && (
            <div style={{
              padding: '12px',
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              marginBottom: '16px',
              color: '#b91c1c',
              fontSize: '14px',
            }}>
              {error}
            </div>
          )}

          {/* Common Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Product */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>
                Product <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                name="productId"
                value={formData.productId}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              >
                <option value="">Select product</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} (SKU: {product.sku})
                  </option>
                ))}
              </select>
            </div>

            {/* Transfer-specific fields */}
            {operation === 'transfer' ? (
              <>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>
                    From Warehouse <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    name="sourceWarehouseId"
                    value={formData.sourceWarehouseId}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}
                  >
                    <option value="">Select source warehouse</option>
                    {warehouses.map(wh => (
                      <option key={wh.id} value={wh.id}>{wh.name}</option>
                    ))}
                  </select>
                </div>

                {formData.sourceWarehouseId && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>
                      From Rack <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      name="sourceRackId"
                      value={formData.sourceRackId}
                      onChange={handleChange}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                      }}
                    >
                      <option value="">Select source rack</option>
                      {getFilteredRacks(formData.sourceWarehouseId).map(rack => (
                        <option key={rack.id} value={rack.id}>{rack.name}</option>
                      ))}
                    </select>
                    {sourceInventoryInfo && (
                      <div style={{
                        marginTop: '8px',
                        padding: '8px 12px',
                        backgroundColor: sourceInventoryInfo.available ? '#d1fae5' : '#fee2e2',
                        border: `1px solid ${sourceInventoryInfo.available ? '#10b981' : '#ef4444'}`,
                        borderRadius: '6px',
                        fontSize: '13px',
                        color: sourceInventoryInfo.available ? '#065f46' : '#991b1b',
                      }}>
                        {sourceInventoryInfo.message}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>
                    To Warehouse <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    name="destinationWarehouseId"
                    value={formData.destinationWarehouseId}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}
                  >
                    <option value="">Select destination warehouse</option>
                    {warehouses.map(wh => (
                      <option key={wh.id} value={wh.id}>{wh.name}</option>
                    ))}
                  </select>
                </div>

                {formData.destinationWarehouseId && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>
                      To Rack (Optional)
                    </label>
                    <select
                      name="destinationRackId"
                      value={formData.destinationRackId}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                      }}
                    >
                      <option value="">No specific rack</option>
                      {getFilteredRacks(formData.destinationWarehouseId).map(rack => (
                        <option key={rack.id} value={rack.id}>{rack.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Warehouse for non-transfer operations */}
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>
                    Warehouse <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    name="warehouseId"
                    value={formData.warehouseId}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}
                  >
                    <option value="">Select warehouse</option>
                    {warehouses.map(wh => (
                      <option key={wh.id} value={wh.id}>{wh.name}</option>
                    ))}
                  </select>
                </div>

                {formData.warehouseId && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>
                      Rack (Optional)
                    </label>
                    <select
                      name="rackId"
                      value={formData.rackId}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                      }}
                    >
                      <option value="">No specific rack</option>
                      {getFilteredRacks(formData.warehouseId).map(rack => (
                        <option key={rack.id} value={rack.id}>{rack.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}

            {/* Quantity or New Quantity */}
            {operation === 'adjustment' ? (
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>
                  New Quantity <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="number"
                  name="newQuantity"
                  value={formData.newQuantity}
                  onChange={handleChange}
                  min="0"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                />
              </div>
            ) : (
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>
                  Quantity <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  min="1"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                />
              </div>
            )}

            {/* Reference Number (not for adjustment) */}
            {operation !== 'adjustment' && (
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>
                  Reference Number
                </label>
                <input
                  type="text"
                  name="referenceNumber"
                  value={formData.referenceNumber}
                  onChange={handleChange}
                  placeholder="e.g., PO-12345 or SO-67890"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                />
              </div>
            )}

            {/* Notes or Reason */}
            {operation === 'adjustment' ? (
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>
                  Reason <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  required
                  rows="3"
                  placeholder="Explain why this adjustment is needed (required for audit)"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical',
                  }}
                />
              </div>
            ) : (
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px' }}>
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Add any additional notes..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical',
                  }}
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{
            marginTop: '24px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '10px 20px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                backgroundColor: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                opacity: loading ? 0.6 : 1,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: config.color,
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Processing...' : `Confirm ${config.title}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
