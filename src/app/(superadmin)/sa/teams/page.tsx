"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Company, Team } from "@/lib/types/schemas";
import { 
  MagnifyingGlass, 
  Users, 
  Pencil, 
  Trash, 
  Plus,
  Buildings,
  CaretDown,
  X,
  Spinner,
  Check,
  Star,
  Star as StarHalf,
} from "@/lib/icons";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface TeamWithDetails extends Team {
  member_count?: number;
  company?: Company;
}

interface EditingTeam {
  id: number;
  name: string;
  description: string;
}

export default function TeamsManagementPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);
  const [teams, setTeams] = useState<TeamWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Editing states - local until save
  const [editingTeam, setEditingTeam] = useState<EditingTeam | null>(null);
  const [savingTeamId, setSavingTeamId] = useState<number | null>(null);
  const [deletingTeamId, setDeletingTeamId] = useState<number | null>(null);
  const [togglingDefaultId, setTogglingDefaultId] = useState<number | null>(null);
  
  // Create team modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: "", description: "", isDefault: false });
  const [creatingTeam, setCreatingTeam] = useState(false);
  
  // Delete confirmation
  const [teamToDelete, setTeamToDelete] = useState<TeamWithDetails | null>(null);

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
      toast.error("Failed to load companies");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = useCallback(async () => {
    if (!selectedCompany) return;

    setLoading(true);
    try {
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select(`
          *,
          team_members(count)
        `)
        .eq("company_id", selectedCompany)
        .order("is_default", { ascending: false })
        .order("name");

      if (teamsError) throw teamsError;

      const teamsWithCount = teamsData?.map((team) => {
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
  }, [selectedCompany]);

  // Filtered teams based on search
  const filteredTeams = useMemo(() => {
    return teams.filter((team) =>
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (team.description && team.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [teams, searchTerm]);

  // Start editing a team
  const startEditing = (team: TeamWithDetails) => {
    setEditingTeam({
      id: team.id!,
      name: team.name,
      description: team.description || "",
    });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingTeam(null);
  };

  // Save team changes
  const saveTeamChanges = async () => {
    if (!editingTeam) return;

    if (!editingTeam.name.trim()) {
      toast.error("Team name cannot be empty");
      return;
    }

    setSavingTeamId(editingTeam.id);
    try {
      const { error } = await supabase
        .from("teams")
        .update({
          name: editingTeam.name.trim(),
          description: editingTeam.description.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingTeam.id);

      if (error) throw error;

      // Update local state without refetching
      setTeams(prev => prev.map(t => 
        t.id === editingTeam.id 
          ? { ...t, name: editingTeam.name.trim(), description: editingTeam.description.trim() || undefined }
          : t
      ));
      
      toast.success("Team updated successfully");
      setEditingTeam(null);
    } catch (error) {
      console.error("Error updating team:", error);
      toast.error("Failed to update team");
    } finally {
      setSavingTeamId(null);
    }
  };

  // Toggle default status
  const toggleDefaultStatus = async (team: TeamWithDetails) => {
    setTogglingDefaultId(team.id!);
    try {
      if (team.is_default) {
        // Unset as default
        const { error } = await supabase
          .from("teams")
          .update({ is_default: false, updated_at: new Date().toISOString() })
          .eq("id", team.id);

        if (error) throw error;

        setTeams(prev => prev.map(t => 
          t.id === team.id ? { ...t, is_default: false } : t
        ));
        toast.success("Default status removed");
      } else {
        // Set as default - first unset any existing default
        const { error: unsetError } = await supabase
          .from("teams")
          .update({ is_default: false, updated_at: new Date().toISOString() })
          .eq("company_id", selectedCompany)
          .eq("is_default", true);

        if (unsetError) throw unsetError;

        const { error: setError } = await supabase
          .from("teams")
          .update({ is_default: true, updated_at: new Date().toISOString() })
          .eq("id", team.id);

        if (setError) throw setError;

        setTeams(prev => prev.map(t => ({
          ...t,
          is_default: t.id === team.id
        })));
        toast.success("Set as default team");
      }
    } catch (error) {
      console.error("Error toggling default status:", error);
      toast.error("Failed to update default status");
    } finally {
      setTogglingDefaultId(null);
    }
  };

  // Delete team
  const deleteTeam = async () => {
    if (!teamToDelete) return;

    setDeletingTeamId(teamToDelete.id!);
    try {
      const { error } = await supabase
        .from("teams")
        .delete()
        .eq("id", teamToDelete.id);

      if (error) throw error;

      setTeams(prev => prev.filter(t => t.id !== teamToDelete.id));
      toast.success("Team deleted successfully");
      setTeamToDelete(null);
    } catch (error) {
      console.error("Error deleting team:", error);
      toast.error("Failed to delete team. It may be in use.");
    } finally {
      setDeletingTeamId(null);
    }
  };

  // Create team
  const createTeam = async () => {
    if (!selectedCompany) return;
    if (!newTeam.name.trim()) {
      toast.error("Team name is required");
      return;
    }

    setCreatingTeam(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // If setting as default, unset existing default first
      if (newTeam.isDefault) {
        await supabase
          .from("teams")
          .update({ is_default: false, updated_at: new Date().toISOString() })
          .eq("company_id", selectedCompany)
          .eq("is_default", true);
      }

      const { data, error } = await supabase
        .from("teams")
        .insert({
          name: newTeam.name.trim(),
          description: newTeam.description.trim() || null,
          company_id: selectedCompany,
          is_default: newTeam.isDefault,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      if (newTeam.isDefault) {
        setTeams(prev => [
          { ...data, member_count: 0 },
          ...prev.map(t => ({ ...t, is_default: false }))
        ]);
      } else {
        setTeams(prev => [...prev, { ...data, member_count: 0 }]);
      }

      toast.success("Team created successfully");
      setShowCreateModal(false);
      setNewTeam({ name: "", description: "", isDefault: false });
    } catch (error: unknown) {
      console.error("Error creating team:", error);
      if ((error as { code?: string })?.code === "23505") {
        toast.error("A team with this name already exists");
      } else {
        toast.error("Failed to create team");
      }
    } finally {
      setCreatingTeam(false);
    }
  };

  const selectedCompanyData = companies.find(c => c.id === selectedCompany);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teams Management</h1>
          <p className="text-gray-600 mt-1">Manage teams and assign users across companies</p>
        </div>
        {selectedCompany && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
          >
            <Plus size={20} weight="bold" />
            <span>Create Team</span>
          </button>
        )}
      </div>

      {/* Company Selection Card */}
      <div className="bg-surface-primary rounded-xl shadow-sm border border-border-primary p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Buildings size={24} className="text-blue-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Select Company</h2>
            <p className="text-sm text-gray-500">Choose a company to manage its teams</p>
          </div>
        </div>
        
        <div className="relative">
          <select
            value={selectedCompany || ""}
            onChange={(e) => {
              setSelectedCompany(e.target.value ? parseInt(e.target.value) : null);
              setSearchTerm("");
              setEditingTeam(null);
            }}
            className="w-full appearance-none px-4 py-3 pr-10 border border-border-secondary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-surface-primary text-gray-900 font-medium transition-all"
          >
            <option value="">Select a company...</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
          <CaretDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Teams Section */}
      {selectedCompany && (
        <div className="bg-surface-primary rounded-xl shadow-sm border border-border-primary overflow-hidden">
          {/* Search Header */}
          <div className="p-4 border-b border-border-primary bg-background-secondary dark:bg-background-tertiary">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="relative flex-1">
                <MagnifyingGlass
                  size={20}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search teams by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-border-secondary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-surface-hover rounded-full transition-colors"
                  >
                    <X size={16} className="text-gray-400" />
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users size={18} />
                <span>{filteredTeams.length} team{filteredTeams.length !== 1 ? "s" : ""}</span>
                {searchTerm && teams.length !== filteredTeams.length && (
                  <span className="text-gray-400">of {teams.length}</span>
                )}
              </div>
            </div>
          </div>

          {/* Teams List */}
          {loading ? (
            <div className="p-12 text-center">
              <Spinner size={32} className="animate-spin text-blue-600 mx-auto mb-3" />
              <p className="text-gray-500">Loading teams...</p>
            </div>
          ) : filteredTeams.length === 0 ? (
            <div className="p-12 text-center">
              <Users size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600 font-medium">
                {searchTerm ? "No teams found" : "No teams yet"}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {searchTerm 
                  ? "Try a different search term" 
                  : "Create a team to get started"
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border-primary">
              <AnimatePresence mode="popLayout">
                {filteredTeams.map((team) => (
                  <motion.div
                    key={team.id}
                    layout
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className="p-4 hover:bg-surface-hover transition-colors"
                  >
                    {editingTeam?.id === team.id && editingTeam ? (
                      // Editing mode
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg mt-1">
                            <Users size={20} className="text-blue-600" />
                          </div>
                          <div className="flex-1 space-y-3">
                            <input
                              type="text"
                              value={editingTeam.name}
                              onChange={(e) => setEditingTeam(prev => prev ? { ...prev, name: e.target.value } : null)}
                              className="w-full px-3 py-2 border border-border-secondary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                              placeholder="Team name"
                              autoFocus
                            />
                            <textarea
                              value={editingTeam.description}
                              onChange={(e) => setEditingTeam(prev => prev ? { ...prev, description: e.target.value } : null)}
                              className="w-full px-3 py-2 border border-border-secondary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                              placeholder="Team description (optional)"
                              rows={2}
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={cancelEditing}
                            className="px-3 py-1.5 text-sm text-foreground-secondary hover:bg-surface-hover rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={saveTeamChanges}
                            disabled={savingTeamId === team.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            {savingTeamId === team.id ? (
                              <Spinner size={16} className="animate-spin" />
                            ) : (
                              <Check size={16} weight="bold" />
                            )}
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View mode
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${team.is_default ? "bg-amber-100" : "bg-gray-100"}`}>
                          <Users size={20} className={team.is_default ? "text-amber-600" : "text-gray-600"} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900">{team.name}</h3>
                            {team.is_default && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                                <Star size={12} weight="fill" />
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                            {team.description || "No description"}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Users size={14} />
                              {team.member_count || 0} member{(team.member_count || 0) !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleDefaultStatus(team)}
                            disabled={togglingDefaultId === team.id}
                            className={`p-2 rounded-lg transition-colors ${
                              team.is_default 
                                ? "text-amber-600 hover:bg-amber-50" 
                                : "text-gray-400 hover:bg-gray-100 hover:text-amber-600"
                            }`}
                            title={team.is_default ? "Remove default status" : "Set as default"}
                          >
                            {togglingDefaultId === team.id ? (
                              <Spinner size={18} className="animate-spin" />
                            ) : team.is_default ? (
                              <Star size={18} weight="fill" />
                            ) : (
                              <StarHalf size={18} />
                            )}
                          </button>
                          
                          <button
                            onClick={() => startEditing(team)}
                            className="p-2 text-gray-400 hover:bg-gray-100 hover:text-blue-600 rounded-lg transition-colors"
                            title="Edit team"
                          >
                            <Pencil size={18} />
                          </button>
                          
                          <a
                            href={`/sa/teams/${selectedCompany}/${team.id}`}
                            className="p-2 text-gray-400 hover:bg-gray-100 hover:text-green-600 rounded-lg transition-colors"
                            title="Manage members & permissions"
                          >
                            <Users size={18} />
                          </a>
                          
                          {!team.is_default && (
                            <button
                              onClick={() => setTeamToDelete(team)}
                              disabled={deletingTeamId === team.id}
                              className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                              title="Delete team"
                            >
                              {deletingTeamId === team.id ? (
                                <Spinner size={18} className="animate-spin" />
                              ) : (
                                <Trash size={18} />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* Empty State - No Company Selected */}
      {!selectedCompany && (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-12 text-center border border-border-primary">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-surface-primary rounded-full shadow-sm mb-4">
            <Buildings size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Select a Company
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Choose a company from the dropdown above to view and manage its teams, members, and permissions
          </p>
        </div>
      )}

      {/* Create Team Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-surface-primary rounded-xl shadow-xl max-w-md w-full overflow-hidden"
            >
              <div className="p-6 border-b border-border-primary">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Plus size={20} className="text-blue-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Create New Team</h2>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={20} className="text-gray-400" />
                  </button>
                </div>
                {selectedCompanyData && (
                  <p className="text-sm text-gray-500 mt-2">
                    Creating team for <span className="font-medium text-gray-700">{selectedCompanyData.name}</span>
                  </p>
                )}
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Team Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newTeam.name}
                    onChange={(e) => setNewTeam(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-border-secondary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="e.g., Engineering, Marketing, HR"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={newTeam.description}
                    onChange={(e) => setNewTeam(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-border-secondary rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                    placeholder="Brief description of this team's purpose"
                    rows={3}
                  />
                </div>

                <label className="flex items-center gap-3 p-3 border border-border-primary rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={newTeam.isDefault}
                    onChange={(e) => setNewTeam(prev => ({ ...prev, isDefault: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-border-secondary rounded focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Set as default team</span>
                    <p className="text-xs text-gray-500 mt-0.5">New employees will be automatically added to this team</p>
                  </div>
                </label>
              </div>

              <div className="p-6 bg-gray-50 border-t border-border-primary flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewTeam({ name: "", description: "", isDefault: false });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createTeam}
                  disabled={creatingTeam || !newTeam.name.trim()}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingTeam ? (
                    <>
                      <Spinner size={16} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={16} weight="bold" />
                      Create Team
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {teamToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setTeamToDelete(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-surface-primary rounded-xl shadow-xl max-w-md w-full overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-100 rounded-full">
                    <Trash size={24} className="text-red-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Delete Team</h2>
                </div>
                
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete <span className="font-semibold text-gray-900">{teamToDelete.name}</span>?
                </p>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  <p className="font-medium">This action cannot be undone.</p>
                  <p className="mt-1">All team members and permissions will be removed.</p>
                </div>
              </div>

              <div className="p-6 bg-gray-50 border-t border-border-primary flex items-center justify-end gap-3">
                <button
                  onClick={() => setTeamToDelete(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteTeam}
                  disabled={deletingTeamId === teamToDelete.id}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deletingTeamId === teamToDelete.id ? (
                    <>
                      <Spinner size={16} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash size={16} weight="bold" />
                      Delete Team
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
