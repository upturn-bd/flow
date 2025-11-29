"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, Settings, Trash, Edit, UserPlus, Shield, Search, X, Loader } from "@/lib/icons";
import { useTeams } from "@/hooks/useTeams";
import { useAuth } from "@/lib/auth/auth-context";
import type { Team, TeamWithMembers, TeamWithPermissions } from "@/lib/types/schemas";
import { Button } from "@/components/ui/button";
import BaseModal from "@/components/ui/modals/BaseModal";
import toast from "react-hot-toast";
import TeamForm from "@/components/admin/teams/TeamForm";
import TeamMembersModal from "@/components/admin/teams/TeamMembersModal";
import TeamPermissionsModal from "@/components/admin/teams/TeamPermissionsModal";
import { ModulePermissionsBanner } from "@/components/permissions";
import { PERMISSION_MODULES } from "@/lib/constants";

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedTeamWithMembers, setSelectedTeamWithMembers] = useState<TeamWithMembers | null>(null);
  const [selectedTeamWithPermissions, setSelectedTeamWithPermissions] = useState<TeamWithPermissions | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  const { 
    fetchTeams, 
    fetchTeamWithMembers,
    fetchTeamWithPermissions,
    createTeam, 
    updateTeam, 
    deleteTeam, 
    loading 
  } = useTeams();

  const { canWrite, canDelete } = useAuth();
  const canManageTeams = canWrite('teams');
  const canDeleteTeams = canDelete('teams');

  // Filter teams based on search query
  const filteredTeams = useMemo(() => {
    if (!searchQuery.trim()) return teams;
    
    const query = searchQuery.toLowerCase();
    return teams.filter(team => 
      team.name.toLowerCase().includes(query) ||
      team.description?.toLowerCase().includes(query)
    );
  }, [teams, searchQuery]);

  const loadTeams = async () => {
    const data = await fetchTeams();
    setTeams(data);
  };

  useEffect(() => {
    loadTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateTeam = async (teamData: Partial<Team>) => {
    setIsLoadingAction(true);
    try {
      const result = await createTeam(teamData as Omit<Team, 'id'>);
      if (result.success) {
        toast.success("Team created successfully");
        setIsCreating(false);
        loadTeams();
      } else {
        toast.error(result.error || "Failed to create team");
      }
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleUpdateTeam = async (teamData: Partial<Team>) => {
    if (!selectedTeam?.id) return;

    setIsLoadingAction(true);
    try {
      const result = await updateTeam(selectedTeam.id, teamData);
      if (result.success) {
        toast.success("Team updated successfully");
        setIsEditing(false);
        setSelectedTeam(null);
        loadTeams();
      } else {
        toast.error(result.error || "Failed to update team");
      }
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!selectedTeam?.id) return;

    setIsLoadingAction(true);
    try {
      const result = await deleteTeam(selectedTeam.id);
      if (result.success) {
        toast.success("Team deleted successfully");
        setShowDeleteModal(false);
        setSelectedTeam(null);
        loadTeams();
      } else {
        toast.error(result.error || "Failed to delete team");
      }
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleManageMembers = async (team: Team) => {
    if (!team.id) return;
    const teamWithMembers = await fetchTeamWithMembers(team.id);
    if (teamWithMembers) {
      setSelectedTeamWithMembers(teamWithMembers);
      setShowMembersModal(true);
    } else {
      toast.error("Failed to load team members");
    }
  };

  const handleManagePermissions = async (team: Team) => {
    if (!team.id) return;
    const teamWithPermissions = await fetchTeamWithPermissions(team.id);
    if (teamWithPermissions) {
      setSelectedTeamWithPermissions(teamWithPermissions);
      setShowPermissionsModal(true);
    } else {
      toast.error("Failed to load team permissions");
    }
  };

  const handleEditTeam = (team: Team) => {
    setSelectedTeam(team);
    setIsEditing(true);
  };

  const handleDeleteClick = (team: Team) => {
    setSelectedTeam(team);
    setShowDeleteModal(true);
  };

  return (
    <>
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground-primary flex items-center gap-2">
              <Shield className="h-6 w-6 sm:h-7 sm:w-7 text-indigo-600" />
              Team Management
            </h1>
            <p className="text-sm text-foreground-secondary mt-1">
              Manage teams and assign granular permissions
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Team Count Badge */}
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-lg border border-indigo-100">
              <Users className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-medium text-indigo-900">
                {teams.length} {teams.length === 1 ? 'Team' : 'Teams'}
              </span>
            </div>

            {canManageTeams && (
              <Button
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-2 shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Create Team</span>
                <span className="sm:hidden">New</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Permission Banner */}
      <ModulePermissionsBanner module={PERMISSION_MODULES.TEAMS} title="Teams" compact />

      {/* Search Bar and Filters */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground-tertiary" />
            <input
              type="text"
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border border-border-secondary rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm sm:text-base"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-surface-hover rounded-full transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4 text-foreground-tertiary" />
              </button>
            )}
          </div>
          
          {searchQuery && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 px-3 py-2 bg-background-tertiary dark:bg-surface-secondary rounded-lg text-sm"
            >
              <span className="text-foreground-secondary">
                {filteredTeams.length} result{filteredTeams.length !== 1 ? 's' : ''}
              </span>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Loading State */}
      {loading && teams.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
          <p className="text-foreground-secondary">Loading teams...</p>
        </div>
      )}

      {/* Teams Grid */}
      {!loading && (
        <>
          {filteredTeams.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {filteredTeams.map((team) => (
                <div
                  key={team.id}
                  className="bg-surface-primary rounded-xl border border-border-primary p-5 hover:shadow-lg hover:border-indigo-200 transition-all duration-200 group flex flex-col h-full"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg transition-colors ${
                        team.is_default 
                          ? 'bg-indigo-100 group-hover:bg-indigo-200' 
                          : 'bg-background-tertiary dark:bg-surface-secondary group-hover:bg-surface-hover'
                      }`}>
                        <Users className={`h-5 w-5 ${
                          team.is_default 
                            ? 'text-indigo-600' 
                            : 'text-foreground-secondary'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground-primary truncate" title={team.name}>{team.name}</h3>
                        {team.is_default && (
                          <span className="inline-flex items-center text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded-full mt-1">Default</span>
                        )}
                      </div>
                    </div>

                    {canManageTeams && !team.is_default && (
                      <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                        <button
                          onClick={() => handleEditTeam(team)}
                          className="p-1.5 hover:bg-surface-hover rounded-lg transition-colors"
                          title="Edit team"
                        >
                          <Edit className="h-4 w-4 text-foreground-secondary" />
                        </button>
                        {canDeleteTeams && (
                          <button
                            onClick={() => handleDeleteClick(team)}
                            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete team"
                          >
                            <Trash className="h-4 w-4 text-red-600" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {team.description ? (
                    <p className="text-sm text-foreground-secondary mb-4 line-clamp-2 min-h-[40px]" title={team.description}>
                      {team.description}
                    </p>
                  ) : (
                    <p className="text-sm text-foreground-tertiary italic mb-4 min-h-[40px]">
                      No description
                    </p>
                  )}

                  <div className="flex gap-2 mt-auto">
                    <button
                      onClick={() => handleManageMembers(team)}
                      className="flex-1 px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span className="hidden sm:inline">Members</span>
                    </button>
                    <button
                      onClick={() => handleManagePermissions(team)}
                      className="flex-1 px-3 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      <span className="hidden sm:inline">Permissions</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : searchQuery ? (
            <div className="text-center py-16 px-4">
              <div className="bg-background-tertiary dark:bg-surface-secondary rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Search className="h-10 w-10 text-foreground-tertiary" />
              </div>
              <p className="text-foreground-secondary text-lg font-semibold">No teams found</p>
              <p className="text-foreground-tertiary text-sm mt-2 max-w-md mx-auto">
                No teams match "{searchQuery}". Try a different search term.
              </p>
              <Button
                onClick={() => setSearchQuery("")}
                variant="outline"
                className="mt-6"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Search
              </Button>
            </div>
          ) : (
            <div className="text-center py-16 px-4 bg-surface-primary rounded-xl border-2 border-dashed border-border-secondary">
              <div className="bg-indigo-50 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-10 w-10 text-indigo-400" />
              </div>
              <p className="text-foreground-secondary text-lg font-semibold">No teams yet</p>
              <p className="text-foreground-tertiary text-sm mt-2 mb-6 max-w-md mx-auto">
                Teams help you organize employees and manage permissions efficiently.
              </p>
              {canManageTeams && (
                <Button
                  onClick={() => setIsCreating(true)}
                  className="shadow-sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Team
                </Button>
              )}
            </div>
          )}
        </>
      )}

      {/* Create Team Modal */}
      {isCreating && (
        <TeamForm
          onClose={() => setIsCreating(false)}
          onSubmit={handleCreateTeam}
        />
      )}

      {/* Edit Team Modal */}
      {isEditing && selectedTeam && (
        <TeamForm
          team={selectedTeam}
          onClose={() => {
            setIsEditing(false);
            setSelectedTeam(null);
          }}
          onSubmit={handleUpdateTeam}
        />
      )}

      {/* Members Modal */}
      {showMembersModal && selectedTeamWithMembers && (
        <TeamMembersModal
          isOpen={showMembersModal}
          team={selectedTeamWithMembers}
          onClose={() => {
            setShowMembersModal(false);
            setSelectedTeamWithMembers(null);
          }}
          onMembersUpdated={() => {
            loadTeams();
            // Refresh the team data in the modal
            if (selectedTeamWithMembers.id) {
              fetchTeamWithMembers(selectedTeamWithMembers.id).then(data => {
                if (data) setSelectedTeamWithMembers(data);
              });
            }
          }}
        />
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && selectedTeamWithPermissions && (
        <TeamPermissionsModal
          isOpen={showPermissionsModal}
          team={selectedTeamWithPermissions}
          onClose={() => {
            setShowPermissionsModal(false);
            setSelectedTeamWithPermissions(null);
          }}
          onPermissionsUpdated={() => {
            loadTeams();
            // Refresh the team data in the modal
            if (selectedTeamWithPermissions.id) {
              fetchTeamWithPermissions(selectedTeamWithPermissions.id).then(data => {
                if (data) setSelectedTeamWithPermissions(data);
              });
            }
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <BaseModal
        isOpen={showDeleteModal}
        onClose={() => {
          if (!isLoadingAction) {
            setShowDeleteModal(false);
            setSelectedTeam(null);
          }
        }}
        title="Delete Team"
      >
        <div className="p-6">
          <p className="text-foreground-secondary mb-6">
            Are you sure you want to delete <strong className="text-foreground-primary">{selectedTeam?.name}</strong>? 
            This action cannot be undone and all team members will lose their team-based permissions.
          </p>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedTeam(null);
              }}
              disabled={isLoadingAction}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDeleteTeam}
              disabled={isLoadingAction}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingAction ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Team'
              )}
            </Button>
          </div>
        </div>
      </BaseModal>
    </>
  );
}
