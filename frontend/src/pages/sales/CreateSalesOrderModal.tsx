import { useState, useEffect } from 'react';
import { salesApi } from '../../api/sales.api';
import { customersApi } from '../../api/customers.api';
import { branchesApi } from '../../api/branches.api';
import { useAuth } from '../../context/AuthContext';

interface Props { onClose: () => void; onCreated: () => void; }

export default function CreateSalesOrderModal({ onClose, onCreated }: Props) {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [branchId, setBranchId] = useState(user?.branchId ? String(user.branchId) : '');
  const [items, setItems] = useState([{ productName: '', quantity: 1, unitPrice: 0 }]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      customersApi.getAll(),
      branchesApi.getAll(),
    ])
      .then(([c, b]) => {
        setCustomers(c);
        setBranches(b);
      })
      .catch(() => setError('Failed to load form data. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  function addItem() {
    setItems([...items, { productName: '', quantity: 1, unitPrice: 0 }]);
  }

  function removeItem(i: number) {
    setItems(items.filter((_, idx) => idx !== i));
  }

  function updateItem(i: number, field: string, value: string | number) {
    setItems(items.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  }

  async function handleSubmit() {
    if (!customerId) { setError('Please select a customer'); return; }
    if (!branchId) { setError('Please select a branch'); return; }
    const invalidItem = items.find((i) => !i.productName || i.quantity < 1 || i.unitPrice <= 0);
    if (invalidItem) { setError('Please fill in all item details correctly'); return; }

    setError(null);
    setSubmitting(true);
    try {
      await salesApi.create({
        branchId: Number(branchId),
        customerId: Number(customerId),
        items: items.map((i) => ({
          productName: i.productName,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
        })),
      });
      onCreated();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  }

  const total = items.reduce((sum, i) => sum + Number(i.quantity) * Number(i.unitPrice), 0);
  const userHasFixedBranch = !!user?.branchId;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">New Sales Order</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {loading && <p className="text-sm text-gray-400">Loading form data...</p>}
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          {/* Branch selector — only shown if user has no fixed branch (Super Admin / Country Admin) */}
          {!userHasFixedBranch && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Select branch...</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} {b.country?.code ? `(${b.country.code})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Select customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Items</label>
            {items.map((item, i) => (
              <div key={i} className="flex gap-2 items-start">
                <input
                  placeholder="Product name"
                  value={item.productName}
                  onChange={(e) => updateItem(i, 'productName', e.target.value)}
                  className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <input
                  type="number" min={1} placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                  className="w-16 text-sm border border-gray-300 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <input
                  type="number" min={0} placeholder="Price"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(i, 'unitPrice', e.target.value)}
                  className="w-24 text-sm border border-gray-300 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                {items.length > 1 && (
                  <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 text-sm pt-2">✕</button>
                )}
              </div>
            ))}
            <button onClick={addItem} className="text-sm text-brand-600 hover:text-brand-700 font-medium">
              + Add item
            </button>
          </div>

          <div className="text-right text-sm font-medium text-gray-700">
            Total: ₹{total.toLocaleString()}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={onClose} className="text-sm text-gray-600 hover:text-gray-800 px-4 py-2">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={submitting || loading}
            className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {submitting ? 'Creating...' : 'Create Order'}
          </button>
        </div>
      </div>
    </div>
  );
}