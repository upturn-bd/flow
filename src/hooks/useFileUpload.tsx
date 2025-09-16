"use client";

import { useState } from "react";
import { uploadManyFiles, uploadFile as uploadSingleFile } from "@/lib/utils/files";

export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Upload multiple files to a specified bucket
  const uploadFiles = async (files: File[], bucketName: string) => {
    setUploading(true);
    setError(null);
    try {
      const result = await uploadManyFiles(files, bucketName);
      if (result.error) {
        throw result.error;
      }
      return { success: true, fileUrls: result.uploadedFilePaths };
    } catch (err) {
      console.log(err);
      setError(err instanceof Error ? err : new Error(String(err)));
      return { success: false, error: err };
    } finally {
      setUploading(false);
    }
  };

  // Upload a single file to the education-certificates bucket
  const uploadEducationFile = async (file: File | null) => {
    if (!file) {
      return { success: false, error: "No file provided" };
    }
    
    setUploading(true);
    setError(null);
    try {
      const result = await uploadSingleFile(file);
      if (result.error) {
        throw new Error(result.error);
      }
      return { success: true };
    } catch (err) {
      console.error("Error uploading education file:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      return { success: false, error: err };
    } finally {
      setUploading(false);
    }
  };

  return {
    uploading,
    error,
    uploadFiles,
    uploadEducationFile
  };
} 