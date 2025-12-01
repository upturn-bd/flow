"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import LoadingSpinner from "./LoadingSpinner";
import { EmptyState } from "./EmptyState";

export interface DataTableColumn<T> {
  /** Unique key for the column */
  key: string;
  /** Header text */
  header: string;
  /** Custom render function for cell content */
  render?: (item: T, index: number) => ReactNode;
  /** Accessor key to get value from item (if no render function) */
  accessor?: keyof T;
  /** Header cell className */
  headerClassName?: string;
  /** Data cell className */
  cellClassName?: string;
  /** Whether column is sortable */
  sortable?: boolean;
  /** Column width */
  width?: string;
  /** Hide on mobile */
  hideOnMobile?: boolean;
}

export interface DataTableProps<T> {
  /** Column definitions */
  columns: DataTableColumn<T>[];
  /** Data array */
  data: T[];
  /** Function to extract unique key from each item */
  keyExtractor: (item: T) => string | number;
  /** Click handler for row */
  onRowClick?: (item: T) => void;
  /** Empty state configuration */
  emptyState?: {
    icon?: ReactNode;
    title?: string;
    message: string;
    action?: {
      label: string;
      onClick: () => void;
      icon?: ReactNode;
    };
  };
  /** Loading state */
  loading?: boolean;
  /** Loading text */
  loadingText?: string;
  /** Container className */
  className?: string;
  /** Table className */
  tableClassName?: string;
  /** Whether to show header */
  showHeader?: boolean;
  /** Whether rows are hoverable */
  hoverable?: boolean;
  /** Whether to stripe rows */
  striped?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: {
    header: "px-3 py-2 text-xs",
    cell: "px-3 py-2 text-xs",
  },
  md: {
    header: "px-4 sm:px-6 py-3 text-xs",
    cell: "px-4 sm:px-6 py-3 sm:py-4 text-sm",
  },
  lg: {
    header: "px-6 py-4 text-sm",
    cell: "px-6 py-5 text-base",
  },
};

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyState,
  loading = false,
  loadingText = "Loading data...",
  className = "",
  tableClassName = "",
  showHeader = true,
  hoverable = true,
  striped = false,
  size = "md",
}: DataTableProps<T>) {
  const sizes = sizeClasses[size];

  if (loading) {
    return (
      <div className={`bg-surface-primary rounded-lg border border-border-primary overflow-hidden ${className}`}>
        <LoadingSpinner text={loadingText} height="h-48" color="gray" />
      </div>
    );
  }

  if (data.length === 0) {
    if (emptyState) {
      return (
        <div className={`bg-surface-primary rounded-lg border border-border-primary overflow-hidden ${className}`}>
          <div className="p-8 sm:p-12">
            <EmptyState
              icon={emptyState.icon || <span className="text-4xl">📋</span>}
              title={emptyState.title || "No data found"}
              description={emptyState.message}
              action={emptyState.action}
            />
          </div>
        </div>
      );
    }

    return (
      <div className={`bg-surface-primary rounded-lg border border-border-primary p-8 sm:p-12 text-center ${className}`}>
        <p className="text-foreground-tertiary">No data to display</p>
      </div>
    );
  }

  const getCellValue = (item: T, column: DataTableColumn<T>, index: number): ReactNode => {
    if (column.render) {
      return column.render(item, index);
    }
    if (column.accessor) {
      const value = item[column.accessor];
      return value !== undefined && value !== null ? String(value) : "-";
    }
    return "-";
  };

  return (
    <div className={`bg-surface-primary rounded-lg border border-border-primary overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className={`w-full ${tableClassName}`}>
          {showHeader && (
            <thead className="bg-background-secondary dark:bg-background-tertiary border-b border-border-primary">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`
                      ${sizes.header}
                      text-left font-medium text-foreground-tertiary uppercase tracking-wider
                      ${column.hideOnMobile ? "hidden sm:table-cell" : ""}
                      ${column.headerClassName || ""}
                    `}
                    style={{ width: column.width }}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className="divide-y divide-border-primary">
            {data.map((item, index) => (
              <motion.tr
                key={keyExtractor(item)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.02 }}
                onClick={() => onRowClick?.(item)}
                className={`
                  ${onRowClick ? "cursor-pointer" : ""}
                  ${hoverable ? "hover:bg-surface-hover" : ""}
                  ${striped && index % 2 === 1 ? "bg-background-secondary/50" : ""}
                  transition-colors
                `}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`
                      ${sizes.cell}
                      text-foreground-primary
                      ${column.hideOnMobile ? "hidden sm:table-cell" : ""}
                      ${column.cellClassName || ""}
                    `}
                  >
                    {getCellValue(item, column, index)}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Table cell helper components
export function TableCellText({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return (
    <span className={muted ? "text-foreground-tertiary" : "text-foreground-primary"}>
      {children}
    </span>
  );
}

export function TableCellLink({ 
  children, 
  onClick 
}: { 
  children: ReactNode; 
  onClick: () => void 
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
    >
      {children}
    </button>
  );
}

export default DataTable;
