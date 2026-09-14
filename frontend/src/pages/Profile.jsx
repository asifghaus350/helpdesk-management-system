import { useEffect, useState } from "react";
import {
  User,
  Mail,
  Phone,
  Building2,
  Pencil,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  Camera,
  Trash2,
  Ticket,
  CheckCircle2,
  CircleDot,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import Layout from "../components/layout/Layout";

function Profile() {
  const navigate = useNavigate();

  // =========================
  // EDIT MODE
  // =========================

  const [isEditing, setIsEditing] = useState(false);

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
  // LOADING / ERROR
  // =========================

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] =
    useState(false);

  const [photoUploading, setPhotoUploading] =
    useState(false);

  const [error, setError] = useState("");
  const [photoError, setPhotoError] = useState("");
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

        // =========================
        // GET CURRENT USER
        // =========================

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
            data.message ||
              "Failed to fetch profile"
          );
        }

        const currentUser = data.user;

        if (!currentUser) {
          throw new Error(
            "Logged-in user was not found."
          );
        }

        // =========================
        // SAVE USER ID
        // =========================

        setUserId(currentUser.id);

        // =========================
        // SET PROFILE
        // =========================

        setProfile({
          name: currentUser.name || "",
          email: currentUser.email || "",
          role: currentUser.role || "",
          status: currentUser.status || "Active",
          phone: currentUser.phone || "",
          department:
            currentUser.department || "",
          profilePhoto:
            currentUser.profilePhoto || "",
        });

        // =========================
        // UPDATE LOCAL STORAGE
        // =========================

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

    // =========================
    // VALIDATE FILE TYPE
    // =========================

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

    // =========================
    // VALIDATE FILE SIZE
    // =========================

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      setPhotoError(
        "Profile photo must be 5 MB or smaller."
      );

      e.target.value = "";
      return;
    }

    // =========================
    // CONVERT TO BASE64
    // =========================

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

        const updatedUser =
          data.user || {};

        setProfile((prev) => ({
          ...prev,
          profilePhoto:
            updatedUser.profilePhoto || "",
        }));

        // =========================
        // UPDATE LOCAL STORAGE
        // =========================

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

      const updatedUser =
        data.user || {};

      setProfile((prev) => ({
        ...prev,
        profilePhoto: "",
      }));

      // =========================
      // UPDATE LOCAL STORAGE
      // =========================

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

      const token = localStorage.getItem(
        "token"
      );

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
        `http://localhost:5000/api/users/${userId}`,
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

      const updatedUser =
        data.user || {};

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

      // =========================
      // UPDATE LOCAL STORAGE
      // =========================

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

      setIsEditing(false);

      alert(
        "Profile updated successfully!"
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

      // =========================
      // FRONTEND VALIDATION
      // =========================

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

      // =========================
      // CHANGE PASSWORD API
      // =========================

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

      // =========================
      // CLEAR PASSWORD FIELDS
      // =========================

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
    profile.name?.trim()?.charAt(0)?.toUpperCase() ||
    "U";

  // =========================
  // ROLE LABEL
  // =========================

  const roleLabel =
    profile.role || "User";

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

  // =========================
  // PROFILE PAGE
  // =========================

  return (
    <Layout>
      <div className="space-y-8">

        {/* =========================
            PAGE HEADING
        ========================= */}

        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            My Profile
          </h1>

          <p className="text-slate-500 mt-2">
            Manage your account and personal
            information.
          </p>
        </div>

        {/* =========================
            PROFILE ERROR
        ========================= */}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl">
            {error}
          </div>
        )}

        {/* =========================
            PROFILE HEADER CARD
        ========================= */}

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

          <div className="p-6 sm:p-8">

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

              {/* PROFILE IDENTITY */}

              <div className="flex flex-col sm:flex-row sm:items-center gap-5">

                {/* PHOTO */}

                <div className="relative w-28 h-28 shrink-0">

                  {profile.profilePhoto ? (
                    <img
                      src={profile.profilePhoto}
                      alt="Profile"
                      className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-md ring-1 ring-slate-200"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-full bg-blue-600 text-white flex items-center justify-center text-4xl font-bold shadow-md ring-4 ring-blue-50">
                      {profileInitial}
                    </div>
                  )}

                  {/* CAMERA BUTTON */}

                  <label
                    htmlFor="profile-photo"
                    className={`absolute bottom-0 right-0 w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center border-4 border-white shadow cursor-pointer hover:bg-blue-700 transition ${
                      photoUploading
                        ? "opacity-50 pointer-events-none"
                        : ""
                    }`}
                    title="Change profile photo"
                  >
                    <Camera size={16} />

                    <input
                      id="profile-photo"
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={
                        handlePhotoChange
                      }
                      disabled={
                        photoUploading
                      }
                    />
                  </label>
                </div>

                {/* USER DETAILS */}

                <div>

                  <h2 className="text-2xl font-bold text-slate-800">
                    {profile.name || "User"}
                  </h2>

                  <p className="text-slate-500 mt-1">
                    {roleLabel}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 mt-3">

                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                      <ShieldCheck
                        size={14}
                      />
                      {roleLabel}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        profile.status ===
                        "Active"
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      <CircleDot
                        size={13}
                      />

                      {profile.status ||
                        "Active"}
                    </span>

                  </div>

                  {/* PHOTO ACTIONS */}

                  <div className="flex flex-wrap gap-3 mt-4">

                    <label
                      htmlFor="profile-photo"
                      className={`text-sm font-medium text-blue-600 hover:text-blue-700 cursor-pointer ${
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
                        onClick={
                          handleRemovePhoto
                        }
                        disabled={
                          photoUploading
                        }
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        <Trash2
                          size={15}
                        />
                        Remove Photo
                      </button>
                    )}

                  </div>

                  <p className="text-xs text-slate-400 mt-2">
                    JPG, JPEG, PNG or WebP ·
                    Maximum 5 MB
                  </p>

                  {photoError && (
                    <p className="text-sm text-red-600 mt-2">
                      {photoError}
                    </p>
                  )}

                </div>

              </div>

              {/* EDIT BUTTON */}

              <div className="flex lg:justify-end">

                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() =>
                      setIsEditing(true)
                    }
                    className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold transition w-full sm:w-auto"
                  >
                    <Pencil size={17} />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">

                    <button
                      type="button"
                      onClick={() =>
                        setIsEditing(false)
                      }
                      disabled={saving}
                      className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 font-medium"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      form="profile-form"
                      disabled={saving}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold disabled:bg-blue-400 disabled:cursor-not-allowed"
                    >
                      {saving
                        ? "Saving..."
                        : "Save Changes"}
                    </button>

                  </div>
                )}

              </div>

            </div>

          </div>

        </div>

        {/* =========================
            TICKET STATISTICS
        ========================= */}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

          {/* TOTAL */}

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Tickets
                </p>

                <p className="text-3xl font-bold text-slate-800 mt-2">
                  {ticketStats.total}
                </p>
              </div>

              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Ticket size={23} />
              </div>

            </div>

          </div>

          {/* RESOLVED */}

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Resolved Tickets
                </p>

                <p className="text-3xl font-bold text-slate-800 mt-2">
                  {ticketStats.resolved}
                </p>
              </div>

              <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                <CheckCircle2
                  size={23}
                />
              </div>

            </div>

          </div>

          {/* OPEN */}

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Open Tickets
                </p>

                <p className="text-3xl font-bold text-slate-800 mt-2">
                  {ticketStats.open}
                </p>
              </div>

              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <CircleDot
                  size={23}
                />
              </div>

            </div>

          </div>

        </div>

        {/* =========================
            PERSONAL INFORMATION
        ========================= */}

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">

          <div className="px-6 py-5 border-b border-slate-200">

            <h2 className="text-xl font-bold text-slate-800">
              Personal Information
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Update your personal contact
              information.
            </p>

          </div>

          <form
            id="profile-form"
            onSubmit={handleSave}
            className="p-6"
          >

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* NAME */}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Full Name
                </label>

                <div className="relative">

                  <User
                    size={18}
                    className="absolute left-3.5 top-3.5 text-slate-400"
                  />

                  <input
                    type="text"
                    name="name"
                    value={profile.name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full border border-slate-300 rounded-xl pl-11 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500 transition"
                  />

                </div>
              </div>

              {/* EMAIL */}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email
                </label>

                <div className="relative">

                  <Mail
                    size={18}
                    className="absolute left-3.5 top-3.5 text-slate-400"
                  />

                  <input
                    type="email"
                    name="email"
                    value={profile.email}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full border border-slate-300 rounded-xl pl-11 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500 transition"
                  />

                </div>
              </div>

              {/* PHONE */}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Phone
                </label>

                <div className="relative">

                  <Phone
                    size={18}
                    className="absolute left-3.5 top-3.5 text-slate-400"
                  />

                  <input
                    type="text"
                    name="phone"
                    value={profile.phone}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full border border-slate-300 rounded-xl pl-11 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500 transition"
                  />

                </div>
              </div>

              {/* DEPARTMENT */}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Department
                </label>

                <div className="relative">

                  <Building2
                    size={18}
                    className="absolute left-3.5 top-3.5 text-slate-400"
                  />

                  <input
                    type="text"
                    value={
                      profile.department ||
                      "Not assigned"
                    }
                    disabled
                    className="w-full border border-slate-200 rounded-xl pl-11 pr-4 py-3 bg-slate-50 text-slate-500"
                  />

                </div>

                <p className="text-xs text-slate-400 mt-2">
                  Department can only be changed
                  by an administrator.
                </p>
              </div>

              {/* ROLE */}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Role
                </label>

                <div className="relative">

                  <ShieldCheck
                    size={18}
                    className="absolute left-3.5 top-3.5 text-slate-400"
                  />

                  <input
                    type="text"
                    value={profile.role}
                    disabled
                    className="w-full border border-slate-200 rounded-xl pl-11 pr-4 py-3 bg-slate-50 text-slate-500"
                  />

                </div>

                <p className="text-xs text-slate-400 mt-2">
                  Role can only be changed by an
                  administrator.
                </p>
              </div>

              {/* STATUS */}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Account Status
                </label>

                <div className="flex items-center h-12.5 px-4 border border-slate-200 rounded-xl bg-slate-50">

                  <span
                    className={`inline-flex items-center gap-2 text-sm font-semibold ${
                      profile.status ===
                      "Active"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    <CircleDot
                      size={16}
                    />

                    {profile.status ||
                      "Active"}
                  </span>

                </div>

                <p className="text-xs text-slate-400 mt-2">
                  Account status can only be
                  changed by an administrator.
                </p>
              </div>

            </div>

          </form>

        </div>

        {/* =========================
            CHANGE PASSWORD
        ========================= */}

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">

          <div className="px-6 py-5 border-b border-slate-200">

            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <KeyRound size={20} />
              </div>

              <div>

                <h2 className="text-xl font-bold text-slate-800">
                  Change Password
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Update your account password
                  securely.
                </p>

              </div>

            </div>

          </div>

          <div className="p-6">

            {/* PASSWORD ERROR */}

            {passwordError && (
              <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {passwordError}
              </div>
            )}

            {/* PASSWORD SUCCESS */}

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

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Current Password
                </label>

                <div className="relative">

                  <Lock
                    size={18}
                    className="absolute left-3.5 top-3.5 text-slate-400"
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
                    className="w-full border border-slate-300 rounded-xl pl-11 pr-12 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowCurrentPassword(
                        (prev) => !prev
                      )
                    }
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>

                </div>

              </div>

              {/* NEW PASSWORD */}

              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  New Password
                </label>

                <div className="relative">

                  <Lock
                    size={18}
                    className="absolute left-3.5 top-3.5 text-slate-400"
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
                    className="w-full border border-slate-300 rounded-xl pl-11 pr-12 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowNewPassword(
                        (prev) => !prev
                      )
                    }
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>

                </div>

                <p className="text-xs text-slate-400 mt-2">
                  Minimum 6 characters.
                </p>

              </div>

              {/* CONFIRM PASSWORD */}

              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Confirm New Password
                </label>

                <div className="relative">

                  <Lock
                    size={18}
                    className="absolute left-3.5 top-3.5 text-slate-400"
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
                    className="w-full border border-slate-300 rounded-xl pl-11 pr-12 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        (prev) => !prev
                      )
                    }
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>

                </div>

              </div>

              {/* FORGOT PASSWORD */}

              <div className="pt-1">

                <button
                  type="button"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  onClick={() =>
                    navigate(
                      "/forgot-password"
                    )
                  }
                >
                  Forgot Password?
                </button>

              </div>

              {/* CHANGE PASSWORD BUTTON */}

              <div className="flex justify-end pt-2">

                <button
                  type="submit"
                  disabled={changingPassword}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold disabled:bg-blue-400 disabled:cursor-not-allowed transition"
                >
                  {changingPassword
                    ? "Changing Password..."
                    : "Change Password"}
                </button>

              </div>

            </form>

          </div>

        </div>

      </div>
    </Layout>
  );
}

export default Profile;