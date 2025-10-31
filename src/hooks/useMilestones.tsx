"use client";

import { supabase } from "@/lib/supabase/client";
import { useBaseEntity } from "./core";
import { Milestone } from "@/lib/types";

export type { Milestone };

export function useMilestones() {
  const baseResult = useBaseEntity<Milestone>({
    tableName: "milestone_records",
    entityName: "milestone",
    companyScoped: true,
  });

  const updateMilestoneStatus = async (id: number, data: Partial<Milestone>, projectProgress: number) => {
    try {
      const result = await baseResult.updateItem(id, data);
      if (projectProgress === null) projectProgress = 0;

      if (data.status === "Completed") {
        const updatedProjectProgress = projectProgress + (data.weightage || 0)
        console.log("Updated Project Progress:", updatedProjectProgress);
        const { error } = await supabase
          .from("project_records")
          .update({ progress: updatedProjectProgress })
          .eq("id", data.project_id)

        if (error) {
          console.error("Error updating project progress:", error);
          throw error;
        }
      }



      return result;
    } catch (error) {
      console.error("Error updating milestone:", error);
      throw error;
    }
  };


  const fetchProjectMilestones = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from("milestone_records")
        .select("*")
        .eq("project_id", projectId);

      if (error) {
        console.error("Error fetching project milestones:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Error fetching project milestones:", error);
      throw error;
    }
  };

  return {
    ...baseResult,
    milestones: baseResult.items,
    fetchProjectMilestones,
    fetchMilestones: baseResult.fetchItems,
    createMilestone: baseResult.createItem,
    updateMilestone: baseResult.updateItem,
    updateMilestoneStatus,
    deleteMilestone: baseResult.deleteItem,
  };
}
