"use client";

import { createClient } from "../supabase/client";
import { User } from "@supabase/supabase-js";

export async function getUser(): Promise<{ user: User | null }> {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getUser();

    if (data.user) {
        return { user: data.user };
    }
    if (error)
        console.error(error);
    return { user: null }; // or fetch and return the actual EmployeeBasicInfo
}