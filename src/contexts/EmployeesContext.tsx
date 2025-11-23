"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
  useMemo,
} from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import type { Employee } from "@/lib/types/schemas";
import {
  LoadingStates,
  ErrorStates,
  MutationResponse,
} from "./types";
import {
  devLog,
  createInitialLoadingStates,
  createInitialErrorStates,
  createSuccessResponse,
  createErrorResponse,
  extractErrorMessage,
  validateCompanyId,
  optimisticAdd,
  optimisticUpdate,
  optimisticRemove,
} from "./utils";

// Extended employee type for specific use cases
export interface ExtendedEmployee extends Employee {
  role?: string;
  phone?: string;
  joinDate?: string;
  basic_salary?: number;
}

interface EmployeesContextType {
  // Data
  employees: Employee[];
  extendedEmployees: ExtendedEmployee[];
  
  // Loading states
  loading: LoadingStates;
  
  // Error states
  error: ErrorStates;
  
  // Initialization state
  initialized: boolean;
  
  // Fetch operations
  fetchEmployees: (forceRefresh?: boolean) => Promise<Employee[]>;
  fetchExtendedEmployees: (forceRefresh?: boolean) => Promise<ExtendedEmployee[]>;
  
  // CRUD operations (optimistic)
  createEmployee: (data: Partial<Employee>) => Promise<MutationResponse<Employee>>;
  updateEmployee: (
    id: string | number,
    data: Partial<Employee>
  ) => Promise<MutationResponse<Employee>>;
  deleteEmployee: (id: string | number) => Promise<MutationResponse<boolean>>;
  
  // Utility functions
  getEmployeeById: (id: string | number) => Employee | undefined;
  clearErrors: () => void;
  refresh: () => Promise<void>;
}

const EmployeesContext = createContext<EmployeesContextType | undefined>(
  undefined
);

interface EmployeesProviderProps {
  children: ReactNode;
  autoFetch?: boolean; // Auto-fetch on mount
}

