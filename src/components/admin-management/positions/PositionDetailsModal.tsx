"use client";

import { Department } from "@/hooks/useDepartments";
import { Grade } from "@/hooks/useGrades";
import { Position } from "@/hooks/usePositions";
import { PencilSimple, TrashSimple } from "@phosphor-icons/react";

interface PositionDetailsModalProps {
  position: Position;
  onClose: () => void;
  editPosition: () => void;
  deletePosition: () => void;
  departments: Department[];
  grades: Grade[];
}

export default function PositionDetailsModal({
  position,
  onClose,
  departments,
  editPosition,
  deletePosition,
  grades,
}: PositionDetailsModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Position Details</h2>

        <div className="space-y-2">
          <p>
            <strong>Name:</strong> {position?.name}
          </p>
          <p>
            <strong>Department:</strong>
            {
              departments?.filter((dep) => dep.id == position.department_id)[0]
                ?.name
            }
          </p>
          <p>
            <strong>Grade:</strong>
            {grades?.filter((grade) => grade.id == position.grade)[0]?.name}
          </p>
          <p>
            <strong>Description:</strong> {position?.description}
          </p>
        </div>
        <div className="flex justify-end pt-4">
          <button
            onClick={onClose}
            className="bg-[#FFC700] hover:bg-yellow-500 text-black px-4 py-2 rounded mr-4"
          >
            Close
          </button>
          <button onClick={editPosition} className="p-2">
            <PencilSimple size={24} />
          </button>
          <button onClick={deletePosition} className="p-2">
            <TrashSimple className="text-red-600" size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
