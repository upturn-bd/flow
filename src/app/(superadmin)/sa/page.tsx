"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { ChartBar, Buildings, Users, GlobeHemisphereWest, Factory } from "@phosphor-icons/react";

interface Stats {
  companies: number;
  countries: number;
  industries: number;
  employees: number;
  superadmins: number;
}

export default function SuperadminDashboard() {
  const [stats, setStats] = useState<Stats>({
    companies: 0,
    countries: 0,
    industries: 0,
    employees: 0,
    superadmins: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [
        companiesResult,
        countriesResult,
        industriesResult,
        employeesResult,
        superadminsResult,
      ] = await Promise.all([
        supabase.from("companies").select("id", { count: "exact", head: true }),
        supabase.from("countries").select("id", { count: "exact", head: true }),
        supabase.from("industries").select("id", { count: "exact", head: true }),
        supabase.from("employees").select("id", { count: "exact", head: true }),
        supabase.from("superadmins").select("id", { count: "exact", head: true }),
      ]);

      setStats({
        companies: companiesResult.count || 0,
        countries: countriesResult.count || 0,
        industries: industriesResult.count || 0,
        employees: employeesResult.count || 0,
        superadmins: superadminsResult.count || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: "Total Companies",
      value: stats.companies,
      icon: Buildings,
      color: "bg-blue-500",
    },
    {
      label: "Total Employees",
      value: stats.employees,
      icon: Users,
      color: "bg-green-500",
    },
    {
      label: "Countries",
      value: stats.countries,
      icon: GlobeHemisphereWest,
      color: "bg-purple-500",
    },
    {
      label: "Industries",
      value: stats.industries,
      icon: Factory,
      color: "bg-orange-500",
    },
    {
      label: "Superadmins",
      value: stats.superadmins,
      icon: ChartBar,
      color: "bg-red-500",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Superadmin Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          Platform overview and management
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-white rounded-lg shadow p-6 animate-pulse"
            >
              <div className="h-12 w-12 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {card.label}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {card.value.toLocaleString()}
                    </p>
                  </div>
                  <div className={`${card.color} p-3 rounded-lg`}>
                    <Icon size={32} weight="bold" className="text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <a
            href="/sa/companies"
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <Buildings size={24} className="text-blue-600" />
            <span className="text-gray-900 font-medium">Manage Companies</span>
          </a>
          <a
            href="/sa/countries"
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
          >
            <GlobeHemisphereWest size={24} className="text-purple-600" />
            <span className="text-gray-900 font-medium">Manage Countries</span>
          </a>
          <a
            href="/sa/industries"
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
          >
            <Factory size={24} className="text-orange-600" />
            <span className="text-gray-900 font-medium">Manage Industries</span>
          </a>
          <a
            href="/sa/teams"
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            <Users size={24} className="text-green-600" />
            <span className="text-gray-900 font-medium">Manage Teams</span>
          </a>
          <a
            href="/sa/users"
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors"
          >
            <ChartBar size={24} className="text-red-600" />
            <span className="text-gray-900 font-medium">Manage Superadmins</span>
          </a>
        </div>
      </div>
    </div>
  );
}
