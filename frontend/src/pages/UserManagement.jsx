import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Eye,
  EyeOff,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import Layout from "../components/layout/Layout";

import { addNotification } from "../utils/notificationUtils";

function UserManagement() {
  const navigate = useNavigate();

  // =========================
  // STATES
  // =========================

  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [editingUser, setEditingUser] =
    useState(null);

  const [showPassword, setShowPassword] =
    useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "User",
    status: "Active",
    phone: "",
    department: "",
  });

  // =========================
  // FETCH USERS
  // =========================

  const fetchUsers = useCallback(async () => {
    try {
    
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        "http://localhost:5000/api/users",
        {
          method: "GET",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to fetch users"
        );
      }

      setUsers(data.users || []);
      setError("");
    } catch (error) {
      console.error(
        "Fetch users error:",
        error
      );

      setError(
        error.message ||
          "Unable to load users."
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // =========================
  // INITIAL LOAD
  // =========================

  useEffect(() => {
  let cancelled = false;

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        "http://localhost:5000/api/users",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch users"
        );
      }

      if (!cancelled) {
        setUsers(data.users || []);
        setError("");
        setLoading(false);
      }
    } catch (error) {
      console.error(
        "Fetch users error:",
        error
      );

      if (!cancelled) {
        setError(
          error.message ||
            "Unable to load users."
        );

        setLoading(false);
      }
    }
  };

  loadUsers();

  return () => {
    cancelled = true;
  };
}, [navigate]);

  // =========================
  // HANDLE INPUT
  // =========================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =========================
  // OPEN ADD MODAL
  // =========================

  const openAddModal = () => {
    setEditingUser(null);

    setShowPassword(false);

    setFormData({
      name: "",
      email: "",
      password: "",
      role: "User",
      status: "Active",
      phone: "",
      department: "",
    });

    setError("");

    setShowModal(true);
  };

  // =========================
  // OPEN EDIT MODAL
  // =========================

  const openEditModal = (user) => {
    setEditingUser(user);

    setShowPassword(false);

    setFormData({
      name: user.name || "",
      email: user.email || "",
      password: "",
      role: user.role || "User",
      status: user.status || "Active",
      phone: user.phone || "",
      department:
        user.department || "",
    });

    setError("");

    setShowModal(true);
  };

  // =========================
  // CLOSE MODAL
  // =========================

  const closeModal = () => {
    setShowModal(false);

    setEditingUser(null);

    setShowPassword(false);

    setFormData({
      name: "",
      email: "",
      password: "",
      role: "User",
      status: "Active",
      phone: "",
      department: "",
    });

    setError("");
  };

  // =========================
  // CREATE / UPDATE USER
  // =========================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError("");

      const token =
        localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      // =========================
      // BASIC VALIDATION
      // =========================

      if (
        !formData.name.trim() ||
        !formData.email.trim()
      ) {
        setError(
          "Name and email are required."
        );

        return;
      }

      // =========================
      // UPDATE USER
      // =========================

      if (editingUser) {
        const updateBody = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          role: formData.role,
          status: formData.status,
          phone: formData.phone.trim(),
          department:
            formData.department.trim(),
        };

        // Password is optional during edit.
        // Blank = keep existing password.
        if (formData.password.trim()) {
          if (formData.password.length < 6) {
            setError(
              "Password must be at least 6 characters long."
            );

            return;
          }

          updateBody.password =
            formData.password;
        }

        const response = await fetch(
          `http://localhost:5000/api/users/${editingUser._id}`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",

              Authorization: `Bearer ${token}`,
            },

            body: JSON.stringify(updateBody),
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to update user"
          );
        }

        // =========================
        // NOTIFICATION
        // =========================

        addNotification(
          `User ${data.user.name} was updated.`,
          "user"
        );

        alert(
          "User updated successfully!"
        );

        closeModal();

        await fetchUsers();

        return;
      }

      // =========================
      // CREATE USER VALIDATION
      // =========================

      if (!formData.password.trim()) {
        setError(
          "Password is required when creating a user."
        );

        return;
      }

      if (formData.password.length < 6) {
        setError(
          "Password must be at least 6 characters long."
        );

        return;
      }

      // =========================
      // CREATE USER
      // =========================

      const response = await fetch(
        "http://localhost:5000/api/users",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            name: formData.name.trim(),
            email: formData.email.trim(),
            password: formData.password,
            role: formData.role,
            status: formData.status,
            phone: formData.phone.trim(),
            department:
              formData.department.trim(),
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to create user"
        );
      }

      // =========================
      // NOTIFICATION
      // =========================

      addNotification(
        `User ${data.user.name} was added.`,
        "user"
      );

      alert(
        "User created successfully!"
      );

      closeModal();

      await fetchUsers();
    } catch (error) {
      console.error(
        "Save user error:",
        error
      );

      setError(
        error.message ||
          "Something went wrong."
      );
    }
  };

  // =========================
  // DELETE USER
  // =========================

  const handleDelete = async (user) => {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete ${user.name}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const token =
        localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/users/${user._id}`,
        {
          method: "DELETE",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete user"
        );
      }

      addNotification(
        `User ${user.name} was deleted.`,
        "user"
      );

      alert(
        "User deleted successfully!"
      );

      await fetchUsers();
    } catch (error) {
      console.error(
        "Delete user error:",
        error
      );

      setError(
        error.message ||
          "Unable to delete user."
      );
    }
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <Layout>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md p-10 text-center text-gray-500 dark:text-slate-400">
          Loading users...
        </div>
      </Layout>
    );
  }

  // =========================
  // MAIN UI
  // =========================

  return (
    <Layout>

      {/* =========================
          HEADER
      ========================= */}

      <div className="flex justify-between items-start mb-8">

        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
            User Management
          </h1>

          <p className="text-gray-500 dark:text-slate-400 mt-2">
            Manage system users, roles and account status.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold transition"
        >
          + Add User
        </button>

      </div>

      {/* =========================
          ERROR
      ========================= */}

      {error && !showModal && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* =========================
          USERS TABLE
      ========================= */}

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full">

            {/* HEADER */}

            <thead>

              <tr className="border-b border-gray-200 dark:border-slate-600">

                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-500 dark:text-slate-400">
                  Name
                </th>

                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-500 dark:text-slate-400">
                  Email
                </th>

                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-500 dark:text-slate-400">
                  Role
                </th>

                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-500 dark:text-slate-400">
                  Status
                </th>

                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-500 dark:text-slate-400">
                  Actions
                </th>

              </tr>

            </thead>

            {/* BODY */}

            <tbody>

              {users.length === 0 ? (

                <tr>

                  <td
                    colSpan="5"
                    className="text-center py-10 text-gray-500 dark:text-slate-400"
                  >
                    No users found.
                  </td>

                </tr>

              ) : (

                users.map((user) => (

                  <tr
                    key={user._id}
                    className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                  >

                    {/* NAME */}

                    <td className="px-6 py-4">

                      <p className="font-medium text-slate-800 dark:text-white">
                        {user.name}
                      </p>

                    </td>

                    {/* EMAIL */}

                    <td className="px-6 py-4 text-gray-600 dark:text-slate-300">
                      {user.email}
                    </td>

                    {/* ROLE */}

                    <td className="px-6 py-4">

                      <span className="px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-600">
                        {user.role}
                      </span>

                    </td>

                    {/* STATUS */}

                    <td className="px-6 py-4">

                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          user.status === "Active"
                            ? "bg-green-50 text-green-600"
                            : "bg-red-50 text-red-600"
                        }`}
                      >
                        {user.status}
                      </span>

                    </td>

                    {/* ACTIONS */}

                    <td className="px-6 py-4">

                      <div className="flex gap-3">

                        <button
                          type="button"
                          onClick={() =>
                            openEditModal(user)
                          }
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(user)
                          }
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Delete
                        </button>

                      </div>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* =========================
          ADD / EDIT MODAL
      ========================= */}

      {showModal && (

        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">

            {/* MODAL HEADER */}

            <div className="flex justify-between items-center mb-6">

              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">

                {editingUser
                  ? "Edit User"
                  : "Add User"}

              </h2>

              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-white text-2xl"
              >
                ×
              </button>

            </div>

            {/* MODAL ERROR */}

            {error && (
              <div className="mb-5 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {/* FORM */}

            <form onSubmit={handleSubmit}>

              <div className="space-y-5">

                {/* NAME */}

                <div>

                  <label className="block font-medium mb-2 text-slate-800 dark:text-white">
                    Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    className="w-full border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                  />

                </div>

                {/* EMAIL */}

                <div>

                  <label className="block font-medium mb-2 text-slate-800 dark:text-white">
                    Email
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email"
                    className="w-full border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                  />

                </div>

                {/* PASSWORD */}

                <div>

                  <label className="block font-medium mb-2 text-slate-800 dark:text-white">
                    {editingUser
                      ? "New Password"
                      : "Password"}
                  </label>

                  <div className="relative">

                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder={
                        editingUser
                          ? "Leave blank to keep current password"
                          : "Enter password"
                      }
                      autoComplete={
                        editingUser
                          ? "new-password"
                          : "new-password"
                      }
                      className="w-full border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3 pr-12 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (previous) =>
                            !previous
                        )
                      }
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-white"
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </button>

                  </div>

                  {editingUser && (
                    <p className="text-xs text-gray-400 mt-2">
                      Leave this field blank to keep the current password.
                    </p>
                  )}

                </div>

                {/* ROLE */}

                <div>

                  <label className="block font-medium mb-2 text-slate-800 dark:text-white">
                    Role
                  </label>

                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                  >

                    <option value="Admin">
                      Admin
                    </option>

                    <option value="Engineer">
                      Engineer
                    </option>

                    <option value="User">
                      User
                    </option>

                  </select>

                </div>

                {/* STATUS */}

                <div>

                  <label className="block font-medium mb-2 text-slate-800 dark:text-white">
                    Status
                  </label>

                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                  >

                    <option value="Active">
                      Active
                    </option>

                    <option value="Inactive">
                      Inactive
                    </option>

                  </select>

                </div>

                {/* PHONE */}

                <div>

                  <label className="block font-medium mb-2 text-slate-800 dark:text-white">
                    Phone
                  </label>

                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    className="w-full border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                  />

                </div>

                {/* DEPARTMENT */}

                <div>

                  <label className="block font-medium mb-2 text-slate-800 dark:text-white">
                    Department
                  </label>

                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="Enter department"
                    className="w-full border border-gray-300 dark:border-slate-600 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                  />

                </div>

              </div>

              {/* BUTTONS */}

              <div className="flex justify-end gap-4 mt-8">

                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-3 rounded-xl border border-gray-300 dark:border-slate-600 text-slate-800 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition"
                >
                  {editingUser
                    ? "Update User"
                    : "Create User"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </Layout>
  );
}

export default UserManagement;