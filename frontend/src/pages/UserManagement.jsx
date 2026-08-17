import { useState } from "react";
import {
  Search,
  UserPlus,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

import Layout from "../components/layout/Layout";
import { addNotification } from "../utils/notificationUtils";

function UserManagement() {
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [editingUserId, setEditingUserId] = useState(null);

  // Delete modal states
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "User",
    status: "Active",
  });

  // Users
  const [users, setUsers] = useState(() => {
    const savedUsers = localStorage.getItem("users");

    if (savedUsers) {
      return JSON.parse(savedUsers);
    }

    const defaultUsers = [
      {
        id: 1,
        name: "Rahul Sharma",
        email: "rahul@example.com",
        role: "Engineer",
        status: "Active",
      },
      {
        id: 2,
        name: "Aman Khan",
        email: "aman@example.com",
        role: "Engineer",
        status: "Active",
      },
      {
        id: 3,
        name: "Priya Singh",
        email: "priya@example.com",
        role: "Admin",
        status: "Inactive",
      },
    ];

    localStorage.setItem(
      "users",
      JSON.stringify(defaultUsers)
    );

    return defaultUsers;
  });

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Open Add User Modal
  const handleAddUser = () => {
    setEditingUserId(null);

    setFormData({
      name: "",
      email: "",
      role: "User",
      status: "Active",
    });

    setIsModalOpen(true);
  };

  // Open Edit User Modal
  const handleEditUser = (user) => {
    setEditingUserId(user.id);

    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    });

    setIsModalOpen(true);
  };

  // Add / Update User
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      alert("Please fill all required fields.");
      return;
    }

    // UPDATE USER
    if (editingUserId !== null) {
      const updatedUsers = users.map((user) =>
        user.id === editingUserId
          ? {
              ...user,
              ...formData,
            }
          : user
      );

      setUsers(updatedUsers);

localStorage.setItem(
  "users",
  JSON.stringify(updatedUsers)
);

addNotification(
  `User ${formData.name} was updated.`
);

alert("User updated successfully!");

      setEditingUserId(null);
      setIsModalOpen(false);

      setFormData({
        name: "",
        email: "",
        role: "User",
        status: "Active",
      });

      return;
    }

    // CREATE USER
    const newUser = {
      id:
        users.length > 0
          ? Math.max(...users.map((user) => user.id)) + 1
          : 1,
      ...formData,
    };

    const updatedUsers = [...users, newUser];
setUsers(updatedUsers);

localStorage.setItem(
  "users",
  JSON.stringify(updatedUsers)
);

addNotification(
  `User ${newUser.name} was added.`
);

