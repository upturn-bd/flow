"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Company, Team } from "@/lib/types/schemas";
import { MagnifyingGlass, Users, Pencil, TrashSimple, Plus, Buildings, CaretDown, X, Spinner, Check, Star, Star as StarHalf } from "@phosphor-icons/react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader, SearchBar, EmptyState, InlineSpinner, LoadingSpinner } from "@/components/ui";
import SuperadminFormModal from "@/components/ui/modals/SuperadminFormModal";
import ConfirmationModal from "@/components/ui/modals/ConfirmationModal";
import { FormField, TextAreaField, SelectField, CheckboxField } from "@/components/forms";

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

  // FloppyDisk team changes
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
      <PageHeader
        title="Teams Management"
        description="Manage teams and assign users across companies"
        icon={Users}
        iconColor="text-blue-600"
        action={selectedCompany ? {
          label: "Create Team",
          onClick: () => setShowCreateModal(true),
          icon: Plus
        } : undefined}
      />

      {/* Company Selection Card */}
      <div className="bg-surface-primary rounded-xl shadow-sm border border-border-primary p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
            <Buildings size={24} className="text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground-primary">Select Company</h2>
            <p className="text-sm text-foreground-tertiary">Choose a company to manage its teams</p>
          </div>
        </div>
        
        <SelectField
          value={selectedCompany?.toString() || ""}
          onChange={(e) => {
            setSelectedCompany(e.target.value ? parseInt(e.target.value) : null);
            setSearchTerm("");
            setEditingTeam(null);
          }}
          options={[
            { value: "", label: "Select a company..." },
            ...companies.map((company) => ({
              value: company.id.toString(),
              label: company.name
            }))
          ]}
        />
      </div>

      {/* Teams Section */}
      {selectedCompany && (
        <div className="bg-surface-primary rounded-xl shadow-sm border border-border-primary overflow-hidden">
          {/* Search Header */}
          <div className="p-4 border-b border-border-primary bg-background-secondary dark:bg-background-tertiary">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search teams by name or description..."
                containerClassName="flex-1"
              />
              
              <div className="flex items-center gap-2 text-sm text-foreground-secondary">
                <Users size={18} />
                <span>{filteredTeams.length} team{filteredTeams.length !== 1 ? "s" : ""}</span>
                {searchTerm && teams.length !== filteredTeams.length && (
                  <span className="text-foreground-tertiary">of {teams.length}</span>
                )}
              </div>
            </div>
          </div>

          {/* Teams List */}
          {loading ? (
            <LoadingSpinner text="Loading teams..." />
          ) : filteredTeams.length === 0 ? (
            <EmptyState
              icon={Users}
              title={searchTerm ? "No teams found" : "No teams yet"}
              description={searchTerm 
                ? "Try a different search term" 
                : "Create a team to get started"
              }
              action={!searchTerm ? {
                label: "Create Team",
                onClick: () => setShowCreateModal(true)
              } : undefined}
            />
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
                          <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg mt-1">
                            <Users size={20} className="text-primary-600 dark:text-primary-400" />
                          </div>
                          <div className="flex-1 space-y-3">
                            <FormField
                              label="Team Name"
                              value={editingTeam.name}
                              onChange={(e) => setEditingTeam(prev => prev ? { ...prev, name: e.target.value } : null)}
                              placeholder="Team name"
                              autoFocus
                            />
                            <TextAreaField
                              label="Description"
                              value={editingTeam.description}
                              onChange={(e) => setEditingTeam(prev => prev ? { ...prev, description: e.target.value } : null)}
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
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                          >
                            {savingTeamId === team.id ? (
                              <InlineSpinner size="sm" color="white" />
                            ) : (
                              <Check size={16} weight="bold" />
                            )}
                            FloppyDisk
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View mode
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${team.is_default ? "bg-warning/20" : "bg-background-tertiary dark:bg-surface-secondary"}`}>
                          <Users size={20} className={team.is_default ? "text-warning" : "text-foreground-secondary"} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-foreground-primary">{team.name}</h3>
                            {team.is_default && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-warning/20 text-warning rounded-full">
                                <Star size={12} weight="fill" />
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-foreground-tertiary mt-0.5 line-clamp-1">
                            {team.description || "No description"}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-foreground-tertiary">
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
                                ? "text-warning hover:bg-warning/10" 
                                : "text-foreground-tertiary hover:bg-background-tertiary dark:hover:bg-surface-secondary hover:text-warning"
                            }`}
                            title={team.is_default ? "Remove default status" : "Set as default"}
                          >
                            {togglingDefaultId === team.id ? (
                              <InlineSpinner size="sm" color="amber" />
                            ) : team.is_default ? (
                              <Star size={18} weight="fill" />
                            ) : (
                              <StarHalf size={18} />
                            )}
                          </button>
                          
                          <button
                            onClick={() => startEditing(team)}
                            className="p-2 text-foreground-tertiary hover:bg-background-tertiary dark:hover:bg-surface-secondary hover:text-primary-600 dark:hover:text-primary-400 rounded-lg transition-colors"
                            title="PencilSimple team"
                          >
                            <Pencil size={18} />
                          </button>
                          
                          <a
                            href={`/sa/teams/${selectedCompany}/${team.id}`}
                            className="p-2 text-foreground-tertiary hover:bg-background-tertiary dark:hover:bg-surface-secondary hover:text-success rounded-lg transition-colors"
                            title="Manage members & permissions"
                          >
                            <Users size={18} />
                          </a>
                          
                          {!team.is_default && (
                            <button
                              onClick={() => setTeamToDelete(team)}
                              disabled={deletingTeamId === team.id}
                              className="p-2 text-foreground-tertiary hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                              title="Delete team"
                            >
                              {deletingTeamId === team.id ? (
                                <InlineSpinner size="sm" color="red" />
                              ) : (
                                <TrashSimple size={18} />
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
        <EmptyState
          icon={Buildings}
          title="Select a Company"
          description="Choose a company from the dropdown above to view and manage its teams, members, and permissions"
        />
      )}

      {/* Create Team Modal */}
      <SuperadminFormModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setNewTeam({ name: "", description: "", isDefault: false });
        }}
        onSubmit={(e) => {
          e.preventDefault();
          createTeam();
        }}
        title="Create New Team"
        subtitle={selectedCompanyData ? `Creating team for ${selectedCompanyData.name}` : undefined}
        icon={Plus}
        colorScheme="blue"
        saving={creatingTeam}
        submitDisabled={!newTeam.name.trim()}
        submitText="Create Team"
      >
        <div className="space-y-4">
          <FormField
            label="Team Name"
            value={newTeam.name}
            onChange={(e) => setNewTeam(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Engineering, Marketing, HR"
            required
          />

          <TextAreaField
            label="Description"
            value={newTeam.description}
            onChange={(e) => setNewTeam(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Brief description of this team's purpose"
            rows={3}
          />

          <CheckboxField
            label="Set as default team"
            description="New employees will be automatically added to this team"
            checked={newTeam.isDefault}
            onChange={(e) => setNewTeam(prev => ({ ...prev, isDefault: e.target.checked }))}
            variant="card"
          />
        </div>
      </SuperadminFormModal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!teamToDelete}
        onClose={() => setTeamToDelete(null)}
        onConfirm={deleteTeam}
        title="Delete Team"
        message={
          <>
            <p className="text-foreground-secondary mb-4">
              Are you sure you want to delete <span className="font-semibold text-foreground-primary">{teamToDelete?.name}</span>?
            </p>
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300">
              <p className="font-medium">This action cannot be undone.</p>
              <p className="mt-1">All team members and permissions will be removed.</p>
            </div>
          </>
        }
        confirmText="Delete Team"
        variant="danger"
        isLoading={!!deletingTeamId}
      />
    </div>
  );
}
