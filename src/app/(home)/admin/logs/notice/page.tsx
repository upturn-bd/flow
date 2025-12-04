"use client";

import React, { useEffect, useState } from "react";
import { useNotices, useNoticeTypes } from "@/hooks/useNotice";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import {
  Search,
  WarningCircle,
  FileText,
  Pencil,
  Trash,
} from "@/lib/icons";
import InlineSpinner from "@/components/ui/InlineSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { motion } from "framer-motion";
import NoticeUpdateModal from "@/components/ops/notice/NoticeUpdateModal";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/auth-context";

function formatDate(dateStr?: string) {
  if (!dateStr) return "N/A";
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr?: string) {
  if (!dateStr) return "N/A";
  try {
    return new Date(dateStr).toLocaleString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export default function NoticePage() {
  const { notices, fetchNotices, deleteNotice, updateNotice, loading } =
    useNotices();

  const { canWrite, canDelete } = useAuth();
  const MODULE = "notice"
  const { fetchNoticeTypes } = useNoticeTypes();

  const [searchTerm, setSearchTerm] = useState("");
  const [noticeTypes, setNoticeTypes] = useState<Record<number, string>>({});
  const [filtered, setFiltered] = useState(notices);
  const [editingNotice, setEditingNotice] = useState<any | null>(null);
  const [updating, setUpdating] = useState(false);

  // Fetch notices and types on mount
  useEffect(() => {
    const load = async () => {
      const fetchedNotices = await fetchNotices(true);
      const types = await fetchNoticeTypes();
      const mappedTypes: Record<number, string> = {};
      if (Array.isArray(types)) {
        types.forEach((t: any) => (mappedTypes[t.id] = t.name));
      }
      setNoticeTypes(mappedTypes);
      setFiltered(fetchedNotices);
    };
    load();
  }, []);

  // Search filter
  useEffect(() => {
    if (!searchTerm) {
      setFiltered(notices);
    } else {
      const term = searchTerm.toLowerCase();
      setFiltered(
        notices.filter(
          (n: any) =>
            (n.title || "").toLowerCase().includes(term) ||
            (n.description || "").toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, notices]);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "bg-red-100 text-red-700";
      case "normal":
        return "bg-yellow-100 text-yellow-700";
      case "low":
        return "bg-green-100 text-green-700";
      case "urgent":
        return "bg-red-200 text-red-800 font-semibold";
      default:
        return "bg-background-tertiary dark:bg-surface-secondary text-foreground-secondary";
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this notice?")) {
      await deleteNotice(id);
      await fetchNotices(true);
      toast.success("Notice deleted successfully.")
    }
  };

  const handleUpdate = async (data: any) => {
    setUpdating(true);
    try {
      await updateNotice(data.id, data);
      await fetchNotices(true);
      setEditingNotice(null);
      toast.success("Notice updated successfully.")
    } catch (err) {
      console.error("Update failed:", err);
      toast.error("Notice failed to update.")
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-2">
        <FileText className="text-primary-600" size={26} />
        <h1 className="text-2xl font-semibold">Notice Logs</h1>
      </div>

      {/* Search bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 text-foreground-tertiary" size={16} />
        <input
          placeholder="Search notices..."
          className="pl-8 w-full px-3 py-2 border border-border-primary rounded-lg"
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearchTerm(e.target.value)
          }
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-20 text-foreground-tertiary">
          <InlineSpinner size="md" color="primary" className="mr-2" />
          Loading notices...
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <EmptyState
          icon={WarningCircle}
          title="No notices found"
          description="There are no notices matching your search criteria."
        />
      )}

      {/* List */}
      <div className="space-y-4">
        {!loading &&
          filtered.map((notice: any) => (
            <motion.div
              key={notice.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Card className="flex flex-col md:flex-row items-start md:items-stretch justify-between p-5 rounded-xl border border-border-primary shadow-sm hover:shadow-lg hover:border-blue-100 transition-all duration-200">
                {/* Left section */}
                <div className="flex-1 w-full space-y-3">
                  {/* Title */}
                  <h2 className="text-lg font-semibold text-foreground-primary tracking-tight">
                    {notice.title}
                  </h2>

                  {/* Badges below title */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`${getUrgencyColor(
                        notice.urgency
                      )} inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize`}
                    >
                      {notice.urgency}
                    </span>
                    {notice.notice_type_id && (
                      <span className="inline-flex items-center rounded-full bg-background-tertiary dark:bg-surface-secondary border border-border-secondary px-2 py-0.5 text-xs font-medium text-foreground-secondary">
                        {noticeTypes[notice.notice_type_id] || "General"}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-foreground-secondary leading-relaxed">
                    {notice.description}
                  </p>

                  {/* Meta info */}
                  <div className="text-xs text-foreground-tertiary border-t border-border-primary pt-2">
                    <p>
                      <span className="font-medium text-foreground-secondary">Valid:</span>{" "}
                      {formatDate(notice.valid_from)} →{" "}
                      {formatDate(notice.valid_till)}
                    </p>
                    <p>
                      <span className="font-medium text-foreground-secondary">Created:</span>{" "}
                      {formatDateTime(notice.created_at)}
                    </p>
                  </div>
                </div>

                {/* Action buttons (icons only) */}
                <div className="flex items-center gap-2 mt-4 md:mt-0 md:ml-6 self-end md:self-center">
                  {canWrite(MODULE) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border-secondary hover:bg-primary-50 dark:hover:bg-primary-950 hover:text-primary-600"
                      title="Edit Notice"
                      onClick={() => setEditingNotice(notice)}
                    >
                      <Pencil size={16} />
                    </Button>

                  )}


                  {canDelete(MODULE) && (
                    <Button
                      variant="danger"
                      size="sm"
                      className="bg-red-500 hover:bg-red-600 text-white"
                      title="Delete Notice"
                      onClick={() => handleDelete(notice.id)}
                    >
                      <Trash size={16} />
                    </Button>
                  )}

                </div>
              </Card>
            </motion.div>
          ))}
      </div>

      {/* Update modal */}
      {editingNotice && (
        <NoticeUpdateModal
          initialData={editingNotice}
          onSubmit={handleUpdate}
          onClose={() => setEditingNotice(null)}
          isLoading={updating}
        />
      )}
    </div>
  );
}
