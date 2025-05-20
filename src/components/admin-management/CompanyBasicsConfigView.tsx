"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { getEmployeesInfo } from "@/lib/api/admin-management/inventory";
import { 
  Building, 
  Users, 
  Layers, 
  GraduationCap, 
  BriefcaseBusiness, 
  Plus, 
  Eye, 
  X, 
  Info 
} from "lucide-react";
import { fadeIn, fadeInUp, staggerContainer } from "@/components/ui/animations";

// Add prop type
type CompanyBasicsConfigViewProps = {
  employees: { id: number; name: string }[];
};

export default function CompanyBasicsConfigView({ employees }: CompanyBasicsConfigViewProps) {
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
      setIsCreatingDivision(false);
      fetchDivisions();
      showNotification("Division created successfully");
    } catch {
      showNotification("Error creating Division", true);
    }
  };

  const handleUpdateDivision = async (values: any) => {
    try {
      await updateDivision(values);
      setEditDivision(null);
      fetchDivisions();
      showNotification("Division updated successfully");
    } catch {
      showNotification("Error updating Division", true);
    }
  };

  const handleDeleteDivision = async (id: number) => {
    try {
      await deleteDivision(id);
      showNotification("Division deleted successfully");
      fetchDivisions();
    } catch {
      showNotification("Error deleting Division", true);
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
      setIsCreatingDepartment(false);
      fetchDepartments();
      showNotification("Department created successfully");
    } catch {
      showNotification("Error creating department", true);
    }
  };

  const handleUpdateDepartment = async (values: any) => {
    try {
      await updateDepartment(values);
      setEditDepartment(null);
      fetchDepartments();
      showNotification("Department updated successfully");
    } catch {
      showNotification("Error updating department", true);
    }
  };

  const handleDeleteDepartment = async (id: number) => {
    try {
      await deleteDepartment(id);
      showNotification("Department deleted successfully");
      fetchDepartments();
    } catch {
      showNotification("Error deleting department", true);
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
      setIsCreatingGrade(false);
      fetchGrades();
      showNotification("Grade created successfully");
    } catch {
      showNotification("Error creating Grade", true);
    }
  };

  const handleDeleteGrade = async (id: number) => {
    try {
      await deleteGrade(id);
      showNotification("Grade deleted successfully");
      fetchGrades();
    } catch {
      showNotification("Error deleting Grade", true);
    }
  };

  //Position states and functions
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
      setIsCreatingPosition(false);
      fetchPositions();
      showNotification("Position created successfully");
    } catch {
      showNotification("Error creating Position", true);
    }
  };

  const handleUpdatePosition = async (values: any) => {
    try {
      await updatePosition(values);
      setEditPosition(null);
      fetchPositions();
      showNotification("Position updated successfully");
    } catch {
      showNotification("Error updating Position", true);
    }
  };

  const handleDeletePosition = async (id: number) => {
    try {
      await deletePosition(id);
      showNotification("Position deleted successfully");
      fetchPositions();
    } catch {
      showNotification("Error deleting Position", true);
    }
  };

  const selectedPositionView = positions.find((d) => d.id === viewPosition);
  const selectedPositionEdit = positions.find((d) => d.id === editPosition);

  // Notification state
  const [notification, setNotification] = useState<{ message: string; isError: boolean; visible: boolean }>({
    message: '',
    isError: false,
    visible: false
  });

  const showNotification = (message: string, isError = false) => {
    setNotification({ message, isError, visible: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {/* Notification */}
      <AnimatePresence>
        {notification.visible && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 ${
              notification.isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}
          >
            {notification.isError ? <X className="h-5 w-5" /> : <Info className="h-5 w-5" />}
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Divisions Section */}
      <motion.section 
        variants={fadeInUp}
        className="mb-8"
      >
        <div className="border-b border-gray-200 pb-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <Layers className="w-5 h-5 mr-2 text-blue-600" />
            Divisions
          </h3>
          <p className="text-sm text-gray-600">Manage organization divisions</p>
        </div>

        <div className="space-y-3">
          {divisions.length === 0 ? (
            <div className="p-6 bg-gray-50 rounded-lg text-center text-gray-500">
              No divisions added yet. Click the plus button to add one.
            </div>
          ) : (
            divisions.map((div) => (
              <motion.div 
                key={div.id} 
                className="bg-white rounded-lg border border-gray-200 p-3 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow duration-200"
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-3">
                    <Layers size={16} />
                  </div>
                  <span className="font-medium text-gray-800">{div.name}</span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewDivision(div.id)}
                  className="px-3 py-1.5 rounded-md bg-blue-50 text-blue-600 text-sm flex items-center gap-1 hover:bg-blue-100 transition-colors"
                >
                  <Eye size={14} />
                  Details
                </motion.button>
              </motion.div>
            ))
          )}
        </div>
        
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsCreatingDivision(true)}
          className="mt-4 flex items-center justify-center text-white bg-blue-600 rounded-full w-8 h-8 shadow-sm hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
        </motion.button>

        <AnimatePresence>
          {isCreatingDivision && (
            <DivisionModal
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
              initialData={selectedDivisionEdit}
              onSubmit={handleUpdateDivision}
              onClose={() => setEditDivision(null)}
            />
          )}
        </AnimatePresence>
      </motion.section>

      {/* Departments Section */}
      <motion.section 
        variants={fadeInUp}
        className="mb-8"
      >
        <div className="border-b border-gray-200 pb-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <Building className="w-5 h-5 mr-2 text-indigo-600" />
            Departments
          </h3>
          <p className="text-sm text-gray-600">Manage organization departments</p>
        </div>

        <div className="space-y-3">
          {departments.length === 0 ? (
            <div className="p-6 bg-gray-50 rounded-lg text-center text-gray-500">
              No departments added yet. Click the plus button to add one.
            </div>
          ) : (
            departments.map((dept) => (
              <motion.div 
                key={dept.id} 
                className="bg-white rounded-lg border border-gray-200 p-3 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow duration-200"
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mr-3">
                    <Building size={16} />
                  </div>
                  <span className="font-medium text-gray-800">{dept.name}</span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewDepartment(dept.id)}
                  className="px-3 py-1.5 rounded-md bg-indigo-50 text-indigo-600 text-sm flex items-center gap-1 hover:bg-indigo-100 transition-colors"
                >
                  <Eye size={14} />
                  Details
                </motion.button>
              </motion.div>
            ))
          )}
        </div>
        
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsCreatingDepartment(true)}
          className="mt-4 flex items-center justify-center text-white bg-indigo-600 rounded-full w-8 h-8 shadow-sm hover:bg-indigo-700 transition-colors"
        >
          <Plus size={18} />
        </motion.button>

        <AnimatePresence>
          {isCreatingDepartment && (
            <DepartmentModal
              divisions={divisions}
              onSubmit={handleCreateDepartment}
              onClose={() => setIsCreatingDepartment(false)}
            />
          )}
          {selectedDepartmentView && (
            <DepartmentDetailsModal
              divisions={divisions}
              editDepartment={() => setEditDepartment(selectedDepartmentView.id)}
              deleteDepartment={() => handleDeleteDepartment(selectedDepartmentView.id)}
              employees={employees}
              department={selectedDepartmentView}
              onClose={() => setViewDepartment(null)}
            />
          )}
          {selectedDepartmentEdit && (
            <DepartmentModal
              divisions={divisions}
              initialData={selectedDepartmentEdit}
              onSubmit={handleUpdateDepartment}
              onClose={() => setEditDepartment(null)}
            />
          )}
        </AnimatePresence>
      </motion.section>

      {/* Grades Section */}
      <motion.section 
        variants={fadeInUp}
        className="mb-8"
      >
        <div className="border-b border-gray-200 pb-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <GraduationCap className="w-5 h-5 mr-2 text-green-600" />
            Grades
          </h3>
          <p className="text-sm text-gray-600">Manage employee grades and levels</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {grades.length === 0 ? (
            <div className="p-6 bg-gray-50 rounded-lg text-center text-gray-500 w-full">
              No grades added yet. Click the plus button to add one.
            </div>
          ) : (
            grades.map((grade) => (
              <motion.div
                key={grade.id}
                className="flex items-center bg-green-50 border border-green-100 rounded-md px-3 py-2 shadow-sm"
                whileHover={{ scale: 1.05 }}
              >
                <GraduationCap className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-gray-800">{grade.name}</span>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="ml-2 text-green-600 hover:text-green-800 transition-colors"
                  onClick={() => handleDeleteGrade(grade.id)}
                >
                  <X size={14} />
                </motion.button>
              </motion.div>
            ))
          )}
        </div>
        
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsCreatingGrade(true)}
          className="mt-4 flex items-center justify-center text-white bg-green-600 rounded-full w-8 h-8 shadow-sm hover:bg-green-700 transition-colors"
        >
          <Plus size={18} />
        </motion.button>

        <AnimatePresence>
          {isCreatingGrade && (
            <GradeModal
              onSubmit={handleCreateGrade}
              onClose={() => setIsCreatingGrade(false)}
            />
          )}
        </AnimatePresence>
      </motion.section>

      {/* Positions Section */}
      <motion.section 
        variants={fadeInUp}
        className="mb-8"
      >
        <div className="border-b border-gray-200 pb-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <BriefcaseBusiness className="w-5 h-5 mr-2 text-purple-600" />
            Positions
          </h3>
          <p className="text-sm text-gray-600">Manage job positions and roles</p>
        </div>

        <div className="space-y-3">
          {positions.length === 0 ? (
            <div className="p-6 bg-gray-50 rounded-lg text-center text-gray-500">
              No positions added yet. Click the plus button to add one.
            </div>
          ) : (
            positions.map((position) => (
              <motion.div 
                key={position.id} 
                className="bg-white rounded-lg border border-gray-200 p-3 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow duration-200"
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mr-3">
                    <BriefcaseBusiness size={16} />
                  </div>
                  <span className="font-medium text-gray-800">{position.name}</span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewPosition(position.id)}
                  className="px-3 py-1.5 rounded-md bg-purple-50 text-purple-600 text-sm flex items-center gap-1 hover:bg-purple-100 transition-colors"
                >
                  <Eye size={14} />
                  Details
                </motion.button>
              </motion.div>
            ))
          )}
        </div>
        
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsCreatingPosition(true)}
          className="mt-4 flex items-center justify-center text-white bg-purple-600 rounded-full w-8 h-8 shadow-sm hover:bg-purple-700 transition-colors"
        >
          <Plus size={18} />
        </motion.button>

        <AnimatePresence>
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
        </AnimatePresence>
      </motion.section>
    </motion.div>
  );
}
