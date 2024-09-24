// app/admin/page.tsx
"use client";

import { useState, useEffect } from "react";
import axios from "axios";

type User = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  permission_level: string;
};

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Fetch users when the page loads
    axios
      .get("/api/admin/getUsers")
      .then((response) => {
        setUsers(response.data.users);
        setLoading(false);
      })
      .catch((err) => {
        setError("Error fetching users");
        setLoading(false);
      });
  }, []);

  const handlePermissionChange = (userId: string, newPermission: string) => {
    axios
      .post("/api/admin/updatePermission", {
        userId,
        permission_level: newPermission,
      })
      .then((response) => {
        // Update the users state with the new permission level
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === userId
              ? { ...user, permission_level: newPermission }
              : user
          )
        );
      })
      .catch((err) => {
        console.error("Error updating permission:", err);
        setError("Error updating permission");
      });
  };

  if (loading) return <p>Loading users...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">
        Admin - Manage User Permissions
      </h1>
      <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr>
            <th className="border px-4 py-2">Email</th>
            <th className="border px-4 py-2">First Name</th>
            <th className="border px-4 py-2">Last Name</th>
            <th className="border px-4 py-2">Permission Level</th>
            <th className="border px-4 py-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td className="border px-4 py-2">{user.email}</td>
              <td className="border px-4 py-2">{user.first_name}</td>
              <td className="border px-4 py-2">{user.last_name}</td>
              <td className="border px-4 py-2">{user.permission_level}</td>
              <td className="border px-4 py-2">
                <select
                  value={user.permission_level}
                  onChange={(e) =>
                    handlePermissionChange(user.id, e.target.value)
                  }
                  className="p-2 border border-gray-300"
                >
                  <option value="read">Read</option>
                  <option value="write">Write</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
