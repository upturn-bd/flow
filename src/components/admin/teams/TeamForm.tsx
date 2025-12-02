"use client";

import { useState } from "react";
import BaseModal from "@/components/ui/modals/BaseModal";
import { Button } from "@/components/ui/button";
import { FormField, TextAreaField } from "@/components/forms";
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
          <FormField
            label="Team Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            placeholder="Enter team name"
          />

          <TextAreaField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the team's purpose and responsibilities"
            rows={3}
            error={errors.description}
          />
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
