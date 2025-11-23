"use client";

import React, { ReactNode } from "react";
import { EmployeesProvider } from "./EmployeesContext";
import { DepartmentsProvider } from "./DepartmentsContext";
import { DivisionsProvider } from "./DivisionsContext";
import { TeamsProvider } from "./TeamsContext";
import { PositionsProvider } from "./PositionsContext";
import { GradesProvider } from "./GradesContext";

/**
 * Combined provider that wraps all data contexts
 * This provides a single point of integration for all context providers
 * 
 * Usage:
 * ```tsx
 * <DataContextProvider>
 *   <YourApp />
 * </DataContextProvider>
 * ```
 */

interface DataContextProviderProps {
  children: ReactNode;
  /**
   * Whether to auto-fetch data on mount for all contexts
   * Default: true
   */
  autoFetch?: boolean;
}

export function DataContextProvider({
  children,
  autoFetch = true,
}: DataContextProviderProps) {
  return (
    <EmployeesProvider autoFetch={autoFetch}>
      <DepartmentsProvider autoFetch={autoFetch}>
        <DivisionsProvider autoFetch={autoFetch}>
          <TeamsProvider autoFetch={autoFetch}>
            <PositionsProvider autoFetch={autoFetch}>
              <GradesProvider autoFetch={autoFetch}>
                {children}
              </GradesProvider>
            </PositionsProvider>
          </TeamsProvider>
        </DivisionsProvider>
      </DepartmentsProvider>
    </EmployeesProvider>
  );
}
