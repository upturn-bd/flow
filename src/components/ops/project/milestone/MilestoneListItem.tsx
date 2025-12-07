"use client";

import React from "react";
import { motion } from "framer-motion";
import { Pencil, ArrowSquareOut } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Milestone, Project } from "@/lib/types/schemas";

interface MilestoneListItemProps {
  milestone: Milestone;
  projectDetails: Project;
  onMilestoneStatusUpdate: (id: number, updated: Milestone) => void;
  setSelectedMilestone: (milestone: Milestone) => void;
  setMilestoneDetailsId: (id: number) => void;
  index?: number;
}

const MilestoneListItem: React.FC<MilestoneListItemProps> = ({
  milestone,
  projectDetails,
  onMilestoneStatusUpdate,
  setSelectedMilestone,
  setMilestoneDetailsId,
  index,
}) => {
  return (
    <motion.div
      key={milestone.id ?? index}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-border-primary rounded-lg p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-center gap-3">
          <h4 className="font-semibold text-foreground-primary">
            {milestone.milestone_title}
          </h4>
          <span className="text-xs font-medium bg-blue-100 px-2 py-1 rounded-full text-blue-600">
            {milestone.weightage}%
          </span>

          {milestone.status === "Completed" && (
            <span className="text-xs font-medium text-success bg-success/10 dark:bg-success/20 px-2 py-1 rounded-full">
              Completed
            </span>
          )}
          {milestone.status === "In Progress" && (
            <span className="text-xs font-medium text-warning bg-warning/10 dark:bg-warning/20 px-2 py-1 rounded-full">
              In Progress
            </span>
          )}
          {milestone.status === "Not Started" && (
            <span className="text-xs font-medium text-error bg-error/10 dark:bg-error/20 px-2 py-1 rounded-full">
              Not Started
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {milestone.status === "Not Started" && (
            <Button
              variant="pending"
              size="sm"
              onClick={() =>
                milestone.id &&
                onMilestoneStatusUpdate(milestone.id, {
                  ...milestone,
                  status: "In Progress",
                })
              }
            >
              Mark as In Progress
            </Button>
          )}

          {milestone.status === "In Progress" && (
            <Button
              variant="complete"
              size="sm"
              onClick={() =>
                milestone.id &&
                onMilestoneStatusUpdate(milestone.id, {
                  ...milestone,
                  status: "Completed",
                })
              }
            >
              Mark as Complete
            </Button>
          )}

          {projectDetails.status !== "Completed" && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedMilestone(milestone)}
              >
                <Pencil size={14} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  milestone.id && setMilestoneDetailsId(milestone.id)
                }
              >
                <ArrowSquareOut size={14} />
              </Button>
            </div>
          )}
        </div>
      </div>

      <p className="text-sm text-foreground-secondary">{milestone.description}</p>

      <div className="flex items-center justify-between text-sm text-foreground-tertiary">
        <span>
          {milestone.start_date} - {milestone.end_date}
        </span>
      </div>
    </motion.div>
  );
};

export default MilestoneListItem;
