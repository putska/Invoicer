// app/admin/page.tsx
"use client";

export const dynamic = "force-dynamic";

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

  // Editing state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editedUser, setEditedUser] = useState<User | null>(null);

  useEffect(() => {
    // Fetch users when the page loads
    axios
      .get("/api/admin/getUsers")
      .then((response) => {
        setUsers(response.data.users);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching users:", err);
        setError("Error fetching users");
        setLoading(false);
      });
  }, []);

  // For inline permission changes (existing functionality)
  const handlePermissionChange = (userId: string, newPermission: string) => {
    axios
      .post("/api/admin/updatePermission", {
        userId,
        permission_level: newPermission,
      })
      .then((response) => {
        console.log("Response from updatePermission:", response.data);
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

  // Start editing a user record
  const startEditing = (user: User) => {
    setEditingUserId(user.id);
    // Make a copy so that editing doesn't affect the original until saved
    setEditedUser({ ...user });
  };

  // Cancel editing mode
  const cancelEditing = () => {
    setEditingUserId(null);
    setEditedUser(null);
  };

  // Handle changes in any input field
  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    if (!editedUser) return;
    setEditedUser({ ...editedUser, [e.target.name]: e.target.value });
  };

  // Save the updated user record
  const saveUser = () => {
    if (!editedUser) return;
    axios
      .post("/api/admin/updateUser", editedUser)
      .then((response) => {
        console.log("Response from updateUser:", response.data);
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === editedUser.id ? editedUser : user
          )
        );
        setEditingUserId(null);
        setEditedUser(null);
      })
      .catch((err) => {
        console.error("Error updating user:", err);
        setError("Error updating user");
      });
  };

  if (loading) return <p>Loading users...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Admin - Manage Users</h1>
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
          {users.map((user) =>
            editingUserId === user.id && editedUser ? (
              <tr key={user.id}>
                <td className="border px-4 py-2">
                  <input
                    type="email"
                    name="email"
                    value={editedUser.email}
                    onChange={handleEditChange}
                    className="p-2 border border-gray-300"
                  />
                </td>
                <td className="border px-4 py-2">
                  <input
                    type="text"
                    name="first_name"
                    value={editedUser.first_name}
                    onChange={handleEditChange}
                    className="p-2 border border-gray-300"
                  />
                </td>
                <td className="border px-4 py-2">
                  <input
                    type="text"
                    name="last_name"
                    value={editedUser.last_name}
                    onChange={handleEditChange}
                    className="p-2 border border-gray-300"
                  />
                </td>
                <td className="border px-4 py-2">
                  <select
                    name="permission_level"
                    value={editedUser.permission_level}
                    onChange={handleEditChange}
                    className="p-2 border border-gray-300"
                  >
                    <option value="read">Read</option>
                    <option value="write">Write</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="border px-4 py-2">
                  <button
                    onClick={saveUser}
                    className="bg-green-500 text-white px-3 py-1 mr-2 rounded"
                  >
                    Save
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="bg-gray-500 text-white px-3 py-1 rounded"
                  >
                    Cancel
                  </button>
                </td>
              </tr>
            ) : (
              <tr key={user.id}>
                <td className="border px-4 py-2">{user.email}</td>
                <td className="border px-4 py-2">{user.first_name}</td>
                <td className="border px-4 py-2">{user.last_name}</td>
                <td className="border px-4 py-2">
                  {/* Inline permission change remains available */}
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
                <td className="border px-4 py-2">
                  <button
                    onClick={() => startEditing(user)}
                    className="bg-blue-500 text-white px-3 py-1 rounded"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}
