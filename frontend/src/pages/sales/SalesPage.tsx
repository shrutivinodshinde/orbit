import { useEffect, useState } from 'react';
import { salesApi } from '../../api/sales.api';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import StatusBadge from '../../components/ui/StatusBadge';
import CreateSalesOrderModal from './CreateSalesOrderModal';
import { useAuth } from '../../context/AuthContext';

const CAN_EDIT = ['Super Admin', 'Country Admin', 'Manager'];
const STATUS_OPTIONS = ['', 'PENDING', 'COMPLETED', 'CANCELLED'];

export default function SalesPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  async function load(p = page, s = status) {
    setLoading(true);
    try {
      const res = await salesApi.getAll({ page: p, pageSize: 20, ...(s && { status: s }) });
      setData(res.data);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page, status]);

  const columns = [
    { key: 'id', label: '#', render: (r: any) => `#${r.id}` },
    { key: 'customer', label: 'Customer', render: (r: any) => r.customer?.name },
    { key: 'branch', label: 'Branch', render: (r: any) => `${r.branch?.name} (${r.branch?.country?.code})` },
    { key: 'amount', label: 'Amount', render: (r: any) => `₹${Number(r.amount).toLocaleString()}` },
    { key: 'status', label: 'Status', render: (r: any) => <StatusBadge status={r.status} /> },
    { key: 'orderDate', label: 'Date', render: (r: any) => new Date(r.orderDate).toLocaleDateString() },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Sales Orders</h1>
        {user && CAN_EDIT.includes(user.role) && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + New Order
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex gap-3 mb-5">
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s || 'All Statuses'}</option>
            ))}
          </select>
        </div>

        <DataTable columns={columns} data={data} loading={loading} />
        <Pagination page={page} pageSize={20} total={total} onPage={setPage} />
      </div>

      {showModal && (
        <CreateSalesOrderModal
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); load(1); }}
        />
      )}
    </div>
  );
}