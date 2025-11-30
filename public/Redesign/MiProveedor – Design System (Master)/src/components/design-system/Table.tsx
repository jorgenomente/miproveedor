import React from 'react';

interface Column {
  key: string;
  header: string;
  width?: string;
}

interface TableProps {
  columns: Column[];
  data: Record<string, any>[];
  onRowClick?: (row: Record<string, any>) => void;
}

export function Table({ columns, data, onRowClick }: TableProps) {
  const [selectedRow, setSelectedRow] = React.useState<number | null>(null);

  const handleRowClick = (index: number, row: Record<string, any>) => {
    setSelectedRow(index);
    onRowClick?.(row);
  };

  return (
    <div className="w-full border border-[var(--surface-400)] rounded-[var(--radius-md)] overflow-hidden">
      <table className="w-full">
        <thead className="bg-[var(--surface-200)] border-b border-[var(--surface-400)]">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-4 py-3 text-left text-[var(--text-secondary)] text-[13px] font-semibold"
                style={{ width: column.width }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={index}
              onClick={() => handleRowClick(index, row)}
              className={`
                border-b border-[var(--surface-400)] last:border-b-0
                transition-colors duration-150
                ${onRowClick ? 'cursor-pointer' : ''}
                ${selectedRow === index 
                  ? 'bg-[var(--brand-aqua-soft)]/6' 
                  : 'hover:bg-[var(--surface-200)]'
                }
              `}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className="px-4 py-3 text-[var(--text-primary)] text-[14px]"
                >
                  {row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}