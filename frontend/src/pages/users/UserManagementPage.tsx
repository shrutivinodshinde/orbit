import { useEffect, useState } from 'react';
import { usersApi } from '../../api/users.api';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import PermissionPanel from './PermissionPanel';
import ChangeRoleModal from './ChangeRoleModal';

export default function UserManagementPage() {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [roleUserId, setRoleUserId] = useState<number | null>(null);
  const [roleUserCurrent, setRoleUserCurrent] = useState('');

  async function load(p = page, s = search) {
    setLoading(true);
    try {
      const res = await usersApi.getAll({ page: p, pageSize: 20, ...(s && { search: s }) });
      setData(res.data);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    load(1, search);
  }

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    {
      key: 'role', label: 'Role',
      render: (r: any) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700">
          {r.role?.name}
        </span>
      ),
    },
    { key: 'country', label: 'Country', render: (r: any) => r.country?.name ?? '—' },
    { key: 'branch', label: 'Branch', render: (r: any) => r.branch?.name ?? '—' },
    {
      key: 'actions', label: 'Actions',
      render: (r: any) => (
        <div className="flex gap-2">
          <button
            onClick={() => { setRoleUserId(r.id); setRoleUserCurrent(r.role?.name); }}
            className="text-xs text-brand-600 hover:text-brand-800 font-medium"
          >
            Change Role
          </button>
          <button
            onClick={() => setSelectedUserId(r.id)}
            className="text-xs text-gray-600 hover:text-gray-800 font-medium"
          >
            Permissions
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">User Management</h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email..."
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 w-56 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            type="submit"
            className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <DataTable columns={columns} data={data} loading={loading} />
        <Pagination page={page} pageSize={20} total={total} onPage={setPage} />
      </div>

      {selectedUserId && (
        <PermissionPanel
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}

      {roleUserId && (
        <ChangeRoleModal
          userId={roleUserId}
          currentRole={roleUserCurrent}
          onClose={() => setRoleUserId(null)}
          onUpdated={() => { setRoleUserId(null); load(); }}
        />
      )}
    </div>
  );
}