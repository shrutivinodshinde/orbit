interface Column<T> {
    key: string;
    label: string;
    render?: (row: T) => React.ReactNode;
  }
  
  interface Props<T> {
    columns: Column<T>[];
    data: T[];
    loading?: boolean;
    emptyMessage?: string;
  }
  
  export default function DataTable<T extends Record<string, any>>({ columns, data, loading, emptyMessage = 'No records found' }: Props<T>) {
    if (loading) return <p className="text-sm text-gray-400 py-8 text-center">Loading...</p>;
    if (!data.length) return <p className="text-sm text-gray-400 py-8 text-center">{emptyMessage}</p>;
  
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {columns.map((col) => (
                <th key={col.key} className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide pb-3 pr-4">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className="py-3 pr-4 text-gray-700">
                    {col.render ? col.render(row) : row[col.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }