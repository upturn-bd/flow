"use client";

import { CaretLeft, CaretRight } from "@phosphor-icons/react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  className = "",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className={`flex items-center justify-between px-4 py-3 bg-surface-primary border-t border-border-primary rounded-b-lg ${className}`}>
      <div className="flex items-center text-sm text-foreground-secondary">
        Showing {startItem} to {endItem} of {totalCount} items
      </div>
      
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 text-sm border border-border-primary rounded-lg hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-foreground-primary"
        >
          <CaretLeft size={16} weight="bold" />
          Previous
        </button>
        
        <div className="flex items-center space-x-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`px-3 py-1 text-sm min-w-[32px] border rounded-lg ${
                  currentPage === pageNum
                    ? "bg-primary-600 text-white border-primary-600"
                    : "border-border-primary hover:bg-surface-hover text-foreground-primary"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 text-sm border border-border-primary rounded-lg hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-foreground-primary"
        >
          Next
          <CaretRight size={16} weight="bold" />
        </button>
      </div>
    </div>
  );
}
