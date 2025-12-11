import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

type Column<T> = {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
};

type TableProps<T> = {
  columns: Column<T>[];
  data: T[];
  onSort?: (key: string) => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  emptyMessage?: string;
  loading?: boolean;
};

export function Table<T extends { id?: string | number }>({
  columns,
  data,
  onSort,
  sortKey,
  sortDirection,
  emptyMessage = 'No data available',
  loading = false,
}: TableProps<T>) {
  const handleSort = (key: string, sortable?: boolean) => {
    if (sortable && onSort) {
      onSort(key);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
      <table className="w-full min-w-[600px]">
        <thead className="bg-gray-50 border-b sticky top-0 z-10">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider ${
                  column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                }`}
                onClick={() => handleSort(column.key, column.sortable)}
              >
                <div className="flex items-center gap-2">
                  <span className="truncate">{column.label}</span>
                  {column.sortable && sortKey === column.key && (
                    <span className="flex-shrink-0">
                      {sortDirection === 'asc' ? (
                        <ArrowUp className="w-4 h-4" />
                      ) : (
                        <ArrowDown className="w-4 h-4" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, index) => (
            <tr key={row.id || index} className="hover:bg-gray-50">
              {columns.map((column) => (
                <td key={column.key} className="px-3 sm:px-4 py-3 text-sm text-gray-900">
                  <div className="max-w-xs truncate">
                    {column.render ? column.render(row) : (row as any)[column.key]}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;

