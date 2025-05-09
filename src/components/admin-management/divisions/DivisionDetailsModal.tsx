"use client";

import { Division } from "@/hooks/useDivisions";
import { PencilSimple, TrashSimple } from "@phosphor-icons/react";

interface DivisionDetailsModalProps {
  division: Division;
  onClose: () => void;
  editDivision: () => void;
  deleteDivision: () => void;
  employees: { id: number; name: string }[];
}

export default function DivisionDetailsModal({
  division,
  onClose,
  employees,
  editDivision,
  deleteDivision,
}: DivisionDetailsModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Division Details</h2>

        <div className="space-y-2">
          <p>
            <strong>Name:</strong> {division?.name}
          </p>
          <p>
            <strong>Head:</strong>
            {
              employees?.filter(
                (employee) => employee.id == division.head_id
              )[0]?.name
            }
          </p>
        </div>
        <div className="flex justify-end pt-4">
          <button
            onClick={onClose}
            className="bg-[#FFC700] hover:bg-yellow-500 text-black px-4 py-2 rounded mr-4"
          >
            Close
          </button>
          <button
            onClick={editDivision}
            className="p-2"
          >
            <PencilSimple size={24} />
          </button>
          <button
            onClick={deleteDivision}
            className="p-2"
          >
           <TrashSimple className="text-red-600" size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
