"use client";

import { Suspense } from "react";
import ProjectLayout from "./ProjectLayout";

export default function ProjectPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProjectLayout />
    </Suspense>
  );
}
