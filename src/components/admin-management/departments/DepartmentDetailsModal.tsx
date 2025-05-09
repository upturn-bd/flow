"use client";

import { Department } from "@/hooks/useDepartments";
import { Division } from "@/hooks/useDivisions";
import { PencilSimple, TrashSimple } from "@phosphor-icons/react";

interface DepartmentDetailsModalProps {
  department: Department;
  divisions: Division[];
  onClose: () => void;
  editDepartment: () => void;
  deleteDepartment: () => void;
  employees: { id: number; name: string }[];
}

export default function DepartmentDetailsModal({
  department,
  onClose,
  editDepartment,
  deleteDepartment,
  employees,
  divisions,
}: DepartmentDetailsModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Department Details</h2>

        <div className="space-y-2">
          <p>
            <strong>Name:</strong> {department?.name}
          </p>
          <p>
            <strong>Head:</strong>{" "}
            {
              employees?.filter(
                (employee) => employee.id == department.head_id
              )[0]?.name
            }
          </p>
          <p>
            <strong>Division ID:</strong>{" "}
            {
              divisions?.filter(
                (division) => division.id == department.division_id
              )[0]?.name
            }
          </p>
          <p>
            <strong>Description:</strong> {department?.description}
          </p>
        </div>

        <div className="flex justify-end pt-4">
          <button
            onClick={onClose}
            className="bg-[#FFC700] hover:bg-yellow-500 text-black px-4 py-2 rounded mr-4"
          >
            Close
          </button>
          <button onClick={editDepartment} className="p-2">
            <PencilSimple size={24} />
          </button>
          <button onClick={deleteDepartment} className="p-2">
            <TrashSimple className="text-red-600" size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
