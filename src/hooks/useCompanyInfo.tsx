"use client";

import { useState, useCallback } from "react";
import { 
  getCompanyInfo as fetchCompanyInfoApi, 
  CompanyInfoResponse, 
  Company, 
  Country, 
  Industry, 
  FormattedEmployee
} from "@/lib/api/company/companyInfo";

export function useCompanyInfo() {
  const [companyInfo, setCompanyInfo] = useState<Company | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [employees, setEmployees] = useState<FormattedEmployee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchCompanyInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCompanyInfoApi();
      setCompanyInfo(data.company);
      setCountries(data.countries);
      setIndustries(data.industries);
      setEmployees(data.formattedEmployees);
    } catch (err) {
      console.error("Error fetching company info:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

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