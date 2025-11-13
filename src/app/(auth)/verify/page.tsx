"use client";

import React, { Suspense } from "react";
import VerifyContent from "./VerifyClient";

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-screen">
          Loading...
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
