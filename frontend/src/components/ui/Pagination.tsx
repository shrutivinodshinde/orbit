interface Props {
    page: number;
    pageSize: number;
    total: number;
    onPage: (page: number) => void;
  }
  
  export default function Pagination({ page, pageSize, total, onPage }: Props) {
    const totalPages = Math.ceil(total / pageSize);
    if (totalPages <= 1) return null;
  
    return (
      <div className="flex items-center justify-between pt-4 text-sm text-gray-600">
        <span>{total} total records</span>
        <div className="flex gap-2">
          <button
            onClick={() => onPage(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            Prev
          </button>
          <span className="px-3 py-1.5 text-gray-500">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => onPage(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    );
  }