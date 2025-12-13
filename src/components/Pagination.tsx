import React from 'react';

interface Props {
  page: number;
  totalPages?: number | null;
  onPageChange: (page: number) => void;
  className?: string;
}

const Pagination: React.FC<Props> = ({ page, totalPages, onPageChange, className }) => {
  const prev = () => onPageChange(Math.max(1, page - 1));
  const next = () => onPageChange(page + 1);

  const renderPageButtons = () => {
    if (!totalPages || totalPages <= 1) return null;

    const pages: (number | '...')[] = [];
    const delta = 2; // pages around current
    const left = Math.max(2, page - delta);
    const right = Math.min(totalPages - 1, page + delta);

    pages.push(1);
    if (left > 2) pages.push('...');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push('...');
    if (totalPages > 1) pages.push(totalPages);

    return (
      <nav className="hidden sm:flex items-center gap-1" aria-label="Pagination">
        {pages.map((p, idx) =>
          p === '...' ? (
            <span key={`dot-${idx}`} className="px-3 py-1.5 text-sm text-gray-500">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={`px-3 py-1.5 text-sm rounded-md border ${p === page ? 'bg-gray-900 text-white border-transparent' : 'bg-white text-gray-700 border-gray-200'} hover:bg-gray-50`}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}
      </nav>
    );
  };

  return (
    <div className={`w-full flex items-center justify-between sm:justify-center gap-3 ${className || ''}`}>
      <div className="flex items-center gap-2">
        <button
          onClick={prev}
          disabled={page <= 1}
          className="px-3 py-1.5 rounded-md border border-gray-200 text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Prev
        </button>

        <div className="sm:hidden text-sm text-gray-700">Page {page}{totalPages ? ` of ${totalPages}` : ''}</div>

        <button
          onClick={next}
          disabled={totalPages ? page >= totalPages : false}
          className="px-3 py-1.5 rounded-md border border-gray-200 text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Next
        </button>
      </div>

      {renderPageButtons()}
    </div>
  );
};

export default Pagination;
