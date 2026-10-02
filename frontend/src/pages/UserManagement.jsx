import {
  useEffect,
  useState,
} from "react";

import {
  Eye,
  EyeOff,
  Users,
  User,
  UserPlus,
  UserCog,
  ShieldCheck,
  Wrench,
  Search,
  Pencil,
  Trash2,
  X,
  Mail,
  Lock,
  Phone,
  Building2,
  CircleAlert,
  LoaderCircle,
  Save,
  ChevronLeft,
  ChevronRight,
  Crown,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import Layout from "../components/layout/Layout";

import { getStoredUser, refreshStoredUser } from "../utils/auth";
import { initials } from "../utils/format";
import useDebouncedValue from "../utils/useDebouncedValue";
import toast from "react-hot-toast";
import { API_URL } from "../config";

const ROLE_TABS = ["", "Admin", "Engineer", "User"];

const roleStyles = {
  Admin: {
    icon: ShieldCheck,
    badge: "bg-violet-50 text-violet-700",
    avatar: "bg-violet-100 text-violet-700",
    selected: "border-violet-400 bg-violet-50",
    description: "Full access",
  },
  Engineer: {
    icon: Wrench,
    badge: "bg-amber-50 text-amber-700",
    avatar: "bg-amber-100 text-amber-700",
    selected: "border-amber-400 bg-amber-50",
    description: "Resolves tickets",
  },
  User: {
    icon: User,
    badge: "bg-slate-100 text-slate-700",
    avatar: "bg-blue-100 text-blue-700",
    selected: "border-blue-400 bg-blue-50",
    description: "Raises tickets",
  },
};

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

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [ownerCandidate, setOwnerCandidate] = useState(null);
  const [transferring, setTransferring] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const currentUser = getStoredUser();

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
  // SERVER LIST STATE
  // =========================

  const USERS_PER_PAGE = 10;

  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [serverRoleCounts, setServerRoleCounts] = useState({});
  const [summary, setSummary] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  // Page is remembered per filter combination, so changing
  // a filter goes back to page 1.
  const filterKey = [search, roleFilter, statusFilter].join("|");

  const [pageState, setPageState] = useState({
    key: filterKey,
    page: 1,
  });

  const currentPage =
    pageState.key === filterKey ? pageState.page : 1;

  const setCurrentPage = (page) =>
    setPageState({ key: filterKey, page });

  // Reload the current page (after create / update / delete)
  const fetchUsers = () => setReloadKey((key) => key + 1);

  // =========================
  // FETCH ONE PAGE OF USERS
  // =========================

  useEffect(() => {
    let cancelled = false;

    const loadUsers = async () => {
      try {
        setFetching(true);

        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/login");
          return;
        }

        const params = new URLSearchParams({
          page: String(currentPage),
          limit: String(USERS_PER_PAGE),
        });

        if (debouncedSearch) params.set("search", debouncedSearch);
        if (roleFilter) params.set("role", roleFilter);
        if (statusFilter) params.set("status", statusFilter);

        const response = await fetch(
          `${API_URL}/api/users?${params}`,
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

        if (cancelled) return;

        // Page became empty (e.g. its last user was deleted):
        // step back one page instead of showing an empty table.
        if ((data.users || []).length === 0 && currentPage > 1) {
          setPageState((prev) => ({
            ...prev,
            page: Math.max(1, prev.page - 1),
          }));
          return;
        }

        setUsers(data.users || []);
        setTotalCount(data.pagination?.total ?? 0);
        setTotalPages(data.pagination?.totalPages ?? 1);
        setServerRoleCounts(data.roleCounts || {});
        setSummary(data.summary || null);
        setError("");
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
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setFetching(false);
        }
      }
    };

    loadUsers();

    return () => {
      cancelled = true;
    };
  }, [
    navigate,
    currentPage,
    debouncedSearch,
    roleFilter,
    statusFilter,
    reloadKey,
  ]);

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
          `${API_URL}/api/users/${editingUser._id}`,
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


        toast.success("User updated successfully!");

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
        `${API_URL}/api/users`,
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


      toast.success("User created successfully!");

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

  // Confirmation happens in the delete modal
  const handleDelete = async (user) => {
    try {
      setError("");

      const token =
        localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/users/${user._id}`,
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


      toast.success("User deleted successfully!");

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
  // COUNTS (from the server)
  // =========================

  const searchText = search.trim();

  const roleCounts = {
    "": serverRoleCounts.all ?? 0,
    Admin: serverRoleCounts.Admin ?? 0,
    Engineer: serverRoleCounts.Engineer ?? 0,
    User: serverRoleCounts.User ?? 0,
  };

  // Current page of users
  const visibleUsers = users;

  const safeCurrentPage = Math.min(currentPage, totalPages);
  const firstIndex = (safeCurrentPage - 1) * USERS_PER_PAGE;

  const firstPageButton = Math.max(
    1,
    Math.min(safeCurrentPage - 2, totalPages - 4)
  );

  const pageButtons = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => firstPageButton + index
  );

  const byRole = summary?.byRole || {};

  const statCards = [
    {
      label: "Total Users",
      value: summary?.total ?? 0,
      hint: `${summary?.active ?? 0} active`,
      icon: Users,
      tile: "bg-blue-50 text-blue-600",
    },
    {
      label: "Admins",
      value: byRole.Admin ?? 0,
      hint: "Full access",
      icon: ShieldCheck,
      tile: "bg-violet-50 text-violet-600",
    },
    {
      label: "Engineers",
      value: byRole.Engineer ?? 0,
      hint: "Resolve tickets",
      icon: Wrench,
      tile: "bg-amber-50 text-amber-600",
    },
    {
      label: "Users",
      value: byRole.User ?? 0,
      hint: "Raise tickets",
      icon: User,
      tile: "bg-emerald-50 text-emerald-600",
    },
  ];

  const hasFilters = Boolean(
    searchText || roleFilter || statusFilter
  );

  const clearFilters = () => {
    setSearch("");
    setRoleFilter("");
    setStatusFilter("");
  };

  const isSelf = (user) =>
    String(user._id) === String(currentUser?.id);

  // Editing your own account: role and status are locked
  const editingSelf = Boolean(editingUser && isSelf(editingUser));

  // =========================
  // ROLE HIERARCHY (same rules as the backend)
  // =========================
  // Owner: manages everyone. Admin: manages Engineers and Users only.

  const iAmOwner = Boolean(currentUser?.isOwner);

  const manageBlockReason = (user) => {
    if (isSelf(user)) return "";
    if (user.isOwner) return "Only the Owner can change the Owner account";
    if (user.role === "Admin" && !iAmOwner) {
      return "Only the Owner can edit or remove other Admins";
    }
    return "";
  };

  const canEditUser = (user) => !manageBlockReason(user);

  const canDeleteUser = (user) =>
    !isSelf(user) && !manageBlockReason(user);

  const canMakeOwner = (user) =>
    iAmOwner &&
    !isSelf(user) &&
    user.role === "Admin" &&
    user.status === "Active";

  const confirmTransfer = async () => {
    try {
      setTransferring(true);

      const response = await fetch(
        `${API_URL}/api/users/${ownerCandidate._id}/transfer-ownership`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not transfer ownership");
      }

      toast.success(data.message);
      setOwnerCandidate(null);

      // My own isOwner flag just changed
      await refreshStoredUser();
      fetchUsers();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setTransferring(false);
    }
  };

  // Submit guard so a double click can't create two users
  const submitUser = async (e) => {
    if (submitting) {
      e.preventDefault();
      return;
    }

    setSubmitting(true);

    try {
      await handleSubmit(e);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);

    try {
      await handleDelete(userToDelete);
    } finally {
      setDeleting(false);
      setUserToDelete(null);
    }
  };

  const inputClass =
    "w-full h-11 border border-slate-300 rounded-xl pl-10 pr-4 text-sm text-slate-800 bg-white outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition";

  const labelClass =
    "block text-sm font-semibold text-slate-700 mb-1.5";

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6 animate-pulse">
          <div className="h-16 rounded-2xl bg-slate-200 max-w-md" />

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-24 rounded-2xl bg-slate-200"
              />
            ))}
          </div>

          <div className="h-96 rounded-2xl bg-slate-200" />
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

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">
            User Management
          </h1>

          <p className="text-slate-500 mt-2">
            Manage system users, roles and account status.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl text-sm font-semibold shadow-sm transition shrink-0"
        >
          <UserPlus size={18} />
          Add User
        </button>

      </div>

      {/* =========================
          ERROR
      ========================= */}

      {error && !showModal && (
        <div className="mb-6 flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
          <CircleAlert size={18} />
          {error}
        </div>
      )}

      {/* =========================
          STATS
      ========================= */}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm"
            >
              <div
                className={`${card.tile} w-11 h-11 rounded-xl flex items-center justify-center shrink-0`}
              >
                <Icon size={20} />
              </div>

              <div className="min-w-0">
                <p className="text-2xl font-bold text-slate-800 leading-none">
                  {card.value}
                </p>

                <p className="text-xs text-slate-500 mt-1.5 truncate">
                  {card.label} · {card.hint}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* =========================
          TOOLBAR
      ========================= */}

      <div className="bg-white border border-slate-200 rounded-t-2xl shadow-sm p-4 flex flex-col lg:flex-row lg:items-center gap-3">

        {/* ROLE TABS */}

        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 overflow-x-auto">
          {ROLE_TABS.map((role) => {
            const isActive = roleFilter === role;

            return (
              <button
                key={role || "all"}
                type="button"
                onClick={() => setRoleFilter(role)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                  isActive
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {role ? `${role}s` : "All"}

                <span
                  className={`px-1.5 py-0.5 rounded-md text-xs font-semibold ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {roleCounts[role]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-1 flex-col sm:flex-row gap-3 lg:justify-end">

          {/* SEARCH */}

          <div className="relative flex-1 lg:max-w-sm">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email or department..."
              aria-label="Search users"
              className="w-full h-10 border border-slate-200 rounded-xl pl-10 pr-4 text-sm bg-slate-50 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
            />
          </div>

          {/* STATUS */}

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
            className={`h-10 border rounded-xl px-3.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer ${
              statusFilter
                ? "border-blue-300 bg-blue-50 text-blue-700 font-medium"
                : "border-slate-200 bg-white text-slate-700"
            }`}
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              <X size={16} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* =========================
          USERS TABLE
      ========================= */}

      <div
        aria-busy={fetching}
        className={`bg-white border border-t-0 border-slate-200 rounded-b-2xl shadow-sm overflow-hidden transition-opacity ${
          fetching ? "opacity-60" : ""
        }`}
      >

        {visibleUsers.length === 0 ? (

          <div className="py-16 px-6 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
              <Users size={26} />
            </div>

            <p className="text-base font-semibold text-slate-800">
              {hasFilters
                ? "No users match your filters"
                : "No users yet"}
            </p>

            <p className="text-sm text-slate-500 mt-1">
              {hasFilters
                ? "Try a different search or clear the filters."
                : "Add the first user to get started."}
            </p>

            <button
              type="button"
              onClick={hasFilters ? clearFilters : openAddModal}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {hasFilters ? <X size={16} /> : <UserPlus size={16} />}
              {hasFilters ? "Clear filters" : "Add User"}
            </button>
          </div>

        ) : (

          <div className="overflow-x-auto">
            <table className="w-full min-w-215">

              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {["User", "Role", "Department", "Status", "Joined"].map(
                    (heading) => (
                      <th
                        key={heading}
                        className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                      >
                        {heading}
                      </th>
                    )
                  )}

                  <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {visibleUsers.map((user) => {
                  const role =
                    roleStyles[user.role] || roleStyles.User;
                  const RoleIcon = role.icon;
                  const isActive = user.status === "Active";

                  return (
                    <tr
                      key={user._id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                    >

                      {/* USER */}

                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {user.profilePhoto ? (
                            <img
                              src={user.profilePhoto}
                              referrerPolicy="no-referrer"
                              alt=""
                              className="w-10 h-10 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <span
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${role.avatar}`}
                            >
                              {initials(user.name)}
                            </span>
                          )}

                          <div className="min-w-0">
                            <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                              <span className="truncate max-w-55">
                                {user.name}
                              </span>

                              {user.isOwner && (
                                <span
                                  title="Owner of this HelpDesk"
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold uppercase"
                                >
                                  <Crown size={11} />
                                  Owner
                                </span>
                              )}

                              {isSelf(user) && (
                                <span className="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold uppercase">
                                  You
                                </span>
                              )}
                            </p>

                            <p className="text-xs text-slate-500 truncate max-w-65">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* ROLE */}

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${role.badge}`}
                        >
                          <RoleIcon size={13} />
                          {user.role}
                        </span>
                      </td>

                      {/* DEPARTMENT */}

                      <td className="px-5 py-3.5 text-sm text-slate-600">
                        {user.department || (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* STATUS */}

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                              : "bg-slate-100 text-slate-500 ring-slate-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive
                                ? "bg-emerald-500"
                                : "bg-slate-400"
                            }`}
                          />
                          {user.status}
                        </span>
                      </td>

                      {/* JOINED */}

                      <td className="px-5 py-3.5 text-sm text-slate-500 whitespace-nowrap">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString(
                              undefined,
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )
                          : "—"}
                      </td>

                      {/* ACTIONS */}

                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-1">
                          {canMakeOwner(user) && (
                            <button
                              type="button"
                              onClick={() => setOwnerCandidate(user)}
                              title="Make Owner"
                              aria-label={`Make ${user.name} the Owner`}
                              className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-amber-50 hover:text-amber-600 transition"
                            >
                              <Crown size={17} />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => openEditModal(user)}
                            disabled={!canEditUser(user)}
                            title={manageBlockReason(user) || "Edit user"}
                            aria-label={`Edit ${user.name}`}
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-500 transition"
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            type="button"
                            onClick={() => setUserToDelete(user)}
                            disabled={!canDeleteUser(user)}
                            title={
                              isSelf(user)
                                ? user.isOwner
                                  ? "The Owner can't be deleted. Transfer ownership first"
                                  : "You can't delete your own account"
                                : manageBlockReason(user) || "Delete user"
                            }
                            aria-label={`Delete ${user.name}`}
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-500 transition"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>

            </table>
          </div>

        )}

        {visibleUsers.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-700">
                {firstIndex + 1}–{firstIndex + visibleUsers.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-700">
                {totalCount}
              </span>{" "}
              users
            </p>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage(safeCurrentPage - 1)}
                  disabled={safeCurrentPage === 1}
                  aria-label="Previous page"
                  className="w-9 h-9 rounded-lg flex items-center justify-center border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={17} />
                </button>

                {pageButtons.map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                      page === safeCurrentPage
                        ? "bg-blue-600 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setCurrentPage(safeCurrentPage + 1)}
                  disabled={safeCurrentPage === totalPages}
                  aria-label="Next page"
                  className="w-9 h-9 rounded-lg flex items-center justify-center border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* =========================
          ADD / EDIT MODAL
      ========================= */}

      {showModal && (

        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
          >

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  {editingUser ? <UserCog size={20} /> : <UserPlus size={20} />}
                </div>

                <div>
                  <h2
                    id="user-modal-title"
                    className="text-lg font-bold text-slate-800"
                  >
                    {editingUser ? "Edit User" : "Add New User"}
                  </h2>

                  <p className="text-sm text-slate-500">
                    {editingUser
                      ? `Update ${editingUser.name}'s account.`
                      : "Create an account and choose a role."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                aria-label="Close"
                className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={submitUser}
              className="flex flex-col min-h-0"
            >
              <div className="px-6 py-5 overflow-y-auto space-y-5">

                {/* MODAL ERROR */}

                {error && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                    <CircleAlert size={18} />
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  {/* NAME */}

                  <div>
                    <label htmlFor="user-name" className={labelClass}>
                      Full Name <span className="text-red-500">*</span>
                    </label>

                    <div className="relative">
                      <User size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />

                      <input
                        id="user-name"
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g. Kabir Singh"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* EMAIL */}

                  <div>
                    <label htmlFor="user-email" className={labelClass}>
                      Email <span className="text-red-500">*</span>
                    </label>

                    <div className="relative">
                      <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />

                      <input
                        id="user-email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="name@company.com"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* PASSWORD */}

                  <div className="sm:col-span-2">
                    <label htmlFor="user-password" className={labelClass}>
                      {editingUser ? "New Password" : "Password"}
                      {!editingUser && <span className="text-red-500"> *</span>}
                    </label>

                    <div className="relative">
                      <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />

                      <input
                        id="user-password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder={
                          editingUser
                            ? "Leave blank to keep current password"
                            : "At least 6 characters"
                        }
                        autoComplete="new-password"
                        className={`${inputClass} pr-12`}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword((previous) => !previous)
                        }
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600"
                        aria-label={
                          showPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>

                    {editingUser && (
                      <p className="text-xs text-slate-400 mt-1.5">
                        Leave this field blank to keep the current password.
                      </p>
                    )}
                  </div>

                  {/* PHONE */}

                  <div>
                    <label htmlFor="user-phone" className={labelClass}>
                      Phone
                    </label>

                    <div className="relative">
                      <Phone size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />

                      <input
                        id="user-phone"
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Optional"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* DEPARTMENT */}

                  <div>
                    <label htmlFor="user-department" className={labelClass}>
                      Department
                    </label>

                    <div className="relative">
                      <Building2 size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />

                      <input
                        id="user-department"
                        type="text"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        placeholder="e.g. IT Support"
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>

                {/* ROLE */}

                <div>
                  <p className={labelClass}>Role</p>

                  {editingSelf && (
                    <p className="-mt-0.5 mb-2 text-xs text-slate-500">
                      You can't change your own role or status. Ask
                      another admin if this needs to change.
                    </p>
                  )}

                  <div
                    role="radiogroup"
                    aria-label="Role"
                    className="grid grid-cols-1 sm:grid-cols-3 gap-2"
                  >
                    {Object.entries(roleStyles).map(([value, style]) => {
                      const Icon = style.icon;
                      const isSelected = formData.role === value;

                      return (
                        <button
                          key={value}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          disabled={
                            editingSelf ||
                            (value === "Admin" && !iAmOwner)
                          }
                          title={
                            value === "Admin" && !iAmOwner
                              ? "Only the Owner can make someone an Admin"
                              : undefined
                          }
                          onClick={() =>
                            handleChange({
                              target: { name: "role", value },
                            })
                          }
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                            isSelected
                              ? style.selected
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <span
                            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${style.badge}`}
                          >
                            <Icon size={17} />
                          </span>

                          <span>
                            <span className="block text-sm font-semibold text-slate-800">
                              {value}
                            </span>

                            <span className="block text-xs text-slate-500">
                              {style.description}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* STATUS */}

                <div className="flex items-center justify-between gap-4 border border-slate-200 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Account active
                    </p>

                    <p className="text-xs text-slate-500">
                      Inactive users can't log in.
                    </p>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={formData.status === "Active"}
                    aria-label="Account active"
                    disabled={editingSelf}
                    onClick={() =>
                      handleChange({
                        target: {
                          name: "status",
                          value:
                            formData.status === "Active"
                              ? "Inactive"
                              : "Active",
                        },
                      })
                    }
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:cursor-not-allowed disabled:opacity-60 ${
                      formData.status === "Active"
                        ? "bg-emerald-500"
                        : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        formData.status === "Active"
                          ? "translate-x-5"
                          : ""
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* BUTTONS */}

              <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/60 rounded-b-2xl">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm disabled:bg-blue-300 disabled:cursor-not-allowed transition"
                >
                  {submitting ? (
                    <LoaderCircle size={17} className="animate-spin" />
                  ) : editingUser ? (
                    <Save size={17} />
                  ) : (
                    <UserPlus size={17} />
                  )}

                  {submitting
                    ? "Saving..."
                    : editingUser
                    ? "Update User"
                    : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>

      )}

      {/* =========================
          DELETE CONFIRMATION
      ========================= */}

      {userToDelete && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => !deleting && setUserToDelete(null)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-user-title"
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
          >
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <Trash2 size={22} />
            </div>

            <h2
              id="delete-user-title"
              className="text-lg font-bold text-slate-800 mt-4"
            >
              Delete {userToDelete.name}?
            </h2>

            <p className="text-sm text-slate-500 mt-2">
              This permanently removes{" "}
              <span className="font-medium text-slate-700">
                {userToDelete.email}
              </span>
              . This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={deleting}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:bg-red-300"
              >
                {deleting && (
                  <LoaderCircle size={17} className="animate-spin" />
                )}
                {deleting ? "Deleting..." : "Delete User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================
          TRANSFER OWNERSHIP
      ========================= */}

      {ownerCandidate && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => !transferring && setOwnerCandidate(null)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="transfer-owner-title"
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Crown size={22} />
            </div>

            <h2
              id="transfer-owner-title"
              className="text-lg font-bold text-slate-800 mt-4"
            >
              Make {ownerCandidate.name} the Owner?
            </h2>

            <ul className="text-sm text-slate-500 mt-3 space-y-1.5 list-disc pl-5">
              <li>
                <span className="font-medium text-slate-700">
                  {ownerCandidate.name}
                </span>{" "}
                will be able to manage every Admin, including you.
              </li>
              <li>You stay an Admin, but you lose Owner rights.</li>
              <li>Only the new Owner can give ownership back.</li>
            </ul>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setOwnerCandidate(null)}
                disabled={transferring}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmTransfer}
                disabled={transferring}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-60"
              >
                {transferring && (
                  <LoaderCircle size={17} className="animate-spin" />
                )}
                {transferring ? "Transferring..." : "Transfer ownership"}
              </button>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
}

export default UserManagement;
