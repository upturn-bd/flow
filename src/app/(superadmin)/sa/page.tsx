"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { 
  ChartBar, 
  Buildings, 
  Users, 
  GlobeHemisphereWest, 
  Factory,
  AlertTriangle as Warning,
  ArrowRight,
  Clock,
  CheckCircle,
} from "@/lib/icons";
import { motion } from "framer-motion";
import { StatCard, StatCardGrid, EmptyState } from "@/components/ui";

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
    blue: { bg: "bg-primary-50 dark:bg-primary-950/30", hover: "hover:bg-primary-100 dark:hover:bg-primary-900/40", text: "text-primary-600 dark:text-primary-400", border: "border-primary-200 dark:border-primary-800" },
    violet: { bg: "bg-purple-50 dark:bg-purple-950/30", hover: "hover:bg-purple-100 dark:hover:bg-purple-900/40", text: "text-purple-600 dark:text-purple-400", border: "border-purple-200 dark:border-purple-800" },
    amber: { bg: "bg-amber-50 dark:bg-amber-950/30", hover: "hover:bg-amber-100 dark:hover:bg-amber-900/40", text: "text-amber-600 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800" },
    rose: { bg: "bg-rose-50 dark:bg-rose-950/30", hover: "hover:bg-rose-100 dark:hover:bg-rose-900/40", text: "text-rose-600 dark:text-rose-400", border: "border-rose-200 dark:border-rose-800" },
    slate: { bg: "bg-background-tertiary dark:bg-surface-secondary", hover: "hover:bg-surface-hover", text: "text-foreground-secondary", border: "border-border-primary" },
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground-primary">Dashboard</h1>
          <p className="text-foreground-secondary mt-1">Platform overview and management</p>
        </div>
        
        {stats.pendingApprovals > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-4 py-2 bg-warning/10 border border-warning/30 rounded-lg"
          >
            <Warning size={20} className="text-warning" />
            <span className="text-sm font-medium text-warning">
              {stats.pendingApprovals} pending approval{stats.pendingApprovals !== 1 ? "s" : ""}
            </span>
          </motion.div>
        )}
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-surface-primary rounded-xl shadow-sm border border-border-primary p-5 animate-pulse">
              <div className="h-10 w-10 bg-background-tertiary dark:bg-surface-secondary rounded-lg mb-3"></div>
              <div className="h-4 bg-background-tertiary dark:bg-surface-secondary rounded w-16 mb-2"></div>
              <div className="h-7 bg-background-tertiary dark:bg-surface-secondary rounded w-12"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Link href="/sa/companies">
            <StatCard
              icon={Buildings}
              value={stats.companies}
              label="Companies"
              color="blue"
            />
          </Link>
          <Link href="/sa/companies">
            <StatCard
              icon={Users}
              value={stats.employees}
              label="Employees"
              color="green"
            />
          </Link>
          <Link href="/sa/teams">
            <StatCard
              icon={Users}
              value={stats.teams}
              label="Teams"
              color="purple"
            />
          </Link>
          <Link href="/sa/countries">
            <StatCard
              icon={GlobeHemisphereWest}
              value={stats.countries}
              label="Countries"
              color="amber"
            />
          </Link>
          <Link href="/sa/industries">
            <StatCard
              icon={Factory}
              value={stats.industries}
              label="Industries"
              color="red"
            />
          </Link>
          <Link href="/sa/users">
            <StatCard
              icon={ChartBar}
              value={stats.superadmins}
              label="Superadmins"
              color="gray"
            />
          </Link>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2 bg-surface-primary rounded-xl shadow-sm border border-border-primary overflow-hidden">
          <div className="p-5 border-b border-border-primary">
            <h2 className="text-lg font-semibold text-foreground-primary">Quick Actions</h2>
            <p className="text-sm text-foreground-tertiary mt-0.5">Common management tasks</p>
          </div>
          <div className="p-5 grid sm:grid-cols-2 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              const colors = colorClasses[action.color];
              return (
                <Link key={action.href} href={action.href}>
                  <div className={`p-4 rounded-xl border ${colors.border} ${colors.bg} ${colors.hover} transition-all group flex items-start gap-3`}>
                    <div className={`p-2 rounded-lg bg-surface-primary shadow-sm ${colors.text}`}>
                      <Icon size={22} weight="duotone" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground-primary group-hover:text-foreground-secondary flex items-center gap-2">
                        {action.label}
                        <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-sm text-foreground-tertiary mt-0.5 line-clamp-1">{action.description}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Companies */}
        <div className="bg-surface-primary rounded-xl shadow-sm border border-border-primary overflow-hidden">
          <div className="p-5 border-b border-border-primary flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground-primary">Recent Companies</h2>
              <p className="text-sm text-foreground-tertiary mt-0.5">Latest additions</p>
            </div>
            <Link href="/sa/companies" className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
              View all
            </Link>
          </div>
          
          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 bg-background-tertiary dark:bg-surface-secondary rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-background-tertiary dark:bg-surface-secondary rounded w-24 mb-1"></div>
                    <div className="h-3 bg-background-tertiary dark:bg-surface-secondary rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentCompanies.length > 0 ? (
            <div className="divide-y divide-border-primary">
              {recentCompanies.map((company) => (
                <Link key={company.id} href="/sa/companies">
                  <div className="p-4 hover:bg-surface-hover transition-colors flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      {company.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground-primary truncate">{company.name}</div>
                      <div className="text-xs text-foreground-tertiary flex items-center gap-2">
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
            <div className="p-8">
              <EmptyState
                icon={Buildings}
                title="No companies yet"
                description="Companies will appear here once created"
              />
            </div>
          )}
        </div>
      </div>

      {/* System Status */}
      <div className="bg-surface-primary rounded-xl shadow-sm border border-border-primary overflow-hidden">
        <div className="p-5 border-b border-border-primary">
          <h2 className="text-lg font-semibold text-foreground-primary">System Status</h2>
        </div>
        <div className="p-5 grid sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 bg-success/10 rounded-lg border border-success/30">
            <CheckCircle size={24} weight="fill" className="text-success" />
            <div>
              <p className="font-medium text-success">Database</p>
              <p className="text-sm text-success/80">Connected</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-success/10 rounded-lg border border-success/30">
            <CheckCircle size={24} weight="fill" className="text-success" />
            <div>
              <p className="font-medium text-success">Authentication</p>
              <p className="text-sm text-success/80">Active</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-success/10 rounded-lg border border-success/30">
            <CheckCircle size={24} weight="fill" className="text-success" />
            <div>
              <p className="font-medium text-success">Storage</p>
              <p className="text-sm text-success/80">Operational</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
