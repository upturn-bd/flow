/**
 * File upload utilities
 * Shared functions for handling file uploads to Supabase storage
 */

import { supabase } from "@/lib/supabase/client";
import { DatabaseError, getUserId } from "./auth";

/**
 * Upload multiple files to a storage bucket
 */
export async function uploadManyFiles(files: File[], bucketName: string = 'uploads'): Promise<{ uploadedFilePaths: string[]; publicUrls: string[]; error?: string }> {
  try {
    const uploadedFilePaths: string[] = [];
    const publicUrls: string[] = [];
    const userId = await getUserId();

    for (const file of files) {
      const fileName = `${userId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file);

      if (error) {
        console.log(error);
        throw new DatabaseError(`Failed to upload file ${file.name}`, error.message);
      }

      // Get the public URL for the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);

      uploadedFilePaths.push(data.path);
      publicUrls.push(publicUrlData.publicUrl);
    }

    return { uploadedFilePaths, publicUrls };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    return { uploadedFilePaths: [], publicUrls: [], error: errorMessage };
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
