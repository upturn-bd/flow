"use client";

import { useEffect, useState } from "react";

type UserData = {
  first_name: string;
  last_name: string;
  email: string;
  role: string;
} | null;

export function useUserData() {
  const [userData, setUserData] = useState<UserData>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/onboarding");
        if (response.ok) {
          const { data } = await response.json();
          setUserData(data);
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  return { userData, loading };
}