alert("User added successfully!");
    setFormData({
      name: "",
      email: "",
      role: "User",
      status: "Active",
    });

    setIsModalOpen(false);
  };

  // Open Delete Modal
  const handleDeleteClick = (id) => {
    setSelectedUserId(id);
    setIsDeleteOpen(true);
  };

  // Delete User
  const handleDelete = () => {
  const deletedUser = users.find(
    (user) => user.id === selectedUserId
  );

  const updatedUsers = users.filter(
    (user) => user.id !== selectedUserId
  );

  setUsers(updatedUsers);

  localStorage.setItem(
    "users",
    JSON.stringify(updatedUsers)
  );

  if (deletedUser) {
    addNotification(
      `User ${deletedUser.name} was deleted.`
    );
  }

  setIsDeleteOpen(false);
  setSelectedUserId(null);
};

  // Search Users
  const filteredUsers = users.filter((user) => {
    const searchText = search.toLowerCase();

    return (
      user.name.toLowerCase().includes(searchText) ||
      user.email.toLowerCase().includes(searchText) ||
      user.role.toLowerCase().includes(searchText)
    );
  });

  return (
    <Layout>

      {/* Heading */}

      <div className="flex justify-between items-start mb-8">

        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            User Management
          </h1>

          <p className="text-gray-500 mt-2">
            Manage users, roles and account status.
          </p>
        </div>

        {/* Add User */}

        <button
          onClick={handleAddUser}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl flex items-center gap-2 font-semibold transition"
        >
          <UserPlus size={18} />
          Add User
        </button>

      </div>

      {/* Search */}

      <div className="bg-white rounded-2xl shadow-md p-6 mb-8">

        <div className="relative max-w-xl">

          <Search
            size={18}
            className="absolute left-3 top-3.5 text-gray-400"
          />

          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />

        </div>

      </div>

      {/* Users Table */}

      <div className="bg-white rounded-2xl shadow-md overflow-hidden">

        <table className="w-full">

          <thead className="bg-slate-100">

            <tr>

              <th className="text-left p-4">
                ID
              </th>

              <th className="text-left p-4">
                Name
              </th>

              <th className="text-left p-4">
                Email
              </th>

              <th className="text-left p-4">
                Role
              </th>

              <th className="text-left p-4">
                Status
              </th>

              <th className="text-center p-4">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {filteredUsers.length === 0 ? (

              <tr>

                <td
                  colSpan="6"
                  className="text-center py-10 text-gray-500"
                >
                  No users found.
                </td>

              </tr>

            ) : (

              filteredUsers.map((user) => (

                <tr
                  key={user.id}
                  className="border-t hover:bg-slate-50 transition"
                >

                  {/* ID */}

                  <td className="p-4 font-medium">
                    #{user.id}
                  </td>

                  {/* Name */}

                  <td className="p-4">
                    {user.name}
                  </td>

                  {/* Email */}

                  <td className="p-4 text-gray-600">
                    {user.email}
                  </td>

                  {/* Role */}

                  <td className="p-4">

                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                      {user.role}
                    </span>

                  </td>

                  {/* Status */}

                  <td className="p-4">

                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        user.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {user.status}
                    </span>

                  </td>

                  {/* Actions */}

                  <td className="p-4">

                    <div className="flex justify-center gap-4">

                      {/* Edit */}

                      <button
                        onClick={() =>
                          handleEditUser(user)
                        }
                        className="text-green-600 hover:text-green-800"
                        title="Edit User"
                      >
                        <Pencil size={18} />
                      </button>

                      {/* Delete */}

                      <button
                        onClick={() =>
                          handleDeleteClick(user.id)
                        }
                        className="text-red-600 hover:text-red-800"
                        title="Delete User"
                      >
                        <Trash2 size={18} />
                      </button>

                    </div>

                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>

      {/* Add / Edit User Modal */}

      {isModalOpen && (

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">

            {/* Modal Header */}

            <div className="flex items-center justify-between p-6 border-b">

              <div>

                <h2 className="text-xl font-bold text-slate-800">

                  {editingUserId !== null
                    ? "Edit User"
                    : "Add New User"}

                </h2>

                <p className="text-sm text-gray-500 mt-1">

                  {editingUserId !== null
                    ? "Update user information."
                    : "Create a new user account."}

                </p>

              </div>

              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingUserId(null);
                }}
                className="text-gray-500 hover:text-gray-800"
              >
                <X size={22} />
              </button>

            </div>

            {/* Form */}

            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-5"
            >

              {/* Name */}

              <div>

                <label className="block font-medium mb-2">
                  Name *
                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter user name"
                  className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />

              </div>

              {/* Email */}

              <div>

                <label className="block font-medium mb-2">
                  Email *
                </label>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />

              </div>

              {/* Role */}

              <div>

                <label className="block font-medium mb-2">
                  Role
                </label>

                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                >

                  <option value="User">
                    User
                  </option>

                  <option value="Engineer">
                    Engineer
                  </option>

                  <option value="Admin">
                    Admin
                  </option>

                </select>

              </div>

              {/* Status */}

              <div>

                <label className="block font-medium mb-2">
                  Status
                </label>

                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                >

                  <option value="Active">
                    Active
                  </option>

                  <option value="Inactive">
                    Inactive
                  </option>

                </select>

              </div>

              {/* Buttons */}

              <div className="flex justify-end gap-3 pt-3">

                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingUserId(null);
                  }}
                  className="px-5 py-3 rounded-xl border hover:bg-gray-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                >

                  {editingUserId !== null
                    ? "Update User"
                    : "Create User"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* Delete User Modal */}

      {isDeleteOpen && (

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">

            <h2 className="text-xl font-bold text-slate-800">
              Delete User
            </h2>

            <p className="text-gray-500 mt-2">
              Are you sure you want to delete this user?
              This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3 mt-6">

              <button
                type="button"
                onClick={() => {
                  setIsDeleteOpen(false);
                  setSelectedUserId(null);
                }}
                className="px-5 py-3 rounded-xl border hover:bg-gray-100"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className="px-5 py-3 rounded-xl bg-red-600 text-white hover:bg-red-700"
              >
                Delete User
              </button>

            </div>

          </div>

        </div>

      )}

    </Layout>
  );
}

export default UserManagement;