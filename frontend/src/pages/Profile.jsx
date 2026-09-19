import { useEffect, useState } from "react";
import {
  User,
  Mail,
  Phone,
  Building2,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  Camera,
  Trash2,
  CircleDot,
  ShieldCheck,
  Settings,
  Save,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/Layout";

function Profile() {
  const navigate = useNavigate();

  // =========================
  // ACTIVE PROFILE TAB
  // =========================

  const [activeTab, setActiveTab] = useState("personal");

  // =========================
  // PROFILE
  // =========================

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    role: "",
    status: "",
    phone: "",
    department: "",
    profilePhoto: "",
  });

  // =========================
  // TICKET STATISTICS
  // =========================

  const [ticketStats, setTicketStats] = useState({
    total: 0,
    resolved: 0,
    open: 0,
  });

  // =========================
  // PASSWORD
  // =========================

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  // =========================
  // USER ID
  // =========================

  const [userId, setUserId] = useState(null);

  // =========================
  // LOADING / ACTION STATES
  // =========================

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] =
    useState(false);
  const [photoUploading, setPhotoUploading] =
    useState(false);

  // =========================
  // MESSAGES
  // =========================

  const [error, setError] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [profileSuccess, setProfileSuccess] =
    useState("");
  const [passwordError, setPasswordError] =
    useState("");
  const [passwordSuccess, setPasswordSuccess] =
    useState("");

  // =========================
  // FETCH CURRENT USER
  // =========================

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/login");
          return;
        }

        const response = await fetch(
          "http://localhost:5000/api/auth/me",
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
            data.message || "Failed to fetch profile"
          );
        }

        const currentUser = data.user;

        if (!currentUser) {
          throw new Error(
            "Logged-in user was not found."
          );
        }

        setUserId(currentUser.id);

        setProfile({
          name: currentUser.name || "",
          email: currentUser.email || "",
          role: currentUser.role || "",
          status: currentUser.status || "Active",
          phone: currentUser.phone || "",
          department: currentUser.department || "",
          profilePhoto:
            currentUser.profilePhoto || "",
        });

        // Keep Navbar user data synchronized.
        const storedUser = JSON.parse(
          localStorage.getItem("user") || "{}"
        );

        localStorage.setItem(
          "user",
          JSON.stringify({
            ...storedUser,
            ...currentUser,
          })
        );

        window.dispatchEvent(
          new Event("userChanged")
        );

        // =========================
        // FETCH ROLE-BASED TICKETS
        // =========================

        const ticketResponse = await fetch(
          "http://localhost:5000/api/tickets",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const ticketData =
          await ticketResponse.json();

        if (ticketResponse.ok) {
          const tickets = Array.isArray(
            ticketData.tickets
          )
            ? ticketData.tickets
            : [];

          const resolvedTickets =
            tickets.filter(
              (ticket) =>
                ticket.status === "Closed"
            ).length;

          const openTickets =
            tickets.filter(
              (ticket) =>
                ticket.status === "Open"
            ).length;

          setTicketStats({
            total: tickets.length,
            resolved: resolvedTickets,
            open: openTickets,
          });
        }
      } catch (error) {
        console.error(
          "Fetch profile error:",
          error
        );

        setError(
          error.message ||
            "Unable to load profile."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  // =========================
  // HANDLE PROFILE CHANGE
  // =========================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));

    setProfileSuccess("");
    setError("");
  };

  // =========================
  // HANDLE PASSWORD CHANGE
  // =========================

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;

    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setPasswordError("");
    setPasswordSuccess("");
  };

  // =========================
  // HANDLE PROFILE PHOTO
  // =========================

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    setPhotoError("");

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setPhotoError(
        "Only JPG, JPEG, PNG and WebP images are allowed."
      );

      e.target.value = "";
      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      setPhotoError(
        "Profile photo must be 5 MB or smaller."
      );

      e.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = async () => {
      try {
        setPhotoUploading(true);

        const token = localStorage.getItem(
          "token"
        );

        if (!token) {
          navigate("/login");
          return;
        }

        const response = await fetch(
          "http://localhost:5000/api/users/profile/photo",
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              profilePhoto: reader.result,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to update profile photo."
          );
        }

        const updatedUser = data.user || {};

        setProfile((prev) => ({
          ...prev,
          profilePhoto:
            updatedUser.profilePhoto || "",
        }));

        const storedUser = JSON.parse(
          localStorage.getItem("user") || "{}"
        );

        localStorage.setItem(
          "user",
          JSON.stringify({
            ...storedUser,
            ...updatedUser,
          })
        );

        window.dispatchEvent(
          new Event("userChanged")
        );
      } catch (error) {
        console.error(
          "Profile photo upload error:",
          error
        );

        setPhotoError(
          error.message ||
            "Unable to update profile photo."
        );
      } finally {
        setPhotoUploading(false);
      }
    };

    reader.onerror = () => {
      setPhotoError(
        "Unable to read the selected image."
      );

      setPhotoUploading(false);
    };

    reader.readAsDataURL(file);

    e.target.value = "";
  };

  // =========================
  // REMOVE PROFILE PHOTO
  // =========================

  const handleRemovePhoto = async () => {
    try {
      setPhotoUploading(true);
      setPhotoError("");

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        "http://localhost:5000/api/users/profile/photo",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            profilePhoto: "",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to remove profile photo."
        );
      }

      const updatedUser = data.user || {};

      setProfile((prev) => ({
        ...prev,
        profilePhoto: "",
      }));

      const storedUser = JSON.parse(
        localStorage.getItem("user") || "{}"
      );

      localStorage.setItem(
        "user",
        JSON.stringify({
          ...storedUser,
          ...updatedUser,
        })
      );

      window.dispatchEvent(
        new Event("userChanged")
      );
    } catch (error) {
      console.error(
        "Remove profile photo error:",
        error
      );

      setPhotoError(
        error.message ||
          "Unable to remove profile photo."
      );
    } finally {
      setPhotoUploading(false);
    }
  };

  // =========================
  // SAVE PROFILE
  // =========================

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setProfileSuccess("");

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      if (!userId) {
        throw new Error(
          "User ID not available."
        );
      }

      const response = await fetch(
        "http://localhost:5000/api/users/profile",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: profile.name,
            email: profile.email,
            phone: profile.phone,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update profile"
        );
      }

      const updatedUser = data.user || {};

      setProfile((prev) => ({
        ...prev,
        name:
          updatedUser.name ??
          prev.name,
        email:
          updatedUser.email ??
          prev.email,
        role:
          updatedUser.role ??
          prev.role,
        status:
          updatedUser.status ??
          prev.status,
        phone:
          updatedUser.phone ??
          prev.phone,
        department:
          updatedUser.department ??
          prev.department,
        profilePhoto:
          updatedUser.profilePhoto ??
          prev.profilePhoto,
      }));

      const storedUser = JSON.parse(
        localStorage.getItem("user") || "{}"
      );

      localStorage.setItem(
        "user",
        JSON.stringify({
          ...storedUser,
          ...updatedUser,
        })
      );

      window.dispatchEvent(
        new Event("userChanged")
      );

      setProfileSuccess(
        "Profile updated successfully."
      );
    } catch (error) {
      console.error(
        "Update profile error:",
        error
      );

      setError(
        error.message ||
          "Unable to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // CHANGE PASSWORD
  // =========================

  const handleChangePassword = async (e) => {
    e.preventDefault();

    try {
      setChangingPassword(true);
      setPasswordError("");
      setPasswordSuccess("");

      const {
        currentPassword,
        newPassword,
        confirmPassword,
      } = passwordData;

      if (
        !currentPassword ||
        !newPassword ||
        !confirmPassword
      ) {
        setPasswordError(
          "Please fill in all password fields."
        );

        return;
      }

      if (newPassword.length < 6) {
        setPasswordError(
          "New password must be at least 6 characters long."
        );

        return;
      }

      if (
        newPassword !== confirmPassword
      ) {
        setPasswordError(
          "New password and confirm password do not match."
        );

        return;
      }

      const token = localStorage.getItem(
        "token"
      );

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        "http://localhost:5000/api/auth/change-password",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
            confirmPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to change password"
        );
      }

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setPasswordSuccess(
        "Password changed successfully!"
      );
    } catch (error) {
      console.error(
        "Change password error:",
        error
      );

      setPasswordError(
        error.message ||
          "Unable to change password."
      );
    } finally {
      setChangingPassword(false);
    }
  };

  // =========================
  // PROFILE AVATAR
  // =========================

  const profileInitial =
    profile.name
      ?.trim()
      ?.charAt(0)
      ?.toUpperCase() || "U";

  const roleLabel = profile.role || "User";

  // =========================
  // STAT SHORTCUTS
  // =========================

  const openTickets = () => {
    navigate("/tickets?status=Open");
  };

  const openResolvedTickets = () => {
    navigate("/tickets?status=Closed");
  };

  const openAllTickets = () => {
    navigate("/tickets");
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-8 py-6 text-center">
            <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500">
              Loading profile...
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* =========================
            PAGE HEADING
        ========================= */}

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              My Profile
            </h1>

            <p className="text-slate-500 mt-1">
              View and manage your profile information.
            </p>
          </div>

          <div className="text-sm text-slate-400 hidden sm:block">
            Dashboard <span className="mx-2">›</span> Profile
          </div>
        </div>

        {/* =========================
            PAGE ERROR
        ========================= */}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* =========================
            MAIN PROFILE LAYOUT
        ========================= */}

        <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-5 items-start">

          {/* =========================
              LEFT PROFILE SUMMARY
          ========================= */}

          <aside className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">

            {/* PHOTO */}

            <div className="flex justify-center">
              <div className="relative w-24 h-24">

                {profile.profilePhoto ? (
                  <img
                    src={profile.profilePhoto}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-sm ring-1 ring-slate-200"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-blue-600 text-white flex items-center justify-center text-3xl font-semibold shadow-sm ring-4 ring-blue-50">
                    {profileInitial}
                  </div>
                )}

                <label
                  htmlFor="profile-photo"
                  title="Change profile photo"
                  className={`absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center border-2 border-white shadow cursor-pointer hover:bg-blue-700 transition ${
                    photoUploading
                      ? "opacity-50 pointer-events-none"
                      : ""
                  }`}
                >
                  <Camera size={14} />

                  <input
                    id="profile-photo"
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handlePhotoChange}
                    disabled={photoUploading}
                  />
                </label>
              </div>
            </div>

            {/* IDENTITY */}

            <div className="text-center mt-4">
              <h2 className="text-lg font-bold text-slate-800">
                {profile.name || "User"}
              </h2>

              <p className="text-sm text-slate-500 mt-0.5">
                {roleLabel}
              </p>

              <div className="flex justify-center mt-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                    profile.status === "Active"
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  <CircleDot size={12} />
                  {profile.status || "Active"}
                </span>
              </div>
            </div>

            {/* PHOTO ACTIONS */}

            <div className="flex justify-center flex-wrap gap-3 mt-4">
              <label
                htmlFor="profile-photo"
                className={`text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer ${
                  photoUploading
                    ? "opacity-50 pointer-events-none"
                    : ""
                }`}
              >
                {photoUploading
                  ? "Uploading..."
                  : profile.profilePhoto
                  ? "Change Photo"
                  : "Upload Photo"}
              </label>

              {profile.profilePhoto && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={photoUploading}
                  className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  <Trash2 size={13} />
                  Remove
                </button>
              )}
            </div>

            <p className="text-[11px] text-center text-slate-400 mt-2">
              JPG, JPEG, PNG or WebP · Max 5 MB
            </p>

            {photoError && (
              <p className="text-xs text-red-600 text-center mt-2">
                {photoError}
              </p>
            )}

            {/* DIVIDER */}

            <div className="border-t border-slate-100 my-5" />

            {/* COMPACT TICKET STATS */}

            <div className="grid grid-cols-3 text-center">

              <button
                type="button"
                onClick={openAllTickets}
                className="group"
              >
                <p className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition">
                  {ticketStats.total}
                </p>

                <p className="text-[10px] leading-4 text-slate-500 mt-1">
                  Tickets
                  <br />
                  Created
                </p>
              </button>

              <button
                type="button"
                onClick={openResolvedTickets}
                className="group border-x border-slate-100"
              >
                <p className="text-xl font-bold text-slate-800 group-hover:text-green-600 transition">
                  {ticketStats.resolved}
                </p>

                <p className="text-[10px] leading-4 text-slate-500 mt-1">
                  Resolved
                </p>
              </button>

              <button
                type="button"
                onClick={openTickets}
                className="group"
              >
                <p className="text-xl font-bold text-slate-800 group-hover:text-amber-600 transition">
                  {ticketStats.open}
                </p>

                <p className="text-[10px] leading-4 text-slate-500 mt-1">
                  Open
                </p>
              </button>

            </div>

          </aside>

          {/* =========================
              RIGHT TABBED PROFILE CARD
          ========================= */}

          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

            {/* TABS */}

            <div className="border-b border-slate-200 px-4 sm:px-5">
              <div className="flex items-center gap-5 overflow-x-auto">

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("personal");
                    setError("");
                    setProfileSuccess("");
                  }}
                  className={`relative py-4 text-sm font-semibold whitespace-nowrap ${
                    activeTab === "personal"
                      ? "text-blue-600"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Personal Info

                  {activeTab === "personal" && (
                    <span className="absolute left-0 right-0 bottom-0 h-0.5 bg-blue-600 rounded-full" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("password");
                    setError("");
                    setProfileSuccess("");
                  }}
                  className={`relative py-4 text-sm font-semibold whitespace-nowrap ${
                    activeTab === "password"
                      ? "text-blue-600"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Change Password

                  {activeTab === "password" && (
                    <span className="absolute left-0 right-0 bottom-0 h-0.5 bg-blue-600 rounded-full" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("preferences");
                    setError("");
                    setProfileSuccess("");
                  }}
                  className={`relative py-4 text-sm font-semibold whitespace-nowrap ${
                    activeTab === "preferences"
                      ? "text-blue-600"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Preferences

                  {activeTab === "preferences" && (
                    <span className="absolute left-0 right-0 bottom-0 h-0.5 bg-blue-600 rounded-full" />
                  )}
                </button>

              </div>
            </div>

            {/* =========================
                PERSONAL INFO TAB
            ========================= */}

            {activeTab === "personal" && (
              <form
                onSubmit={handleSave}
                className="p-5 sm:p-6"
              >

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-5">

                  {/* FULL NAME */}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      Full Name
                    </label>

                    <div className="relative">
                      <User
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type="text"
                        name="name"
                        value={profile.name}
                        onChange={handleChange}
                        className="w-full h-12 border border-slate-300 rounded-xl pl-10 pr-4 text-sm text-slate-700 bg-white outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
                      />
                    </div>
                  </div>

                  {/* EMAIL */}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      Email
                    </label>

                    <div className="relative">
                      <Mail
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type="email"
                        name="email"
                        value={profile.email}
                        onChange={handleChange}
                        className="w-full h-12 border border-slate-300 rounded-xl pl-10 pr-4 text-sm text-slate-700 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
                      />
                    </div>
                  </div>

                  {/* PHONE */}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      Phone
                    </label>

                    <div className="relative">
                      <Phone
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type="text"
                        name="phone"
                        value={profile.phone}
                        onChange={handleChange}
                        className="w-full h-12 border border-slate-300 rounded-xl pl-10 pr-4 text-sm text-slate-700 bg-white outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
                      />
                    </div>
                  </div>

                  {/* DEPARTMENT */}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      Department
                    </label>

                    <div className="relative">
                      <Building2
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type="text"
                        value={
                          profile.department ||
                          "Not assigned"
                        }
                        disabled
                        className="w-full h-12 border border-slate-200 rounded-xl pl-10 pr-4 text-sm bg-slate-50 text-slate-500"
                      />
                    </div>
                  </div>

                  {/* ROLE */}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      Role
                    </label>

                    <div className="relative">
                      <ShieldCheck
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type="text"
                        value={profile.role}
                        disabled
                        className="w-full h-12 border border-slate-200 rounded-xl pl-10 pr-4 text-sm bg-slate-50 text-slate-500"
                      />
                    </div>
                  </div>

                  {/* ACCOUNT STATUS */}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      Account Status
                    </label>

                    <div className="h-12 px-4 border border-slate-200 rounded-xl bg-slate-50 flex items-center">
                      <span
                        className={`inline-flex items-center gap-2 text-sm font-semibold ${
                          profile.status === "Active"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        <CircleDot size={15} />
                        {profile.status || "Active"}
                      </span>
                    </div>
                  </div>

                </div>

                {/* PROFILE SUCCESS */}

                {profileSuccess && (
                  <div className="mt-5 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
                    {profileSuccess}
                  </div>
                )}

                {/* SAVE */}

                <div className="flex justify-end mt-6">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl text-sm font-semibold disabled:bg-blue-400 disabled:cursor-not-allowed transition"
                  >
                    <Save size={16} />

                    {saving
                      ? "Saving..."
                      : "Save Changes"}
                  </button>
                </div>

              </form>
            )}

            {/* =========================
                CHANGE PASSWORD TAB
            ========================= */}

            {activeTab === "password" && (
              <div className="p-5 sm:p-6">

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <KeyRound size={19} />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-slate-800">
                      Change Password
                    </h2>

                    <p className="text-sm text-slate-500 mt-0.5">
                      Update your account password securely.
                    </p>
                  </div>
                </div>

                {passwordError && (
                  <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    {passwordError}
                  </div>
                )}

                {passwordSuccess && (
                  <div className="mb-5 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
                    {passwordSuccess}
                  </div>
                )}

                <form
                  onSubmit={handleChangePassword}
                  className="space-y-5"
                >

                  {/* CURRENT PASSWORD */}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      Current Password
                    </label>

                    <div className="relative">
                      <Lock
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type={
                          showCurrentPassword
                            ? "text"
                            : "password"
                        }
                        name="currentPassword"
                        value={
                          passwordData.currentPassword
                        }
                        onChange={
                          handlePasswordChange
                        }
                        placeholder="Enter current password"
                        autoComplete="current-password"
                        className="w-full h-12 border border-slate-300 rounded-xl pl-10 pr-12 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowCurrentPassword(
                            (prev) => !prev
                          )
                        }
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showCurrentPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* NEW PASSWORD */}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      New Password
                    </label>

                    <div className="relative">
                      <Lock
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type={
                          showNewPassword
                            ? "text"
                            : "password"
                        }
                        name="newPassword"
                        value={
                          passwordData.newPassword
                        }
                        onChange={
                          handlePasswordChange
                        }
                        placeholder="Enter new password"
                        autoComplete="new-password"
                        className="w-full h-12 border border-slate-300 rounded-xl pl-10 pr-12 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowNewPassword(
                            (prev) => !prev
                          )
                        }
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showNewPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-slate-400 mt-2">
                      Minimum 6 characters.
                    </p>
                  </div>

                  {/* CONFIRM PASSWORD */}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      Confirm New Password
                    </label>

                    <div className="relative">
                      <Lock
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type={
                          showConfirmPassword
                            ? "text"
                            : "password"
                        }
                        name="confirmPassword"
                        value={
                          passwordData.confirmPassword
                        }
                        onChange={
                          handlePasswordChange
                        }
                        placeholder="Confirm new password"
                        autoComplete="new-password"
                        className="w-full h-12 border border-slate-300 rounded-xl pl-10 pr-12 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(
                            (prev) => !prev
                          )
                        }
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* FORGOT PASSWORD */}

                  <button
                    type="button"
                    onClick={() =>
                      navigate("/forgot-password")
                    }
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Forgot Password?
                  </button>

                  {/* SUBMIT */}

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={changingPassword}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl text-sm font-semibold disabled:bg-blue-400 disabled:cursor-not-allowed transition"
                    >
                      {changingPassword
                        ? "Changing Password..."
                        : "Change Password"}
                    </button>
                  </div>

                </form>
              </div>
            )}

            {/* =========================
                PREFERENCES TAB
            ========================= */}

            {activeTab === "preferences" && (
              <div className="p-5 sm:p-6">

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Settings size={19} />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-slate-800">
                      Preferences
                    </h2>

                    <p className="text-sm text-slate-500 mt-0.5">
                      Manage notifications, appearance and dashboard preferences.
                    </p>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-5 bg-slate-50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-700">
                        Preferences & Settings
                      </p>

                      <p className="text-sm text-slate-500 mt-1">
                        Customize your notification preferences, theme and dashboard experience.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate("/settings")}
                      className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl text-sm font-semibold transition shrink-0"
                    >
                      <Settings size={16} />
                      Open Settings
                    </button>
                  </div>
                </div>

              </div>
            )}

          </section>
        </div>
      </div>
    </Layout>
  );
}

export default Profile;
