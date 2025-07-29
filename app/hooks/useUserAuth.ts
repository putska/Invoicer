// hooks/useUserAuth.ts
import { useEffect, useState } from "react";

interface UserInfo {
  userId: number;
  permission_level: string;
}

export function useUserAuth() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const response = await fetch("/api/auth/userId");
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUserInfo();
  }, []);

  const hasPermission = (requiredLevels: string[]) => {
    return user && requiredLevels.includes(user.permission_level);
  };

  return { user, hasPermission, loading };
}
