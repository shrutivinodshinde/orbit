const STATUS_COLORS: Record<string, string> = {
    COMPLETED: 'bg-green-100 text-green-700',
    DELIVERED: 'bg-green-100 text-green-700',
    CLEARED: 'bg-green-100 text-green-700',
    PRESENT: 'bg-green-100 text-green-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    IN_CUSTOMS: 'bg-yellow-100 text-yellow-700',
    SHIPPED: 'bg-blue-100 text-blue-700',
    PACKED: 'bg-blue-100 text-blue-700',
    CANCELLED: 'bg-red-100 text-red-700',
    HELD: 'bg-red-100 text-red-700',
    ABSENT: 'bg-red-100 text-red-700',
    LEAVE: 'bg-purple-100 text-purple-700',
  };
  
  export default function StatusBadge({ status }: { status: string }) {
    const cls = STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600';
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
        {status.replace(/_/g, ' ')}
      </span>
    );
  }