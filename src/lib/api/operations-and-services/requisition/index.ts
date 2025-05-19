"use client";

import { createClient } from "@/lib/supabase/client";
import { generateRandomId } from "@/lib/utils";
import { AuthContext } from "@/lib/auth/auth-provider";
import { useContext } from "react";

export async function uploadManyFiles(files: File[], bucketName: string) {
  const supabase = await createClient();
  const { employee } = useContext(AuthContext)!;

  const uploadedFilePaths = [];
  try {
    for (const file of files) {
      // Generate a unique filename to avoid collisions
      const uniqueFilename = `${generateRandomId()}-${file.name}`;
      const filePath = `${employee!.id}/${uniqueFilename}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        console.error(`Error uploading file ${file.name}:`, uploadError);
        continue;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucketName).getPublicUrl(filePath);

      uploadedFilePaths.push(publicUrl);
    }
    return { uploadedFilePaths: uploadedFilePaths, error: null };
  } catch (error) {
    console.error("Error uploading files:", error);
    return { uploadedFilePaths: null, error: error };
  }
}
