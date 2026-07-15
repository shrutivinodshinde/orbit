import { useEffect, useState } from 'react';
import { exportApi } from '../../api/export.api';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import StatusBadge from '../../components/ui/StatusBadge';

const CUSTOMS_OPTIONS = ['', 'PENDING', 'CLEARED', 'HELD'];
const STATUS_OPTIONS = ['', 'PACKED', 'SHIPPED', 'IN_CUSTOMS', 'DELIVERED'];

export default function ExportPage() {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [customsStatus, setCustomsStatus] = useState('');
  const [loading, setLoading] = useState(true);

  async function load(p = page) {
    setLoading(true);
    try {
      const res = await exportApi.getAll({
        page: p, pageSize: 20,
        ...(status && { status }),
        ...(customsStatus && { customsStatus }),
      });
      setData(res.data);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page, status, customsStatus]);

  const columns = [
    { key: 'id', label: '#', render: (r: any) => `#${r.id}` },
    { key: 'branch', label: 'Branch', render: (r: any) => `${r.branch?.name} (${r.branch?.country?.code})` },
    { key: 'destination', label: 'Destination', render: (r: any) => r.destinationCountry },
    { key: 'status', label: 'Status', render: (r: any) => <StatusBadge status={r.status} /> },
    { key: 'customsStatus', label: 'Customs', render: (r: any) => <StatusBadge status={r.customsStatus} /> },
    { key: 'shipmentDate', label: 'Shipped', render: (r: any) => new Date(r.shipmentDate).toLocaleDateString() },
    { key: 'expectedDeliveryDate', label: 'Expected', render: (r: any) => r.expectedDeliveryDate ? new Date(r.expectedDeliveryDate).toLocaleDateString() : '—' },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-gray-900">Export Shipments</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex gap-3 mb-5">
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
          </select>
          <select
            value={customsStatus}
            onChange={(e) => { setCustomsStatus(e.target.value); setPage(1); }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {CUSTOMS_OPTIONS.map((s) => <option key={s} value={s}>{s || 'All Customs'}</option>)}
          </select>
        </div>

        <DataTable columns={columns} data={data} loading={loading} />
        <Pagination page={page} pageSize={20} total={total} onPage={setPage} />
      </div>
    </div>
  );
}