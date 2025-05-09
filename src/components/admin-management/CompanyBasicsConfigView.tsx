"use client";

import { useEffect, useState } from "react";
import { useDepartments } from "@/hooks/useDepartments";
import DepartmentModal from "./departments/DepartmentModal";
import DepartmentDetailsModal from "./departments/DepartmentDetailsModal";
import { useDivisions } from "@/hooks/useDivisions";
import DivisionModal from "./divisions/DivisionModal";
import DivisionDetailsModal from "./divisions/DivisionDetailsModal";
import { useGrades } from "@/hooks/useGrades";
import GradeModal from "./grades/GradeModal";
import { usePositions } from "@/hooks/usePositions";
import PositionDetailsModal from "./positions/PositionDetailsModal";
import PositionModal from "./positions/PositionModal";

export default function CompanyBasicsConfigView({
  employees,
}: {
  employees: { id: number; name: string }[];
}) {
  const {
    divisions,
    fetchDivisions,
    createDivision,
    updateDivision,
    deleteDivision,
  } = useDivisions();
  const [viewDivision, setViewDivision] = useState<number | null>(null);
  const [editDivision, setEditDivision] = useState<number | null>(null);
  const [isCreatingDivision, setIsCreatingDivision] = useState(false);

  useEffect(() => {
    fetchDivisions();
  }, [fetchDivisions]);

  const handleCreateDivision = async (values: any) => {
    try {
      await createDivision(values);
      alert("Division created!");
      setIsCreatingDivision(false);
      fetchDivisions();
    } catch {
      alert("Error creating Division.");
    }
  };

  const handleUpdateDivision = async (values: any) => {
    try {
      await updateDivision(values);
      alert("Division updated!");
      setEditDivision(null);
      fetchDivisions();
    } catch {
      alert("Error updating Division.");
    }
  };

  const handleDeleteDivision = async (id: number) => {
    try {
      await deleteDivision(id);
      alert("Division deleted!");
      fetchDivisions();
    } catch {
      alert("Error deleting Division.");
    }
  };

  const selectedDivisionView = divisions.find((d) => d.id === viewDivision);
  const selectedDivisionEdit = divisions.find((d) => d.id === editDivision);

  //Department states and functions
  const {
    departments,
    fetchDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
  } = useDepartments();
  const [viewDepartment, setViewDepartment] = useState<number | null>(null);
  const [editDepartment, setEditDepartment] = useState<number | null>(null);
  const [isCreatingDepartment, setIsCreatingDepartment] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleCreateDepartment = async (values: any) => {
    try {
      await createDepartment(values);
      alert("Department created!");
      setIsCreatingDepartment(false);
      fetchDepartments();
    } catch {
      alert("Error creating department.");
    }
  };

  const handleUpdateDepartment = async (values: any) => {
    try {
      await updateDepartment(values);
      alert("Department updated!");
      setEditDepartment(null);
      fetchDepartments();
    } catch {
      alert("Error updating department.");
    }
  };

  const handleDeleteDepartment = async (id: number) => {
    try {
      await deleteDepartment(id);
      alert("Department deleted!");
      fetchDepartments();
    } catch {
      alert("Error deleting department.");
    }
  };

  const selectedDepartmentView = departments.find(
    (d) => d.id === viewDepartment
  );
  const selectedDepartmentEdit = departments.find(
    (d) => d.id === editDepartment
  );

  //Grade states and functions
  const { grades, fetchGrades, createGrade, deleteGrade } = useGrades();
  const [isCreatingGrade, setIsCreatingGrade] = useState(false);

  useEffect(() => {
    fetchGrades();
  }, [fetchGrades]);

  const handleCreateGrade = async (values: any) => {
    try {
      await createGrade(values);
      alert("Grade created!");
      setIsCreatingGrade(false);
      fetchGrades();
    } catch {
      alert("Error creating Grade.");
    }
  };

  const handleDeleteGrade = async (id: number) => {
    try {
      await deleteGrade(id);
      alert("Grade deleted!");
      fetchGrades();
    } catch {
      alert("Error deleting Grade.");
    }
  };

  //Department states and functions
  const {
    positions,
    fetchPositions,
    createPosition,
    updatePosition,
    deletePosition,
  } = usePositions();
  const [viewPosition, setViewPosition] = useState<number | null>(null);
  const [editPosition, setEditPosition] = useState<number | null>(null);
  const [isCreatingPosition, setIsCreatingPosition] = useState(false);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  const handleCreatePosition = async (values: any) => {
    try {
      await createPosition(values);
      alert("Position created!");
      setIsCreatingPosition(false);
      fetchPositions();
    } catch {
      alert("Error creating Position.");
    }
  };

  const handleUpdatePosition = async (values: any) => {
    try {
      await updatePosition(values);
      alert("Position updated!");
      setEditPosition(null);
      fetchPositions();
    } catch {
      alert("Error updating Position.");
    }
  };

  const handleDeletePosition = async (id: number) => {
    try {
      await deletePosition(id);
      alert("Position deleted!");
      fetchPositions();
    } catch {
      alert("Error deleting Position.");
    }
  };

  const selectedPositionView = positions.find((d) => d.id === viewPosition);
  const selectedPositionEdit = positions.find((d) => d.id === editPosition);
  return (
    <div>
      <div className="space-y-2">
        <div className="flex flex-col">
          <label className="block font-bold text-blue-800">Division</label>
        </div>

        <div className="grid grid-cols-1">
          {divisions.map((div) => (
            <div key={div.id} className="py-2 flex items-center gap-x-6">
              <div className="w-1/2 md:w-1/3 px-3 py-1 rounded-md bg-gray-300">
                {div.name}
              </div>

              <button
                onClick={() => setViewDivision(div.id)}
                className="w-1/2 md:w-1/3 px-3 py-1 rounded-md bg-gray-300 text-left"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() => setIsCreatingDivision(true)}
          type="button"
          className="text-white text-xl bg-blue-500 rounded-full w-7 h-7 grid place-items-center"
        >
          +
        </button>

        {isCreatingDivision && (
          <DivisionModal
            employees={employees}
            onSubmit={handleCreateDivision}
            onClose={() => setIsCreatingDivision(false)}
          />
        )}
        {selectedDivisionView && (
          <DivisionDetailsModal
            editDivision={() => setEditDivision(selectedDivisionView.id)}
            deleteDivision={() => handleDeleteDivision(selectedDivisionView.id)}
            employees={employees}
            division={selectedDivisionView}
            onClose={() => setViewDivision(null)}
          />
        )}
        {selectedDivisionEdit && (
          <DivisionModal
            employees={employees}
            initialData={selectedDivisionEdit}
            onSubmit={handleUpdateDivision}
            onClose={() => setEditDivision(null)}
          />
        )}
      </div>
      <div className="space-y-2 mt-8">
        <div className="flex flex-col">
          <label className="block font-bold text-blue-800 mb-2">
            Department
          </label>
        </div>

        <div className="grid grid-cols-1">
          {departments.map((dept) => (
            <div key={dept.id} className="py-2 flex items-center gap-x-6">
              <div className="w-1/2  md:w-1/3 px-3 py-1 rounded-md bg-gray-300">
                {dept.name}
              </div>

              <button
                onClick={() => setViewDepartment(dept.id)}
                className="w-1/2 md:w-1/3 px-3 py-1 rounded-md bg-gray-300 text-left"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() => setIsCreatingDepartment(true)}
          type="button"
          className="text-white text-xl bg-blue-500 rounded-full w-7 h-7 grid place-items-center"
        >
          +
        </button>

        {isCreatingDepartment && (
          <DepartmentModal
            employees={employees}
            divisions={divisions}
            onSubmit={handleCreateDepartment}
            onClose={() => setIsCreatingDepartment(false)}
          />
        )}
        {selectedDepartmentView && (
          <DepartmentDetailsModal
            divisions={divisions}
            editDepartment={() => setEditDepartment(selectedDepartmentView.id)}
            deleteDepartment={() =>
              handleDeleteDepartment(selectedDepartmentView.id)
            }
            employees={employees}
            department={selectedDepartmentView}
            onClose={() => setViewDepartment(null)}
          />
        )}
        {selectedDepartmentEdit && (
          <DepartmentModal
            employees={employees}
            divisions={divisions}
            initialData={selectedDepartmentEdit}
            onSubmit={handleUpdateDepartment}
            onClose={() => setEditDepartment(null)}
          />
        )}
      </div>
      <div className="space-y-2 mt-8">
        <label className="block font-bold text-blue-800 mb-2">Grade</label>
        <div className="flex flex-wrap gap-2">
          {grades.map((grade, idx) => (
            <div
              key={idx}
              className="flex items-center bg-blue-50 rounded-md px-3 py-1"
            >
              {grade.name}
              <button
                type="button"
                className="ml-2 text-blue-700"
                onClick={() => handleDeleteGrade(grade.id)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setIsCreatingGrade(true)}
          className="mt-2 text-white text-xl bg-blue-500 rounded-full w-7 h-7 grid place-items-center"
        >
          +
        </button>
        {isCreatingGrade && (
          <GradeModal
            onSubmit={handleCreateGrade}
            onClose={() => setIsCreatingGrade(false)}
          />
        )}
      </div>
      <div className="space-y-2 mt-8">
        <div className="flex flex-col">
          <label className="block font-bold text-blue-800 mb-2">Position</label>
        </div>

        <div className="grid grid-cols-1">
          {positions.map((position) => (
            <div key={position.id} className="py-2 flex items-center gap-x-6">
              <div className="w-1/2  md:w-1/3 px-3 py-1 rounded-md bg-gray-300">
                {position.name}
              </div>

              <button
                onClick={() => setViewPosition(position.id)}
                className="w-1/2 md:w-1/3 px-3 py-1 rounded-md bg-gray-300 text-left"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() => setIsCreatingPosition(true)}
          type="button"
          className="text-white text-xl bg-blue-500 rounded-full w-7 h-7 grid place-items-center"
        >
          +
        </button>

        {isCreatingPosition && (
          <PositionModal
            departments={departments}
            grades={grades}
            onSubmit={handleCreatePosition}
            onClose={() => setIsCreatingPosition(false)}
          />
        )}
        {selectedPositionView && (
          <PositionDetailsModal
            editPosition={() => setEditPosition(selectedPositionView.id)}
            deletePosition={() => handleDeletePosition(selectedPositionView.id)}
            position={selectedPositionView}
            onClose={() => setViewPosition(null)}
            departments={departments}
            grades={grades}
          />
        )}
        {selectedPositionEdit && (
          <PositionModal
            departments={departments}
            grades={grades}
            initialData={selectedPositionEdit}
            onSubmit={handleUpdatePosition}
            onClose={() => setEditPosition(null)}
          />
        )}
      </div>
    </div>
  );
}
