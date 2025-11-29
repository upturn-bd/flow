"use client";

import React from "react";

interface ComplaintsTableProps {
  complaints: any[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export default function ComplaintsTable({
  complaints,
  onEdit,
  onDelete,
}: ComplaintsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border-primary">
        <thead className="bg-background-secondary dark:bg-background-tertiary">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-foreground-tertiary uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-foreground-tertiary uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-surface-primary divide-y divide-border-primary">
          {complaints.map((complaint) => (
            <tr key={complaint.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground-tertiary">
                {complaint.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground-tertiary space-x-2">
                <button
                  onClick={() => onEdit(complaint.id)}
                  className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(complaint.id)}
                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 