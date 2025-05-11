"use client";

import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import CompanyBasicsConfigView from "@/components/admin-management/CompanyBasicsConfigView";

const companyBasicsSchema = z.object({
  company_name: z.string().min(1, "Company Name is required"),
  company_id: z.string().min(1, "Company Code is required"),
  industry_id: z.string().min(1, "Industry is required"),
  country_id: z.string().min(1, "Country is required"),
});

type CompanyBasicsFormData = z.infer<typeof companyBasicsSchema>;

export default function CompanyBasicsForm() {
  const [countries, setCountries] = useState<{ id: number; name: string }[]>(
    []
  );
  const [industries, setIndustries] = useState<{ id: number; name: string }[]>(
    []
  );
  const [employees, setEmployees] = useState<{ id: number; name: string }[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const {
    control,
    reset,
    formState: { errors },
  } = useForm<CompanyBasicsFormData>({
    resolver: zodResolver(companyBasicsSchema),
    defaultValues: {
      company_name: "",
      company_id: "",
      industry_id: "",
      country_id: "",
    },
  });

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        const res = await fetch("/api/company-info");
        const { company, countries, industries, formattedEmployees } =
          await res.json();

        if (company) {
          reset({
            company_name: company.name,
            company_id: company.code,
            industry_id: company.industry_id,
            country_id: company.country_id,
          });
        }
        setCountries(countries);
        setIndustries(industries);
        setEmployees(formattedEmployees);
      } catch (error) {
        console.error("Failed to load company info", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyInfo();
  }, [reset]);

  return (
    <div className="space-y-6 py-12 max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-blue-700">
        Step 1: Company Basics
      </h2>
      {loading ? (
        <div className="flex items-center justify-center h-64">Loading...</div>
      ) : (
        <form>
          <div className="grid grid-cols-1 gap-6">
            {/* Company Name */}
            <div>
              <label className="block font-semibold text-blue-800 mb-1">
                Company Name
              </label>
              <Controller
                control={control}
                name="company_name"
                render={({ field }) => (
                  <input
                    {...field}
                    className="w-full rounded-md bg-blue-50 p-2 border border-blue-100"
                    disabled
                  />
                )}
              />
              {errors.company_name && (
                <p className="text-red-500 text-sm">
                  {errors.company_name.message}
                </p>
              )}
            </div>

            {/* Company Code */}
            <div>
              <label className="block font-semibold text-blue-800 mb-1">
                Company Code
              </label>
              <Controller
                control={control}
                name="company_id"
                render={({ field }) => (
                  <input
                    {...field}
                    className="w-full rounded-md bg-blue-50 p-2 border border-blue-100"
                    disabled
                  />
                )}
              />
              {errors.company_id && (
                <p className="text-red-500 text-sm">
                  {errors.company_id.message}
                </p>
              )}
            </div>

            {/* Industry */}
            <div>
              <label className="block font-semibold text-blue-800 mb-1">
                Industry
              </label>
              <Controller
                control={control}
                name="industry_id"
                render={({ field }) => (
                  <select
                    {...field}
                    className="w-full rounded-md bg-blue-50 p-2 border border-blue-100"
                  >
                    <option value="">Select Industry</option>
                    {industries.map((industry) => (
                      <option key={industry.id} value={industry.id}>
                        {industry.name}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.industry_id && (
                <p className="text-red-500 text-sm">
                  {errors.industry_id.message}
                </p>
              )}
            </div>

            {/* Country */}
            <div>
              <label className="block font-semibold text-blue-800 mb-1">
                Country
              </label>
              <Controller
                control={control}
                name="country_id"
                render={({ field }) => (
                  <select
                    {...field}
                    className="w-full rounded-md bg-blue-50 p-2 border border-blue-100"
                  >
                    <option value="">Select Country</option>
                    {countries.map((country) => (
                      <option key={country.id} value={country.id}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.country_id && (
                <p className="text-red-500 text-sm">
                  {errors.country_id.message}
                </p>
              )}
            </div>
          </div>
        </form>
      )}
      <CompanyBasicsConfigView employees={employees} />
      {/* Proceed Button */}
      <a href="/admin-management/config" className="flex justify-end">
        <button className="bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-2 px-6 rounded-full flex items-center gap-2">
          Proceed
          <span>▶</span>
        </button>
      </a>
    </div>
  );
}
