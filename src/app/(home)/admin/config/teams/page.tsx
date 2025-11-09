"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Plus, Settings, Trash2, Edit, UserPlus, Shield } from "lucide-react";
import { useTeams } from "@/hooks/useTeams";
import { usePermissions } from "@/hooks/usePermissions";
import type { Team, TeamWithMembers, TeamWithPermissions } from "@/lib/types/schemas";
import { Button } from "@/components/ui/button";
import BaseModal from "@/components/ui/modals/BaseModal";
import toast from "react-hot-toast";
import TeamForm from "@/components/admin/teams/TeamForm";
import TeamMembersModal from "@/components/admin/teams/TeamMembersModal";
import TeamPermissionsModal from "@/components/admin/teams/TeamPermissionsModal";

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

  const { 
    fetchTeams, 
    fetchTeamWithMembers,
    fetchTeamWithPermissions,
    createTeam, 
    updateTeam, 
    deleteTeam, 
    loading 
  } = useTeams();

  const { canWrite, canDelete } = usePermissions();
  const canManageTeams = canWrite('teams');
  const canDeleteTeams = canDelete('teams');

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    const data = await fetchTeams();
    setTeams(data);
  };

  const handleCreateTeam = async (teamData: Partial<Team>) => {
    const result = await createTeam(teamData as Omit<Team, 'id'>);
    if (result.success) {
      toast.success("Team created successfully");
      setIsCreating(false);
      loadTeams();
    } else {
      toast.error("Failed to create team");
    }
  };

  const handleUpdateTeam = async (teamData: Partial<Team>) => {
    if (!selectedTeam?.id) return;

    const result = await updateTeam(selectedTeam.id, teamData);
    if (result.success) {
      toast.success("Team updated successfully");
      setIsEditing(false);
      setSelectedTeam(null);
      loadTeams();
    } else {
      toast.error("Failed to update team");
    }
  };

  const handleDeleteTeam = async () => {
    if (!selectedTeam?.id) return;

    const result = await deleteTeam(selectedTeam.id);
    if (result.success) {
      toast.success("Team deleted successfully");
      setShowDeleteModal(false);
      setSelectedTeam(null);
      loadTeams();
    } else {
      toast.error("Failed to delete team");
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
    <div className="min-h-screen bg-gray-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Shield className="h-7 w-7 text-indigo-600" />
              Team Management
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage teams and assign granular permissions
            </p>
          </div>

          {canManageTeams && (
            <Button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Team
            </Button>
          )}
        </div>
      </motion.div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map((team, index) => (
          <motion.div
            key={team.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  team.is_default 
                    ? 'bg-indigo-100' 
                    : 'bg-gray-100'
                }`}>
                  <Users className={`h-5 w-5 ${
                    team.is_default 
                      ? 'text-indigo-600' 
                      : 'text-gray-600'
                  }`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{team.name}</h3>
                  {team.is_default && (
                    <span className="text-xs text-indigo-600">Default Team</span>
                  )}
                </div>
              </div>

              {canManageTeams && !team.is_default && (
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEditTeam(team)}
                    className="p-1 hover:bg-gray-100 rounded"
                    title="Edit team"
                  >
                    <Edit className="h-4 w-4 text-gray-600" />
                  </button>
                  {canDeleteTeams && (
                    <button
                      onClick={() => handleDeleteClick(team)}
                      className="p-1 hover:bg-red-50 rounded"
                      title="Delete team"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {team.description && (
              <p className="text-sm text-gray-600 mb-4">{team.description}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => handleManageMembers(team)}
                className="flex-1 px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Members
              </button>
              <button
                onClick={() => handleManagePermissions(team)}
                className="flex-1 px-3 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors flex items-center justify-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Permissions
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {teams.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No teams found</p>
          {canManageTeams && (
            <Button
              onClick={() => setIsCreating(true)}
              className="mt-4"
            >
              Create Your First Team
            </Button>
          )}
        </div>
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
          setShowDeleteModal(false);
          setSelectedTeam(null);
        }}
        title="Delete Team"
      >
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete <strong>{selectedTeam?.name}</strong>? 
            This action cannot be undone and all team members will lose their team-based permissions.
          </p>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedTeam(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDeleteTeam}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Team
            </Button>
          </div>
        </div>
      </BaseModal>
    </div>
  );
}
