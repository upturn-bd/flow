"use client";

import { useState, useCallback } from "react";
import { getCompanyInfo as getCompanyInfoApi } from "@/lib/api/company/companyInfo";
import { useEmployees } from "@/hooks/useEmployees";

interface CompanyInfo {
  id: number;
  name: string;
  code: string;
  industry_id: number;
  country_id: number;
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
      
      setCompanyInfo(result.company);
      setCountries(result.countries);
      setIndustries(result.industries);
      
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

  return {
    companyInfo,
    countries,
    industries,
    employees,
    loading,
    error,
    fetchCompanyInfo
  };
} 