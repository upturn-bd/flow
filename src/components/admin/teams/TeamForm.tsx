"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import BaseModal from "@/components/ui/modals/BaseModal";
import FormInputField from "@/components/ui/FormInputField";
import { Button } from "@/components/ui/button";
import type { Team } from "@/lib/types/schemas";

interface TeamFormProps {
  team?: Team;
  onClose: () => void;
  onSubmit: (data: Partial<Team>) => Promise<void>;
}

export default function TeamForm({ team, onClose, onSubmit }: TeamFormProps) {
  const [name, setName] = useState(team?.name || "");
  const [description, setDescription] = useState(team?.description || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({});

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = "Team name is required";
    } else if (name.trim().length < 3) {
      newErrors.name = "Team name must be at least 3 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title={team ? "Edit Team" : "Create New Team"}
    >
      <form onSubmit={handleSubmit} className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Team Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the team's purpose and responsibilities"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            {team ? "Update Team" : "Create Team"}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}
