"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Import all the hooks we need
import { useDepartments } from "@/hooks/useDepartments";
import { useDivisions } from "@/hooks/useDivisions";
import { useGrades } from "@/hooks/useGrades";
import { usePositions } from "@/hooks/usePositions";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";

// Types for our context
interface AdminDataContextType {
  // Data
  departments: any[];
  divisions: any[];
  grades: any[];
  positions: any[];
  employees: any[];
  companyInfo: any | null;
  countries: any[];
  industries: any[];

  // Loading states
  loading: boolean;
  departmentsLoading: boolean;
  divisionsLoading: boolean;
  gradesLoading: boolean;
  positionsLoading: boolean;
  companyLoading: boolean;

  // Error states
  error: string | null;
  departmentError: string | null;
  divisionError: string | null;
  gradeError: string | null;
  positionError: string | null;
  companyError: string | null;

  // CRUD functions for departments
  createDepartment: (data: any) => Promise<any>;
  updateDepartment: (id: number, data: any) => Promise<any>;
  deleteDepartment: (id: number) => Promise<any>;

  // CRUD functions for divisions
  createDivision: (data: any) => Promise<any>;
  updateDivision: (id: string, data: any) => Promise<any>;
  deleteDivision: (id: string) => Promise<any>;

  // CRUD functions for grades
  createGrade: (data: any) => Promise<any>;
  updateGrade: (id: string, data: any) => Promise<any>;
  deleteGrade: (id: string) => Promise<any>;

  // CRUD functions for positions
  createPosition: (data: any) => Promise<any>;
  updatePosition: (id: string, data: any) => Promise<any>;
  deletePosition: (id: string) => Promise<any>;

  // Utility functions
  refreshAll: () => Promise<void>;
  refreshDepartments: () => Promise<any>;
  refreshDivisions: () => Promise<any>;
  refreshGrades: () => Promise<any>;
  refreshPositions: () => Promise<any>;
  refreshCompanyInfo: () => Promise<any>;
  updateCompanySettings: (settings: any) => Promise<any>;

  // Computed properties
  isSetupComplete: boolean;
  entityStatus: {
    departments: boolean;
    divisions?: boolean;
    grades: boolean;
    positions: boolean;
  };
}

const AdminDataContext = createContext<AdminDataContextType | undefined>(undefined);

interface AdminDataProviderProps {
  children: ReactNode;
}