export function EmployeesProvider({
  children,
  autoFetch = true,
}: EmployeesProviderProps) {
  const { employeeInfo } = useAuth();
  const companyId = employeeInfo?.company_id;

  // State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [extendedEmployees, setExtendedEmployees] = useState<ExtendedEmployee[]>([]);
  const [loading, setLoading] = useState<LoadingStates>(createInitialLoadingStates());
  const [error, setError] = useState<ErrorStates>(createInitialErrorStates());
  const [initialized, setInitialized] = useState(false);

  // Auto-fetch on first access when company_id is available
  useEffect(() => {
    if (autoFetch && companyId && !initialized) {
      devLog.action("EmployeesContext", "Auto-fetching employees");
      fetchEmployees();
    }
  }, [companyId, autoFetch, initialized]);

  // Fetch employees (basic)
  const fetchEmployees = useCallback(
    async (forceRefresh = false): Promise<Employee[]> => {
      // Return cached data if available and not forcing refresh
      if (!forceRefresh && initialized && employees.length > 0) {
        devLog.action("EmployeesContext", "Returning cached employees");
        return employees;
      }

      try {
        const validCompanyId = validateCompanyId(companyId);
        
        setLoading((prev) => ({ ...prev, fetching: true }));
        setError((prev) => ({ ...prev, fetchError: null }));

        devLog.action("EmployeesContext", "Fetching employees", {
          companyId: validCompanyId,
        });

        const { data, error: fetchError } = await supabase
          .from("employees")
          .select("id, first_name, last_name, email, designation, department_id(name)")
          .eq("company_id", validCompanyId)
          .eq("job_status", "Active");

        if (fetchError) throw fetchError;

        const formattedEmployees: Employee[] =
          data?.map((employee) => ({
            id: employee.id,
            name: `${employee.first_name} ${employee.last_name}`,
            email: employee.email,
            designation: employee.designation || undefined,
            department:
              (employee.department_id as unknown as { name: string })?.name ||
              undefined,
          })) || [];

        setEmployees(formattedEmployees);
        setInitialized(true);

        devLog.state("EmployeesContext", {
          count: formattedEmployees.length,
        });

        return formattedEmployees;
      } catch (err) {
        const errorMessage = extractErrorMessage(err);
        devLog.error("EmployeesContext", errorMessage);
        setError((prev) => ({ ...prev, fetchError: errorMessage }));
        return [];
      } finally {
        setLoading((prev) => ({ ...prev, fetching: false }));
      }
    },
    [companyId, initialized, employees]
  );

  // Fetch extended employees (with additional fields)
  const fetchExtendedEmployees = useCallback(
    async (forceRefresh = false): Promise<ExtendedEmployee[]> => {
      // Return cached data if available and not forcing refresh
      if (!forceRefresh && initialized && extendedEmployees.length > 0) {
        devLog.action("EmployeesContext", "Returning cached extended employees");
        return extendedEmployees;
      }

      try {
        const validCompanyId = validateCompanyId(companyId);
        
        setLoading((prev) => ({ ...prev, fetching: true }));
        setError((prev) => ({ ...prev, fetchError: null }));

        devLog.action("EmployeesContext", "Fetching extended employees", {
          companyId: validCompanyId,
        });

        const { data, error: fetchError } = await supabase
          .from("employees")
          .select(
            "id, first_name, last_name, email, phone_number, department_id(name), designation, hire_date, basic_salary"
          )
          .eq("company_id", validCompanyId);

        if (fetchError) throw fetchError;

        const formattedEmployees: ExtendedEmployee[] =
          data?.map((employee) => ({
            id: employee.id,
            name: `${employee.first_name} ${employee.last_name}`,
            email: employee.email,
            designation: employee.designation || undefined,
            department:
              (employee.department_id as unknown as { name: string })?.name ||
              undefined,
            phone: employee.phone_number,
            joinDate: employee.hire_date,
            basic_salary: employee.basic_salary,
          })) || [];

        setExtendedEmployees(formattedEmployees);
        setInitialized(true);

        devLog.state("EmployeesContext", {
          count: formattedEmployees.length,
        });

        return formattedEmployees;
      } catch (err) {
        const errorMessage = extractErrorMessage(err);
        devLog.error("EmployeesContext", errorMessage);
        setError((prev) => ({ ...prev, fetchError: errorMessage }));
        return [];
      } finally {
        setLoading((prev) => ({ ...prev, fetching: false }));
      }
    },
    [companyId, initialized, extendedEmployees]
  );

  // Create employee with optimistic update
  const createEmployee = useCallback(
    async (data: Partial<Employee>): Promise<MutationResponse<Employee>> => {
      try {
        const validCompanyId = validateCompanyId(companyId);
        
        setLoading((prev) => ({ ...prev, creating: true }));
        setError((prev) => ({ ...prev, createError: null }));

        const createData = {
          ...data,
          company_id: validCompanyId,
        };

        devLog.action("EmployeesContext", "Creating employee", createData);

        const { data: newEmployee, error: createError } = await supabase
          .from("employees")
          .insert(createData)
          .select()
          .single();

        if (createError) throw createError;

        // Update state only on success
        const formattedEmployee: Employee = {
          id: newEmployee.id,
          name: `${newEmployee.first_name} ${newEmployee.last_name}`,
          email: newEmployee.email,
          designation: newEmployee.designation || undefined,
        };

        setEmployees((prev) => [...prev, formattedEmployee]);

        devLog.action("EmployeesContext", "Employee created successfully", {
          id: newEmployee.id,
        });

        return createSuccessResponse(formattedEmployee);
      } catch (err) {
        const errorMessage = extractErrorMessage(err);
        devLog.error("EmployeesContext", errorMessage);
        setError((prev) => ({ ...prev, createError: errorMessage }));
        return createErrorResponse(errorMessage);
      } finally {
        setLoading((prev) => ({ ...prev, creating: false }));
      }
    },
    [companyId]
  );

  // Update employee with optimistic update and rollback on failure
  const updateEmployee = useCallback(
    async (
      id: string | number,
      data: Partial<Employee>
    ): Promise<MutationResponse<Employee>> => {
      // Store previous state for rollback
      const previousEmployees = [...employees];

      try {
        setLoading((prev) => ({ ...prev, updating: true }));
        setError((prev) => ({ ...prev, updateError: null }));

        // Optimistic update
        setEmployees((prev) =>
          prev.map((emp) => (emp.id === id ? { ...emp, ...data } : emp))
        );

        devLog.action("EmployeesContext", "Updating employee", { id, data });

        const { data: updatedEmployee, error: updateError } = await supabase
          .from("employees")
          .update(data)
          .eq("id", id)
          .select()
          .single();

        if (updateError) throw updateError;

        // Update with server response
        const formattedEmployee: Employee = {
          id: updatedEmployee.id,
          name: `${updatedEmployee.first_name} ${updatedEmployee.last_name}`,
          email: updatedEmployee.email,
          designation: updatedEmployee.designation || undefined,
        };

        setEmployees((prev) =>
          prev.map((emp) => (emp.id === id ? formattedEmployee : emp))
        );

        devLog.action("EmployeesContext", "Employee updated successfully", {
          id,
        });

        return createSuccessResponse(formattedEmployee);
      } catch (err) {
        const errorMessage = extractErrorMessage(err);
        devLog.error("EmployeesContext", errorMessage);
        
        // Rollback on failure
        setEmployees(previousEmployees);
        setError((prev) => ({ ...prev, updateError: errorMessage }));
        
        return createErrorResponse(errorMessage);
      } finally {
        setLoading((prev) => ({ ...prev, updating: false }));
      }
    },
    [employees]
  );

  // Delete employee with optimistic update and rollback on failure
  const deleteEmployee = useCallback(
    async (id: string | number): Promise<MutationResponse<boolean>> => {
      // Store previous state for rollback
      const previousEmployees = [...employees];

      try {
        setLoading((prev) => ({ ...prev, deleting: true }));
        setError((prev) => ({ ...prev, deleteError: null }));

        // Optimistic remove
        setEmployees((prev) => prev.filter((emp) => emp.id !== id));

        devLog.action("EmployeesContext", "Deleting employee", { id });

        const { error: deleteError } = await supabase
          .from("employees")
          .delete()
          .eq("id", id);

        if (deleteError) throw deleteError;

        devLog.action("EmployeesContext", "Employee deleted successfully", {
          id,
        });

        return createSuccessResponse(true);
      } catch (err) {
        const errorMessage = extractErrorMessage(err);
        devLog.error("EmployeesContext", errorMessage);
        
        // Rollback on failure
        setEmployees(previousEmployees);
        setError((prev) => ({ ...prev, deleteError: errorMessage }));
        
        return createErrorResponse(errorMessage);
      } finally {
        setLoading((prev) => ({ ...prev, deleting: false }));
      }
    },
    [employees]
  );

  // Get employee by ID
  const getEmployeeById = useCallback(
    (id: string | number): Employee | undefined => {
      return employees.find((emp) => emp.id === id);
    },
    [employees]
  );

  // Clear all errors
  const clearErrors = useCallback(() => {
    setError(createInitialErrorStates());
  }, []);

  // Refresh all data
  const refresh = useCallback(async () => {
    devLog.action("EmployeesContext", "Refreshing all data");
    await Promise.all([
      fetchEmployees(true),
      extendedEmployees.length > 0 ? fetchExtendedEmployees(true) : Promise.resolve(),
    ]);
  }, [fetchEmployees, fetchExtendedEmployees, extendedEmployees.length]);

  const value = useMemo(
    () => ({
      employees,
      extendedEmployees,
      loading,
      error,
      initialized,
      fetchEmployees,
      fetchExtendedEmployees,
      createEmployee,
      updateEmployee,
      deleteEmployee,
      getEmployeeById,
      clearErrors,
      refresh,
    }),
    [
      employees,
      extendedEmployees,
      loading,
      error,
      initialized,
      fetchEmployees,
      fetchExtendedEmployees,
      createEmployee,
      updateEmployee,
      deleteEmployee,
      getEmployeeById,
      clearErrors,
      refresh,
    ]
  );

  return (
    <EmployeesContext.Provider value={value}>
      {children}
    </EmployeesContext.Provider>
  );
}

export function useEmployeesContext() {
  const context = useContext(EmployeesContext);
  if (context === undefined) {
    throw new Error("useEmployeesContext must be used within an EmployeesProvider");
  }
  return context;
}
