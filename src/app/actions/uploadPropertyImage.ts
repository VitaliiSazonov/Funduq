"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function uploadPropertyImage(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) return { success: false, error: "No file provided" };
    
    const fileName = formData.get("fileName") as string;
    if (!fileName) return { success: false, error: "No fileName provided" };

    const supabaseAdmin = createAdminClient();

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from("properties-images")
      .upload(`uploads/${fileName}`, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("[uploadPropertyImage] Supabase error:", uploadError);
      return { success: false, error: uploadError.message };
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from("properties-images")
      .getPublicUrl(`uploads/${fileName}`);

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error("[uploadPropertyImage] Server error:", error);
    return { success: false, error: "Server error during upload" };
  }
}
