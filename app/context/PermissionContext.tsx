"use client";

import React, { createContext, useState, useEffect, ReactNode } from "react";
import { useUser } from "@clerk/nextjs";
import axios from "axios";

interface PermissionContextProps {
  permissionLevel: string | null;
  hasWritePermission: boolean;
  isLoaded: boolean;
}

export const PermissionContext = createContext<PermissionContextProps>({
  permissionLevel: null,
  hasWritePermission: false,
  isLoaded: false,
});

interface PermissionProviderProps {
  children: ReactNode;
}

export const PermissionProvider: React.FC<PermissionProviderProps> = ({
  children,
}) => {
  const [permissionLevel, setPermissionLevel] = useState<string | null>(null);
  const [hasWritePermission, setHasWritePermission] = useState<boolean>(false);
  const { isLoaded, user } = useUser();

  useEffect(() => {
    if (isLoaded && user) {
      axios
        .get(`/api/users/${user.id}`)
        .then((response) => {
          const permission = response.data.user.permission_level;
          setPermissionLevel(permission);
          setHasWritePermission(
            permission === "write" || permission === "admin"
          );
        })
        .catch((err) => {
          console.error("Error fetching user permissions:", err);
          // Handle error appropriately
        });
    } else if (isLoaded && !user) {
      // User is not signed in
      setPermissionLevel(null);
      setHasWritePermission(false);
    }
  }, [isLoaded, user]);

  return (
    <PermissionContext.Provider
      value={{ permissionLevel, hasWritePermission, isLoaded }}
    >
      {children}
    </PermissionContext.Provider>
  );
};
