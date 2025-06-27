"use client";

import { useBaseEntity } from "./core/useBaseEntity";
import { Comment } from "@/lib/types";

export function useComments() {
  const baseResult = useBaseEntity<Comment>({
    tableName: "comments",
    entityName: "comment",
    companyScoped: true,
  });
  
  return {
    ...baseResult,
    comments: baseResult.items,
    fetchComments: baseResult.fetchItems,
    createComment: baseResult.createItem,
    updateComment: baseResult.updateItem,
    deleteComment: baseResult.deleteItem,
  };
}
