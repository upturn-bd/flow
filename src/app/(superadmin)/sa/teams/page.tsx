"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Company, Team } from "@/lib/types/schemas";
import { MagnifyingGlass, Users, Pencil, Trash, Plus } from "@/lib/icons";
import { toast } from "sonner";

interface TeamWithDetails extends Team {
  member_count?: number;
  company?: Company;
}

export default function TeamsManagementPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);
  const [teams, setTeams] = useState<TeamWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      fetchTeams();
    } else {
      setTeams([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompany]);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("name");

      if (error) throw error;
      if (data) setCompanies(data);
    } catch (error) {
      console.error("Error fetching companies:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    if (!selectedCompany) return;

    setLoading(true);
    try {
      // Fetch teams with member count
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select(`
          *,
          team_members(count)
        `)
        .eq("company_id", selectedCompany)
        .order("name");

      if (teamsError) throw teamsError;

      // Transform the data to include member_count
      const teamsWithCount = teamsData?.map((team) => {
        // Extract the team_members count from the aggregation
        const memberCount = Array.isArray(team.team_members) 
          ? team.team_members.length 
          : (team.team_members as unknown as { count: number })?.count || 0;
        
        return {
          id: team.id,
          name: team.name,
          description: team.description,
          company_id: team.company_id,
          is_default: team.is_default,
          created_at: team.created_at,
          updated_at: team.updated_at,
          created_by: team.created_by,
          member_count: memberCount,
        } as TeamWithDetails;
      }) || [];

      setTeams(teamsWithCount);
    } catch (error) {
      console.error("Error fetching teams:", error);
      toast.error("Failed to load teams");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeam = async (teamId: number) => {
    if (!confirm("Are you sure you want to delete this team? All team members and permissions will be removed.")) {
      return;
    }

    try {
      await supabase.from("teams").delete().eq("id", teamId);
      toast.success("Team deleted successfully");
      fetchTeams();
    } catch (error) {
      console.error("Error deleting team:", error);
      toast.error("Failed to delete team. It may be in use.");
    }
  };

  const filteredTeams = teams.filter((team) =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (team.description && team.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Teams Management</h1>
        <p className="text-gray-600 mt-1">Manage teams and assign users across companies</p>
      </div>

      {/* Company Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Company
        </label>
        <select
          value={selectedCompany || ""}
          onChange={(e) => setSelectedCompany(e.target.value ? parseInt(e.target.value) : null)}
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a company to manage teams</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </div>

      {/* Teams List */}
      {selectedCompany && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlass
                size={20}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <a
              href={`/sa/teams/${selectedCompany}/create`}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} />
              <span>Create Team</span>
            </a>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading teams...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Members</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Default</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTeams.map((team) => (
                    <tr key={team.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Users size={20} className="text-gray-400" />
                          <span className="font-medium text-gray-900">{team.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-md truncate">
                          {team.description || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded-full">
                          {team.member_count || 0} members
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {team.is_default && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                            Default
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {team.id ? (
                            <a
                              href={`/sa/teams/${selectedCompany}/${team.id}`}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                              title="Manage Team"
                            >
                              <Pencil size={18} />
                            </a>
                          ) : null}
                          {!team.is_default && team.id && (
                            <button
                              onClick={() => handleDeleteTeam(team.id!)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                              title="Delete Team"
                            >
                              <Trash size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredTeams.length === 0 && (
                <div className="p-8 text-center">
                  <Users size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No teams found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {searchTerm ? "Try a different search term" : "Create a team to get started"}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!selectedCompany && (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <Users size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Select a Company
          </h3>
          <p className="text-gray-600">
            Choose a company from the dropdown above to view and manage its teams
          </p>
        </div>
      )}
    </div>
  );
}