export function AdminDataProvider({ children }: AdminDataProviderProps) {
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Use all the hooks
  const {
    departments,
    fetchDepartments,
    createDepartment: createDept,
    updateDepartment: updateDept,
    deleteDepartment: deleteDept,
    loading: departmentsLoading,
    error: departmentError,
  } = useDepartments();

  const {
    divisions,
    fetchDivisions,
    createDivision: createDiv,
    updateDivision: updateDiv,
    deleteDivision: deleteDiv,
    loading: divisionsLoading,
    error: divisionError,
  } = useDivisions();

  const {
    grades,
    fetchGrades,
    createGrade: createGrd,
    updateGrade: updateGrd,
    deleteGrade: deleteGrd,
    loading: gradesLoading,
    error: gradeError,
  } = useGrades();

  const {
    positions,
    fetchPositions,
    createPosition: createPos,
    updatePosition: updatePos,
    deletePosition: deletePos,
    loading: positionsLoading,
    error: positionError,
  } = usePositions();

  const {
    companyInfo,
    countries,
    industries,
    employees,
    fetchCompanyInfo,
    updateCompanySettings,
    loading: companyLoading,
    error: companyError,
  } = useCompanyInfo();

  // Overall loading state
  const loading = companyLoading;

  // Computed properties
  const isSetupComplete =
    departments.length > 0 &&
    grades.length > 0 &&
    positions.length > 0 &&
    (companyInfo?.has_division ? divisions.length > 0 : true);

  let entityStatus: {
    departments: boolean;
    divisions?: boolean;
    grades: boolean;
    positions: boolean;
  };

  if (companyInfo?.has_division) {
    entityStatus = {
      divisions: divisions.length > 0,
      departments: departments.length > 0,
      grades: grades.length > 0,
      positions: positions.length > 0,
    };
  } else {
    entityStatus = {
      departments: departments.length > 0,
      grades: grades.length > 0,
      positions: positions.length > 0,
    };
  }




  // Load all data on mount
  useEffect(() => {
    const loadAllData = async () => {
      try {
        await Promise.all([
          fetchDepartments(),
          fetchDivisions(),
          fetchGrades(),
          fetchPositions(),
          fetchCompanyInfo(),
        ]);
      } catch (error) {
        console.error('Failed to load admin data:', error);
        setGlobalError(error instanceof Error ? error.message : 'Failed to load data');
      }
    };

    loadAllData();
  }, []);

  // Refresh functions
  const refreshAll = useCallback(async () => {
    try {
      await Promise.all([
        fetchDepartments(),
        fetchDivisions(),
        fetchGrades(),
        fetchPositions(),
        fetchCompanyInfo(),
      ]);
    } catch (error) {
      console.error('Failed to refresh data:', error);
      setGlobalError(error instanceof Error ? error.message : 'Failed to refresh data');
    }
  }, [fetchDepartments, fetchDivisions, fetchGrades, fetchPositions, fetchCompanyInfo]);

  // Optimistic CRUD functions for departments
  const createDepartment = useCallback(async (data: any) => {
    try {
      const result = await createDept(data);
      return result;
    } catch (error) {
      console.error('Failed to create department:', error);
      throw error;
    }
  }, [createDept]);

  const updateDepartment = useCallback(async (id: number, data: any) => {
    try {
      const result = await updateDept(id, data);
      return result;
    } catch (error) {
      console.error('Failed to update department:', error);
      throw error;
    }
  }, [updateDept]);

  const deleteDepartment = useCallback(async (id: number) => {
    try {
      const result = await deleteDept(id);
      return result;
    } catch (error) {
      console.error('Failed to delete department:', error);
      throw error;
    }
  }, [deleteDept]);

  // Optimistic CRUD functions for divisions
  const createDivision = useCallback(async (data: any) => {
    try {
      const result = await createDiv(data);
      return result;
    } catch (error) {
      console.error('Failed to create division:', error);
      throw error;
    }
  }, [createDiv]);

  const updateDivision = useCallback(async (id: string, data: any) => {
    try {
      const result = await updateDiv(id, data);
      return result;
    } catch (error) {
      console.error('Failed to update division:', error);
      throw error;
    }
  }, [updateDiv]);

  const deleteDivision = useCallback(async (id: string) => {
    try {
      const result = await deleteDiv(id);
      return result;
    } catch (error) {
      console.error('Failed to delete division:', error);
      throw error;
    }
  }, [deleteDiv]);

  // Optimistic CRUD functions for grades
  const createGrade = useCallback(async (data: any) => {
    try {
      const result = await createGrd(data);
      return result;
    } catch (error) {
      console.error('Failed to create grade:', error);
      throw error;
    }
  }, [createGrd]);

  const updateGrade = useCallback(async (id: string, data: any) => {
    try {
      const result = await updateGrd(id, data);
      return result;
    } catch (error) {
      console.error('Failed to update grade:', error);
      throw error;
    }
  }, [updateGrd]);

  const deleteGrade = useCallback(async (id: string) => {
    try {
      const result = await deleteGrd(id);
      return result;
    } catch (error) {
      console.error('Failed to delete grade:', error);
      throw error;
    }
  }, [deleteGrd]);

  // Optimistic CRUD functions for positions
  const createPosition = useCallback(async (data: any) => {
    try {
      const result = await createPos(data);
      return result;
    } catch (error) {
      console.error('Failed to create position:', error);
      throw error;
    }
  }, [createPos]);

  const updatePosition = useCallback(async (id: string, data: any) => {
    try {
      const result = await updatePos(id, data);
      return result;
    } catch (error) {
      console.error('Failed to update position:', error);
      throw error;
    }
  }, [updatePos]);

  const deletePosition = useCallback(async (id: string) => {
    try {
      const result = await deletePos(id);
      return result;
    } catch (error) {
      console.error('Failed to delete position:', error);
      throw error;
    }
  }, [deletePos]);

  const contextValue: AdminDataContextType = {
    // Data
    departments,
    divisions,
    grades,
    positions,
    employees,
    companyInfo,
    countries,
    industries,

    // Loading states
    loading,
    departmentsLoading,
    divisionsLoading,
    gradesLoading,
    positionsLoading,
    companyLoading,

    // Error states
    error: globalError,
    departmentError,
    divisionError,
    gradeError,
    positionError,
    companyError,

    // CRUD functions
    createDepartment,
    updateDepartment,
    deleteDepartment,
    createDivision,
    updateDivision,
    deleteDivision,
    createGrade,
    updateGrade,
    deleteGrade,
    createPosition,
    updatePosition,
    deletePosition,

    // Utility functions
    refreshAll,
    refreshDepartments: fetchDepartments,
    refreshDivisions: fetchDivisions,
    refreshGrades: fetchGrades,
    refreshPositions: fetchPositions,
    refreshCompanyInfo: fetchCompanyInfo,
    updateCompanySettings,

    // Computed properties
    isSetupComplete,
    entityStatus,
  };

  return (
    <AdminDataContext.Provider value={contextValue}>
      {children}
    </AdminDataContext.Provider>
  );
}

// Hook to use the admin data context
export function useAdminData() {
  const context = useContext(AdminDataContext);
  if (context === undefined) {
    throw new Error('useAdminData must be used within an AdminDataProvider');
  }
  return context;
}
