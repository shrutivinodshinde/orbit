import { useEffect, useState } from 'react';
import { auditApi } from '../../api/audit.api';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';

export default function AuditLogPage() {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  async function load(p = page) {
    setLoading(true);
    try {
      const res = await auditApi.getAll(p, 30);
      setData(res.data);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page]);

  const columns = [
    {
      key: 'action', label: 'Action',
      render: (r: any) => (
        <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
          {r.action}
        </span>
      ),
    },
    { key: 'userName', label: 'User' },
    {
      key: 'entityType', label: 'Entity',
      render: (r: any) => (
        <span>
          {r.entityType}
          {r.entityId && <span className="text-gray-400"> #{r.entityId}</span>}
        </span>
      ),
    },
    { key: 'method', label: 'Method',
      render: (r: any) => (
        <span className={`text-xs font-medium ${
          r.method === 'DELETE' ? 'text-red-600' :
          r.method === 'POST' ? 'text-green-600' :
          r.method === 'PATCH' ? 'text-yellow-600' : 'text-gray-600'
        }`}>{r.method}</span>
      ),
    },
    { key: 'path', label: 'Path', render: (r: any) => <span className="text-xs text-gray-500 font-mono">{r.path}</span> },
    {
      key: 'createdAt', label: 'When',
      render: (r: any) => (
        <span className="text-xs text-gray-500">
          {new Date(r.createdAt).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Audit Log</h1>
        <p className="text-sm text-gray-400">{total} total entries</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 overflow-x-auto">
        <DataTable columns={columns} data={data} loading={loading} emptyMessage="No audit log entries yet. Try creating or updating a record." />
        <Pagination page={page} pageSize={30} total={total} onPage={setPage} />
      </div>
    </div>
  );
}