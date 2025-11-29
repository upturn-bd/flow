"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { ChartBar, Buildings, Users, GlobeHemisphereWest, Factory } from "@phosphor-icons/react";

interface Stats {
  companies: number;
  countries: number;
  industries: number;
  employees: number;
  superadmins: number;
  teams: number;
  pendingApprovals: number;
}

interface RecentCompany {
  id: number;
  name: string;
  created_at: string;
  employee_count?: number;
}

export default function SuperadminDashboard() {
  const [stats, setStats] = useState<Stats>({
    companies: 0,
    countries: 0,
    industries: 0,
    employees: 0,
    superadmins: 0,
    teams: 0,
    pendingApprovals: 0,
  });
  const [recentCompanies, setRecentCompanies] = useState<RecentCompany[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchRecentCompanies();
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
        teamsResult,
        pendingResult,
      ] = await Promise.all([
        supabase.from("companies").select("id", { count: "exact", head: true }),
        supabase.from("countries").select("id", { count: "exact", head: true }),
        supabase.from("industries").select("id", { count: "exact", head: true }),
        supabase.from("employees").select("id", { count: "exact", head: true }),
        supabase.from("superadmins").select("id", { count: "exact", head: true }),
        supabase.from("teams").select("id", { count: "exact", head: true }),
        supabase.from("employees").select("id", { count: "exact", head: true }).eq("has_approval", false),
      ]);

      setStats({
        companies: companiesResult.count || 0,
        countries: countriesResult.count || 0,
        industries: industriesResult.count || 0,
        employees: employeesResult.count || 0,
        superadmins: superadminsResult.count || 0,
        teams: teamsResult.count || 0,
        pendingApprovals: pendingResult.count || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentCompanies = async () => {
    try {
      const { data: companies } = await supabase
        .from("companies")
        .select("id, name, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      if (companies) {
        // Fetch employee counts for each company
        const companiesWithCounts = await Promise.all(
          companies.map(async (company) => {
            const { count } = await supabase
              .from("employees")
              .select("id", { count: "exact", head: true })
              .eq("company_id", company.id);
            return { ...company, employee_count: count || 0 };
          })
        );
        setRecentCompanies(companiesWithCounts);
      }
    } catch (error) {
      console.error("Error fetching recent companies:", error);
    }
  };

  const statCards = [
    {
      label: "Companies",
      value: stats.companies,
      icon: Buildings,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      href: "/sa/companies",
    },
    {
      label: "Employees",
      value: stats.employees,
      icon: Users,
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-600",
      href: "/sa/companies",
    },
    {
      label: "Teams",
      value: stats.teams,
      icon: Users,
      color: "from-violet-500 to-violet-600",
      bgColor: "bg-violet-50",
      textColor: "text-violet-600",
      href: "/sa/teams",
    },
    {
      label: "Countries",
      value: stats.countries,
      icon: GlobeHemisphereWest,
      color: "from-amber-500 to-amber-600",
      bgColor: "bg-amber-50",
      textColor: "text-amber-600",
      href: "/sa/countries",
    },
    {
      label: "Industries",
      value: stats.industries,
      icon: Factory,
      color: "from-rose-500 to-rose-600",
      bgColor: "bg-rose-50",
      textColor: "text-rose-600",
      href: "/sa/industries",
    },
    {
      label: "Superadmins",
      value: stats.superadmins,
      icon: ChartBar,
      color: "from-slate-500 to-slate-600",
      bgColor: "bg-slate-50",
      textColor: "text-slate-600",
      href: "/sa/users",
    },
  ];

  const quickActions = [
    {
      label: "Manage Companies",
      description: "View, create, and edit companies",
      icon: Buildings,
      href: "/sa/companies",
      color: "blue",
    },
    {
      label: "Manage Teams",
      description: "Configure team permissions",
      icon: Users,
      href: "/sa/teams",
      color: "violet",
    },
    {
      label: "Manage Countries",
      description: "Add or edit country data",
      icon: GlobeHemisphereWest,
      href: "/sa/countries",
      color: "amber",
    },
    {
      label: "Manage Industries",
      description: "Configure industry options",
      icon: Factory,
      href: "/sa/industries",
      color: "rose",
    },
    {
      label: "Superadmin Users",
      description: "Manage superadmin access",
      icon: ChartBar,
      href: "/sa/users",
      color: "slate",
    },
  ];

  const colorClasses: Record<string, { bg: string; hover: string; text: string; border: string }> = {
    blue: { bg: "bg-blue-50", hover: "hover:bg-blue-100", text: "text-blue-600", border: "border-blue-200" },
    violet: { bg: "bg-violet-50", hover: "hover:bg-violet-100", text: "text-violet-600", border: "border-violet-200" },
    amber: { bg: "bg-amber-50", hover: "hover:bg-amber-100", text: "text-amber-600", border: "border-amber-200" },
    rose: { bg: "bg-rose-50", hover: "hover:bg-rose-100", text: "text-rose-600", border: "border-rose-200" },
    slate: { bg: "bg-slate-50", hover: "hover:bg-slate-100", text: "text-slate-600", border: "border-slate-200" },
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Platform overview and management</p>
        </div>
        
        {stats.pendingApprovals > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg"
          >
            <Warning size={20} className="text-amber-600" />
            <span className="text-sm font-medium text-amber-700">
              {stats.pendingApprovals} pending approval{stats.pendingApprovals !== 1 ? "s" : ""}
            </span>
          </motion.div>
        )}
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 animate-pulse">
              <div className="h-10 w-10 bg-gray-200 rounded-lg mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-7 bg-gray-200 rounded w-12"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={card.href}>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md hover:border-gray-300 transition-all group">
                    <div className={`${card.bgColor} p-2.5 rounded-lg w-fit mb-3 group-hover:scale-110 transition-transform`}>
                      <Icon size={22} weight="duotone" className={card.textColor} />
                    </div>
                    <p className="text-sm text-gray-500 mb-1">{card.label}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {card.value.toLocaleString()}
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            <p className="text-sm text-gray-500 mt-0.5">Common management tasks</p>
          </div>
          <div className="p-5 grid sm:grid-cols-2 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              const colors = colorClasses[action.color];
              return (
                <Link key={action.href} href={action.href}>
                  <div className={`p-4 rounded-xl border ${colors.border} ${colors.bg} ${colors.hover} transition-all group flex items-start gap-3`}>
                    <div className={`p-2 rounded-lg bg-white shadow-sm ${colors.text}`}>
                      <Icon size={22} weight="duotone" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 group-hover:text-gray-700 flex items-center gap-2">
                        {action.label}
                        <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{action.description}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Companies */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Recent Companies</h2>
              <p className="text-sm text-gray-500 mt-0.5">Latest additions</p>
            </div>
            <Link href="/sa/companies" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View all
            </Link>
          </div>
          
          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentCompanies.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {recentCompanies.map((company) => (
                <Link key={company.id} href="/sa/companies">
                  <div className="p-4 hover:bg-gray-50 transition-colors flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      {company.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{company.name}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <Users size={12} />
                          {company.employee_count} employee{company.employee_count !== 1 ? "s" : ""}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(company.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Buildings size={40} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500 text-sm">No companies yet</p>
            </div>
          )}
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">System Status</h2>
        </div>
        <div className="p-5 grid sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <CheckCircle size={24} weight="fill" className="text-emerald-600" />
            <div>
              <p className="font-medium text-emerald-700">Database</p>
              <p className="text-sm text-emerald-600">Connected</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <CheckCircle size={24} weight="fill" className="text-emerald-600" />
            <div>
              <p className="font-medium text-emerald-700">Authentication</p>
              <p className="text-sm text-emerald-600">Active</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <CheckCircle size={24} weight="fill" className="text-emerald-600" />
            <div>
              <p className="font-medium text-emerald-700">Storage</p>
              <p className="text-sm text-emerald-600">Operational</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
