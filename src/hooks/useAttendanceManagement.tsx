"use client";

import {
  createSite as cSite,
  deleteSite as dSite,
  getSites,
  updateSite as uSite,
} from "@/lib/api/admin-management/attendance";
import { siteSchema } from "@/lib/types";
import { useState, useCallback } from "react";
import { z } from "zod";

export type Site = z.infer<typeof siteSchema>;

export function useSites() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSites = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSites();
      setSites(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createSite = async (
    site: Omit<Site, "id" | "company_id" | "created_at" | "updated_at">
  ) => {
    const data = await cSite(site);
    return { success: true, status: 200, data };
  };

  const updateSite = async (site: Site) => {
    const data = await uSite(site);
    return { success: true, status: 200, data };
  };

  const deleteSite = async (id: number) => {
    const data = await dSite(id);
    return { success: true, status: 200, data };
  };

  return {
    sites,
    loading,
    fetchSites,
    createSite,
    updateSite,
    deleteSite,
  };
}
