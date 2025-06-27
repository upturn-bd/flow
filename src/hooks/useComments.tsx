"use client";

import { useBaseEntity } from "./core/useBaseEntity";
import { Comment } from "@/lib/types/schemas";

// Create a compatible Comment interface for useBaseEntity
interface CommentEntity extends Omit<Comment, 'created_at' | 'updated_at'> {
  id?: number;
  created_at?: string;
  updated_at?: string;
}

export function useComments() {
  const baseResult = useBaseEntity<CommentEntity>({
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
