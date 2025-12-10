"use client";

import { SearchBar } from "@/components/ui";
import { SelectField } from "@/components/forms";
import { StakeholderIssueCategory } from "@/lib/types/schemas";

export type TicketStatusFilter = "all" | "Pending" | "In Progress" | "Resolved";
export type TicketPriorityFilter = "all" | "Low" | "Medium" | "High" | "Urgent";
export type TicketCategoryFilter = number | "all";

export interface TicketFiltersProps {
  /** Current search term */
  searchTerm: string;
  /** Called when search term changes */
  onSearchChange: (value: string) => void;
  /** Current status filter value */
  statusFilter: TicketStatusFilter;
  /** Called when status filter changes */
  onStatusFilterChange: (value: TicketStatusFilter) => void;
  /** Current priority filter value */
  priorityFilter: TicketPriorityFilter;
  /** Called when priority filter changes */
  onPriorityFilterChange: (value: TicketPriorityFilter) => void;
  /** Current category filter value */
  categoryFilter: TicketCategoryFilter;
  /** Called when category filter changes */
  onCategoryFilterChange: (value: TicketCategoryFilter) => void;
  /** Available categories to filter by */
  categories: StakeholderIssueCategory[];
  /** Placeholder text for search input */
  searchPlaceholder?: string;
  /** Whether to show the status filter dropdown */
  showStatusFilter?: boolean;
  /** Additional class names */
  className?: string;
}

export function TicketFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  categories,
  searchPlaceholder = "Search tickets...",
  showStatusFilter = true,
  className = "",
}: TicketFiltersProps) {
  return (
    <div className={`bg-surface-primary rounded-lg border border-border-primary p-4 ${className}`}>
      <div className="flex flex-col gap-4">
        {/* Search */}
        <SearchBar
          value={searchTerm}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
          withContainer={false}
        />

        {/* Filter Row */}
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          {/* Status Filter */}
          {showStatusFilter && (
            <SelectField
              name="filterStatus"
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value as TicketStatusFilter)}
              options={[
                { value: "all", label: "All Statuses" },
                { value: "Pending", label: "Pending" },
                { value: "In Progress", label: "In Progress" },
                { value: "Resolved", label: "Resolved" },
              ]}
              containerClassName="w-full sm:w-48"
            />
          )}

          {/* Priority Filter */}
          <SelectField
            name="filterPriority"
            value={priorityFilter}
            onChange={(e) => onPriorityFilterChange(e.target.value as TicketPriorityFilter)}
            options={[
              { value: "all", label: "All Priorities" },
              { value: "Low", label: "Low" },
              { value: "Medium", label: "Medium" },
              { value: "High", label: "High" },
              { value: "Urgent", label: "Urgent" },
            ]}
            containerClassName="w-full sm:w-48"
          />

          {/* Category Filter */}
          <SelectField
            name="filterCategory"
            value={categoryFilter.toString()}
            onChange={(e) =>
              onCategoryFilterChange(e.target.value === "all" ? "all" : parseInt(e.target.value))
            }
            options={[
              { value: "all", label: "All Categories" },
              ...categories
                .filter((c) => c.is_active)
                .map((cat) => ({
                  value: cat.id?.toString() || "",
                  label: cat.name,
                })),
            ]}
            containerClassName="w-full sm:w-48"
          />
        </div>
      </div>
    </div>
  );
}

export default TicketFilters;
