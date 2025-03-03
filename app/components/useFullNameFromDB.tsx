"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

export function useFullNameFromDB() {
  const { user } = useUser();
  const [fullName, setFullName] = useState<string>("");

  useEffect(() => {
    async function fetchUserName() {
      if (user) {
        try {
          const res = await fetch("/api/getUser", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clerk_id: user.id }),
          });
          if (res.ok) {
            const data = await res.json();
            // Assuming your database returns first_name and last_name
            setFullName(`${data.first_name} ${data.last_name}`);
          } else {
            console.error("Error fetching user data:", await res.text());
          }
        } catch (err) {
          console.error("Fetch error:", err);
        }
      }
    }

    fetchUserName();
  }, [user]);

  return fullName;
}
