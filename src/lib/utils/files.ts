/**
 * File upload utilities
 * Shared functions for handling file uploads to Supabase storage
 */

import { supabase } from "@/lib/supabase/client";
import { DatabaseError } from "./auth";

/**
 * Upload multiple files to a storage bucket
 */
export async function uploadManyFiles(files: File[], bucketName: string = 'uploads'): Promise<{ uploadedFilePaths: string[]; error?: string }> {
  try {
    const uploadedFilePaths: string[] = [];
    
    for (const file of files) {
      const fileName = `${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file);

      if (error) {
        throw new DatabaseError(`Failed to upload file ${file.name}`, error.message);
      }

      uploadedFilePaths.push(data.path);
    }

    return { uploadedFilePaths };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    return { uploadedFilePaths: [], error: errorMessage };
  }
}

/**
 * Upload a single file to a storage bucket
 */
export async function uploadFile(file: File, bucketName: string = 'uploads'): Promise<{ uploadedFilePath?: string; error?: string }> {
  try {
    const fileName = `${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file);

    if (error) {
      throw new DatabaseError(`Failed to upload file ${file.name}`, error.message);
    }

    return { uploadedFilePath: data.path };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    return { uploadedFilePath: undefined, error: errorMessage };
  }
}
