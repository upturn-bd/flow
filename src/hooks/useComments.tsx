"use client";

import {
  createComment as cComment,
  deleteComment as dComment,
  getComments,
  updateComment as uComment,
} from "@/lib/api/operations-and-services/project/comment";
import { commentSchema } from "@/lib/types";
import { useState, useCallback } from "react";
import { z } from "zod";

export type Comment = z.infer<typeof commentSchema>;

export function useComments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getComments();
      setComments(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createComment = async (comment: Comment) => {
    const data = await cComment(comment);
    return { success: true, status: 200, data };
  };

  const updateComment = async (comment: Comment) => {
    const data = await uComment(comment);
    return { success: true, status: 200, data };
  };

  const deleteComment = async (id: number) => {
    const data = await dComment(id);
    return { success: true, status: 200, data };
  };

  return {
    comments,
    loading,
    fetchComments,
    createComment,
    updateComment,
    deleteComment,
  };
}
