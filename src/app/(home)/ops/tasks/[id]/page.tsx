"use client";

import { useParams } from "next/navigation";
import TaskLayout from "../TaskLayout";

export default function TaskDetailsPage() {
  const { id } = useParams();
  const taskId = id ? Number(id) : null;

  return <TaskLayout selectedTaskId={taskId} />;
}
