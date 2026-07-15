import { useEffect, useState } from 'react';
import { attendanceApi } from '../../api/attendance.api';
import { useAuth } from '../../context/AuthContext';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import StatusBadge from '../../components/ui/StatusBadge';

const MANAGERS = ['Super Admin', 'Country Admin', 'Manager', 'Team Lead'];

export default function AttendancePage() {
  const { user } = useAuth();
  const isManager = user && MANAGERS.includes(user.role);

  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [checkInMsg, setCheckInMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = isManager
        ? await attendanceApi.getAll({ page, pageSize: 20 })
        : await attendanceApi.mine();
      setData(isManager ? res.data : res.data ?? []);
      setTotal(isManager ? res.total : res.data?.length ?? 0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page]);

  async function handleCheckIn() {
    try {
      await attendanceApi.checkIn();
      setCheckInMsg('Checked in successfully');
      load();
    } catch (err: any) {
      setCheckInMsg(err.response?.data?.message ?? 'Check-in failed');
    }
  }

  async function handleCheckOut() {
    try {
      await attendanceApi.checkOut();
      setCheckInMsg('Checked out successfully');
      load();
    } catch (err: any) {
      setCheckInMsg(err.response?.data?.message ?? 'Check-out failed');
    }
  }

  const columns = [
    { key: 'user', label: 'Employee', render: (r: any) => r.user?.name ?? 'You' },
    { key: 'date', label: 'Date', render: (r: any) => new Date(r.date).toLocaleDateString() },
    { key: 'status', label: 'Status', render: (r: any) => <StatusBadge status={r.status} /> },
    { key: 'checkIn', label: 'Check In', render: (r: any) => r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—' },
    { key: 'checkOut', label: 'Check Out', render: (r: any) => r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Attendance</h1>
        {!isManager && (
          <div className="flex gap-2">
            <button
              onClick={handleCheckIn}
              className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Check In
            </button>
            <button
              onClick={handleCheckOut}
              className="bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Check Out
            </button>
          </div>
        )}
      </div>

      {checkInMsg && (
        <div className="bg-green-50 text-green-700 text-sm px-4 py-2 rounded-lg border border-green-200">
          {checkInMsg}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <DataTable columns={columns} data={data} loading={loading} />
        {isManager && <Pagination page={page} pageSize={20} total={total} onPage={setPage} />}
      </div>
    </div>
  );
}