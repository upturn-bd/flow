"use client";

import { useState, useCallback } from "react";
import { getCompanyInfo as getCompanyInfoApi, updateCompanySettings as updateCompanySettingsApi } from "@/lib/utils/auth";
import { useEmployees } from "@/hooks/useEmployees";

interface CompanyInfo {
  id: number;
  name: string;
  code: string;
  industry_id: number;
  country_id: number;
  live_absent_enabled?: boolean;
  payroll_generation_day?: number;
  fiscal_year_start?: string;
  live_payroll_enabled?: boolean;
}

interface Country {
  id: number;
  name: string;
}

interface Industry {
  id: number;
  name: string;
}

export function useCompanyInfo() {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { employees, fetchEmployees } = useEmployees();

  const fetchCompanyInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getCompanyInfoApi();
      
      setCompanyInfo(result);
      
      // Fetch countries and industries separately
      // For now, setting empty arrays - these should be fetched from proper endpoints
      setCountries([]);
      setIndustries([]);
      
      // Also fetch employees since they're often needed with company info
      await fetchEmployees();
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch company info";
      setError(errorMessage);
      console.error(errorMessage, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchEmployees]);

  const updateCompanySettings = useCallback(async (settings: {
    live_absent_enabled?: boolean;
    payroll_generation_day?: number;
    fiscal_year_start?: string;
    live_payroll_enabled?: boolean;
    industry_id?: number;
    country_id?: number;
  }) => {
    try {
      await updateCompanySettingsApi(settings);
      
      // Update local state
      setCompanyInfo(prev => prev ? { ...prev, ...settings } : null);
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update company settings";
      setError(errorMessage);
      console.error(errorMessage, err);
      throw err;
    }
  }, []);

  return {
    companyInfo,
    countries,
    industries,
    employees,
    loading,
    error,
    fetchCompanyInfo,
    updateCompanySettings
  };
} 