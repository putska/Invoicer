// src/components/AuthHandler.tsx
"use client";

import { useUser } from "@clerk/nextjs";
import axios from "axios";
import { useEffect, useState } from "react";

export default function AuthHandler({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded, user } = useUser();
  const [userCreated, setUserCreated] = useState(false);

  useEffect(() => {
    if (isLoaded && user) {
      const email =
        user.primaryEmailAddress?.emailAddress || "no-email@example.com";
      const firstName = user.firstName || "No";
      const lastName = user.lastName || "Name";

      // Call API to create user
      axios
        .post("/api/createUser", {
          clerk_id: user.id,
          email: email,
          first_name: firstName,
          last_name: lastName,
          permission_level: "read",
        })
        .then((response) => {
          console.log("User created or already exists:", response.data);
          setUserCreated(true);
        })
        .catch((err) => {
          console.error("Error creating user:", err);
          setUserCreated(true); // Proceed even if there's an error
        });
    } else if (isLoaded && !user) {
      // User is not signed in
      setUserCreated(true);
    }
  }, [isLoaded, user]);

  if (!userCreated) {
    // Optionally display a loading indicator
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}
