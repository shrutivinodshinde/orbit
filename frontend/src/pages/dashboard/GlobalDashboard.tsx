import { useEffect, useState } from 'react';
import { salesApi } from '../../api/sales.api';
import { exportApi } from '../../api/export.api';
import { attendanceApi } from '../../api/attendance.api';
import KpiCard from '../../components/ui/KpiCard';
import SalesBarChart from '../../components/charts/SalesBarChart';
import StatusPieChart from '../../components/charts/StatusPieChart';

export default function GlobalDashboard() {
  const [sales, setSales] = useState<any>(null);
  const [exports, setExports] = useState<any>(null);
  const [attendance, setAttendance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      salesApi.getAll({ pageSize: 100 }),
      exportApi.getAll({ pageSize: 100 }),
      attendanceApi.getAll({ pageSize: 100 }),
    ])
      .then(([s, e, a]) => { setSales(s); setExports(e); setAttendance(a); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-400">Loading dashboard...</p>;

  const totalRevenue = sales?.data.reduce((sum: number, o: any) => sum + Number(o.amount), 0) ?? 0;
  const completedOrders = sales?.data.filter((o: any) => o.status === 'COMPLETED').length ?? 0;
  const heldShipments = exports?.data.filter((s: any) => s.customsStatus === 'HELD').length ?? 0;
  const presentToday = attendance?.data.filter((a: any) => a.status === 'PRESENT').length ?? 0;

  // Group sales by branch for bar chart
  const salesByBranch = Object.entries(
    (sales?.data ?? []).reduce((acc: Record<string, number>, o: any) => {
      const key = o.branch?.name ?? 'Unknown';
      acc[key] = (acc[key] ?? 0) + Number(o.amount);
      return acc;
    }, {}),
  ).map(([name, amount]) => ({ name, amount: amount as number }));

  // Shipment status breakdown for pie chart
  const shipmentStatusData = ['PACKED', 'SHIPPED', 'IN_CUSTOMS', 'DELIVERED'].map((s) => ({
    name: s, value: exports?.data.filter((e: any) => e.status === s).length ?? 0,
  })).filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-gray-900">Global Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Revenue" value={`₹${totalRevenue.toLocaleString()}`} color="blue" />
        <KpiCard label="Completed Orders" value={completedOrders} color="green" />
        <KpiCard label="Shipments in Customs" value={heldShipments} color="yellow" />
        <KpiCard label="Present Today" value={presentToday} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Revenue by Branch</h2>
          <SalesBarChart data={salesByBranch} />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Shipment Status Breakdown</h2>
          <StatusPieChart
            data={shipmentStatusData}
            colors={['#3b6cf5', '#10b981', '#f59e0b', '#6366f1']}
          />
        </div>
      </div>
    </div>
  );
}