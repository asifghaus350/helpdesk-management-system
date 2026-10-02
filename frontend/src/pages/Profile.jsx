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
  ShieldCheck,
  Settings,
  Save,
  Ticket,
  CircleAlert,
  LoaderCircle,
  CheckCircle,
  Check,
  X,
  RotateCcw,
  Sun,
  Moon,
  Bell,
  LayoutGrid,
  ChevronRight,
  Crown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/Layout";
import { updateStoredUser } from "../utils/auth";
import { API_URL } from "../config";

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
    inProgress: 0,
  });

  // Last saved editable fields, to detect unsaved changes
  const [savedInfo, setSavedInfo] = useState({
    name: "",
    email: "",
    phone: "",
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
          `${API_URL}/api/auth/me`,
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
          isOwner: Boolean(currentUser.isOwner),
        });

        setSavedInfo({
          name: currentUser.name || "",
          email: currentUser.email || "",
          phone: currentUser.phone || "",
        });

        // Keep Navbar user data synchronized.
        updateStoredUser(currentUser);

        // =========================
        // ROLE-BASED TICKET COUNTS
        // =========================

        const ticketResponse = await fetch(
          `${API_URL}/api/tickets/stats?recent=0`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const ticketData =
          await ticketResponse.json();

        if (ticketResponse.ok && ticketData.stats) {
          const { total, byStatus } = ticketData.stats;

          setTicketStats({
            total,
            resolved: byStatus.Closed,
            open: byStatus.Open,
            inProgress: byStatus["In Progress"],
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
          `${API_URL}/api/users/profile/photo`,
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

        // Keep Navbar user data synchronized.
        updateStoredUser(updatedUser);
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
        `${API_URL}/api/users/profile/photo`,
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

      // Keep Navbar user data synchronized.
      updateStoredUser(updatedUser);
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
        `${API_URL}/api/users/profile`,
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

      setSavedInfo({
        name: updatedUser.name ?? profile.name,
        email: updatedUser.email ?? profile.email,
        phone: updatedUser.phone ?? profile.phone,
      });

      // Keep Navbar user data synchronized.
      updateStoredUser(updatedUser);

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
        `${API_URL}/api/auth/change-password`,
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

      // The old token no longer works after a password change;
      // keep this session alive with the fresh one.
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setPasswordSuccess(
        "Password changed. You've been signed out on your other devices."
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
  // UNSAVED CHANGES
  // =========================

  const isProfileDirty =
    profile.name !== savedInfo.name ||
    profile.email !== savedInfo.email ||
    profile.phone !== savedInfo.phone;

  const handleResetProfile = () => {
    setProfile((prev) => ({
      ...prev,
      ...savedInfo,
    }));

    setError("");
    setProfileSuccess("");
  };

  // =========================
  // PASSWORD STRENGTH
  // =========================

  const newPassword = passwordData.newPassword;

  const passwordChecks = [
    {
      label: "At least 6 characters",
      passed: newPassword.length >= 6,
    },
    {
      label: "Contains a number",
      passed: /\d/.test(newPassword),
    },
    {
      label: "Upper and lower case letters",
      passed:
        /[a-z]/.test(newPassword) &&
        /[A-Z]/.test(newPassword),
    },
    {
      label: "Contains a symbol",
      passed: /[^A-Za-z0-9]/.test(newPassword),
    },
  ];

  const strengthScore = newPassword
    ? passwordChecks.filter((check) => check.passed).length
    : 0;

  const strengthLevels = [
    { label: "", color: "bg-slate-200", text: "text-slate-400" },
    { label: "Weak", color: "bg-red-500", text: "text-red-600" },
    { label: "Fair", color: "bg-amber-500", text: "text-amber-600" },
    { label: "Good", color: "bg-blue-500", text: "text-blue-600" },
    { label: "Strong", color: "bg-emerald-500", text: "text-emerald-600" },
  ];

  const strength = strengthLevels[strengthScore];

  const passwordsMatch =
    !!passwordData.confirmPassword &&
    passwordData.confirmPassword === newPassword;

  // =========================
  // SAVED PREFERENCES (read-only summary)
  // =========================

  let savedSettings;

  try {
    savedSettings =
      JSON.parse(localStorage.getItem("settings")) || {};
  } catch {
    savedSettings = {};
  }

  const preferenceItems = [
    {
      icon: savedSettings.theme === "dark" ? Moon : Sun,
      label: "Theme",
      value: savedSettings.theme === "dark" ? "Dark" : "Light",
    },
    {
      icon: Bell,
      label: "Ticket notifications",
      value:
        savedSettings.ticketNotifications === false
          ? "Off"
          : "On",
    },
    {
      icon: LayoutGrid,
      label: "Compact mode",
      value: savedSettings.compactMode ? "On" : "Off",
    },
  ];

  // =========================
  // STAT CARDS
  // =========================

  const totalLabel =
    roleLabel === "Admin"
      ? "All Tickets"
      : roleLabel === "Engineer"
      ? "My Queue"
      : "Tickets Created";

  const statCards = [
    {
      label: totalLabel,
      value: ticketStats.total,
      icon: Ticket,
      tile: "bg-blue-50 text-blue-600",
      path: "/tickets",
    },
    {
      label: "Open",
      value: ticketStats.open,
      icon: CircleAlert,
      tile: "bg-blue-50 text-blue-600",
      path: "/tickets?status=Open",
    },
    {
      label: "In Progress",
      value: ticketStats.inProgress,
      icon: LoaderCircle,
      tile: "bg-amber-50 text-amber-600",
      path: "/tickets?status=In%20Progress",
    },
    {
      label: "Resolved",
      value: ticketStats.resolved,
      icon: CheckCircle,
      tile: "bg-emerald-50 text-emerald-600",
      path: "/tickets?status=Closed",
    },
  ];

  // =========================
  // TABS
  // =========================

  const tabs = [
    {
      id: "personal",
      label: "Personal Info",
      description: "Name, email and phone",
      icon: User,
    },
    {
      id: "password",
      label: "Security",
      description: "Change your password",
      icon: KeyRound,
    },
    {
      id: "preferences",
      label: "Preferences",
      description: "Theme and notifications",
      icon: Settings,
    },
  ];

  const selectTab = (tabId) => {
    setActiveTab(tabId);
    setError("");
    setProfileSuccess("");
  };

  // =========================
  // SHARED INPUT STYLES
  // =========================

  const inputClass =
    "w-full h-11 border border-slate-300 rounded-xl pl-10 pr-4 text-sm text-slate-700 bg-white outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition";

  const readOnlyInputClass =
    "w-full h-11 border border-slate-200 rounded-xl pl-10 pr-10 text-sm bg-slate-50 text-slate-500 cursor-not-allowed";

  const renderPasswordField = ({
    name,
    label,
    placeholder,
    autoComplete,
    visible,
    toggle,
  }) => (
    <div>
      <label
        htmlFor={name}
        className="block text-xs font-semibold text-slate-700 mb-1.5"
      >
        {label}
      </label>

      <div className="relative">
        <Lock
          size={17}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          id={name}
          type={visible ? "text" : "password"}
          name={name}
          value={passwordData[name]}
          onChange={handlePasswordChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full h-11 border border-slate-300 rounded-xl pl-10 pr-12 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
        />

        <button
          type="button"
          onClick={() => toggle((prev) => !prev)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
          <div className="h-56 rounded-2xl bg-slate-200" />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-24 rounded-2xl bg-slate-200"
              />
            ))}
          </div>

          <div className="h-80 rounded-2xl bg-slate-200" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* =========================
            PAGE ERROR
        ========================= */}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* =========================
            PROFILE HEADER CARD
        ========================= */}

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

          {/* COVER */}

          <div className="relative h-28 sm:h-36 bg-linear-to-r from-blue-600 to-indigo-600 overflow-hidden">
            {profile.profilePhoto ? (
              <>
                {/* Profile photo as a soft, blurred cover */}
                <img
                  src={profile.profilePhoto}
                  referrerPolicy="no-referrer"
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover scale-125 blur-md"
                />

                <div className="absolute inset-0 bg-linear-to-t from-black/40 via-black/10 to-transparent" />
              </>
            ) : (
              <>
                <div className="absolute -right-10 -top-16 w-56 h-56 rounded-full bg-white/10" />
                <div className="absolute right-40 -bottom-20 w-40 h-40 rounded-full bg-white/10" />
                <div className="absolute left-1/3 -top-10 w-24 h-24 rounded-full bg-white/5" />
              </>
            )}
          </div>

          <div className="px-5 sm:px-8 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">

              {/* AVATAR */}

              <div className="relative w-24 h-24 sm:w-28 sm:h-28 -mt-12 sm:-mt-14 shrink-0">
                {profile.profilePhoto ? (
                  <img
                    src={profile.profilePhoto}
                    referrerPolicy="no-referrer"
                    alt="Profile"
                    className="w-full h-full rounded-2xl object-cover ring-4 ring-white shadow-md"
                  />
                ) : (
                  <div className="w-full h-full rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-4xl font-bold ring-4 ring-white shadow-md">
                    {profileInitial}
                  </div>
                )}

                <label
                  htmlFor="profile-photo"
                  title="Change profile photo"
                  className={`absolute -bottom-1.5 -right-1.5 w-9 h-9 rounded-xl bg-white text-blue-600 flex items-center justify-center shadow-md ring-1 ring-slate-200 cursor-pointer hover:bg-blue-50 transition ${
                    photoUploading
                      ? "opacity-50 pointer-events-none"
                      : ""
                  }`}
                >
                  <Camera size={16} />

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

              {/* IDENTITY */}

              <div className="flex-1 min-w-0 sm:pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold text-slate-800 truncate">
                    {profile.name || "User"}
                  </h1>

                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                    <ShieldCheck size={13} />
                    {roleLabel}
                  </span>

                  {profile.isOwner && (
                    <span
                      title="Owner of this HelpDesk"
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700"
                    >
                      <Crown size={13} />
                      Owner
                    </span>
                  )}

                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      profile.status === "Active"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        profile.status === "Active"
                          ? "bg-emerald-500"
                          : "bg-red-500"
                      }`}
                    />
                    {profile.status || "Active"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-2 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1.5 min-w-0">
                    <Mail size={15} className="shrink-0" />
                    <span className="truncate">{profile.email}</span>
                  </span>

                  {profile.phone && (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone size={15} />
                      {profile.phone}
                    </span>
                  )}

                  <span className="inline-flex items-center gap-1.5">
                    <Building2 size={15} />
                    {profile.department || "No department"}
                  </span>
                </div>
              </div>

              {/* PHOTO ACTIONS */}

              <div className="flex flex-wrap gap-2 sm:pb-1">
                <label
                  htmlFor="profile-photo"
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-blue-200 cursor-pointer transition ${
                    photoUploading
                      ? "opacity-50 pointer-events-none"
                      : ""
                  }`}
                >
                  <Camera size={16} />
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
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-red-100 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition"
                  >
                    <Trash2 size={16} />
                    Remove
                  </button>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-400 mt-3">
              JPG, JPEG, PNG or WebP · Max 5 MB
            </p>

            {photoError && (
              <p className="text-xs text-red-600 mt-1">
                {photoError}
              </p>
            )}
          </div>
        </div>

        {/* =========================
            TICKET STATS
        ========================= */}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;

            return (
              <button
                key={card.label}
                type="button"
                onClick={() => navigate(card.path)}
                className="group bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 text-left shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div
                  className={`${card.tile} w-11 h-11 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}
                >
                  <Icon size={20} />
                </div>

                <div className="min-w-0">
                  <p className="text-2xl font-bold text-slate-800 leading-none">
                    {card.value}
                  </p>

                  <p className="text-xs text-slate-500 mt-1.5 truncate">
                    {card.label}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* =========================
            SETTINGS AREA
        ========================= */}

        <div className="grid grid-cols-1 lg:grid-cols-[250px_minmax(0,1fr)] gap-6 items-start">

          {/* TAB NAVIGATION */}

          <nav className="bg-white border border-slate-200 rounded-2xl shadow-sm p-2 flex lg:flex-col gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => selectTab(tab.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left whitespace-nowrap transition ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Icon size={17} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {tab.label}
                    </p>

                    <p className="text-xs text-slate-500 hidden lg:block">
                      {tab.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* TAB CONTENT */}

          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm">

            {/* =========================
                PERSONAL INFO TAB
            ========================= */}

            {activeTab === "personal" && (
              <form onSubmit={handleSave}>
                <div className="px-5 sm:px-6 py-5 border-b border-slate-100">
                  <h2 className="text-lg font-semibold text-slate-800">
                    Personal Information
                  </h2>

                  <p className="text-sm text-slate-500 mt-0.5">
                    Update your name and contact details.
                  </p>
                </div>

                <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-5">

                  {/* FULL NAME */}

                  <div>
                    <label
                      htmlFor="profile-name"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Full Name
                    </label>

                    <div className="relative">
                      <User
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        id="profile-name"
                        type="text"
                        name="name"
                        value={profile.name}
                        onChange={handleChange}
                        placeholder="Your full name"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* EMAIL */}

                  <div>
                    <label
                      htmlFor="profile-email"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Email
                    </label>

                    <div className="relative">
                      <Mail
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        id="profile-email"
                        type="email"
                        name="email"
                        value={profile.email}
                        onChange={handleChange}
                        placeholder="you@company.com"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* PHONE */}

                  <div>
                    <label
                      htmlFor="profile-phone"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Phone
                    </label>

                    <div className="relative">
                      <Phone
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        id="profile-phone"
                        type="tel"
                        name="phone"
                        value={profile.phone}
                        onChange={handleChange}
                        placeholder="Add a phone number"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* DEPARTMENT */}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
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
                        className={readOnlyInputClass}
                      />

                      <Lock
                        size={14}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300"
                      />
                    </div>
                  </div>

                  {/* ROLE */}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
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
                        className={readOnlyInputClass}
                      />

                      <Lock
                        size={14}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300"
                      />
                    </div>
                  </div>

                  <p className="md:col-span-2 -mt-2 text-xs text-slate-400">
                    Role and department are managed by an administrator.
                  </p>
                </div>

                {/* PROFILE SUCCESS */}

                {profileSuccess && (
                  <div className="mx-5 sm:mx-6 mb-5 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">
                    <CheckCircle size={16} />
                    {profileSuccess}
                  </div>
                )}

                {/* ACTIONS */}

                <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/60 rounded-b-2xl">
                  <p className="text-xs text-slate-500">
                    {isProfileDirty
                      ? "You have unsaved changes."
                      : "All changes saved."}
                  </p>

                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={handleResetProfile}
                      disabled={!isProfileDirty || saving}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      <RotateCcw size={15} />
                      Reset
                    </button>

                    <button
                      type="submit"
                      disabled={!isProfileDirty || saving}
                      className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:bg-blue-300 disabled:cursor-not-allowed transition"
                    >
                      <Save size={16} />

                      {saving
                        ? "Saving..."
                        : "Save Changes"}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* =========================
                SECURITY TAB
            ========================= */}

            {activeTab === "password" && (
              <form onSubmit={handleChangePassword}>
                <div className="px-5 sm:px-6 py-5 border-b border-slate-100">
                  <h2 className="text-lg font-semibold text-slate-800">
                    Change Password
                  </h2>

                  <p className="text-sm text-slate-500 mt-0.5">
                    Use a strong password you don't use anywhere else.
                  </p>
                </div>

                <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_240px] gap-6">
                  <div className="space-y-5">
                    {passwordError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                        {passwordError}
                      </div>
                    )}

                    {passwordSuccess && (
                      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">
                        <CheckCircle size={16} />
                        {passwordSuccess}
                      </div>
                    )}

                    {renderPasswordField({
                      name: "currentPassword",
                      label: "Current Password",
                      placeholder: "Enter current password",
                      autoComplete: "current-password",
                      visible: showCurrentPassword,
                      toggle: setShowCurrentPassword,
                    })}

                    <div>
                      {renderPasswordField({
                        name: "newPassword",
                        label: "New Password",
                        placeholder: "Enter new password",
                        autoComplete: "new-password",
                        visible: showNewPassword,
                        toggle: setShowNewPassword,
                      })}

                      {/* STRENGTH METER */}

                      <div className="flex items-center gap-3 mt-2.5">
                        <div className="flex-1 grid grid-cols-4 gap-1.5">
                          {[1, 2, 3, 4].map((level) => (
                            <div
                              key={level}
                              className={`h-1.5 rounded-full transition-colors ${
                                strengthScore >= level
                                  ? strength.color
                                  : "bg-slate-200"
                              }`}
                            />
                          ))}
                        </div>

                        <span
                          className={`text-xs font-semibold w-12 text-right ${strength.text}`}
                        >
                          {strength.label}
                        </span>
                      </div>
                    </div>

                    <div>
                      {renderPasswordField({
                        name: "confirmPassword",
                        label: "Confirm New Password",
                        placeholder: "Confirm new password",
                        autoComplete: "new-password",
                        visible: showConfirmPassword,
                        toggle: setShowConfirmPassword,
                      })}

                      {passwordData.confirmPassword && (
                        <p
                          className={`flex items-center gap-1.5 text-xs mt-2 ${
                            passwordsMatch
                              ? "text-emerald-600"
                              : "text-red-600"
                          }`}
                        >
                          {passwordsMatch ? (
                            <Check size={14} />
                          ) : (
                            <X size={14} />
                          )}
                          {passwordsMatch
                            ? "Passwords match"
                            : "Passwords do not match"}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* REQUIREMENTS */}

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 h-fit">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">
                      Password tips
                    </p>

                    <ul className="space-y-2.5">
                      {passwordChecks.map((check) => (
                        <li
                          key={check.label}
                          className={`flex items-center gap-2 text-sm ${
                            check.passed
                              ? "text-emerald-600"
                              : "text-slate-500"
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                              check.passed
                                ? "bg-emerald-100"
                                : "bg-slate-200"
                            }`}
                          >
                            {check.passed ? (
                              <Check size={12} />
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            )}
                          </span>
                          {check.label}
                        </li>
                      ))}
                    </ul>

                    <p className="text-xs text-slate-400 mt-3">
                      Only the first one is required.
                    </p>
                  </div>
                </div>

                {/* ACTIONS */}

                <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/60 rounded-b-2xl">
                  <button
                    type="button"
                    onClick={() =>
                      navigate("/forgot-password")
                    }
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium text-left"
                  >
                    Forgot your current password?
                  </button>

                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:bg-blue-300 disabled:cursor-not-allowed transition"
                  >
                    <KeyRound size={16} />
                    {changingPassword
                      ? "Changing Password..."
                      : "Change Password"}
                  </button>
                </div>
              </form>
            )}

            {/* =========================
                PREFERENCES TAB
            ========================= */}

            {activeTab === "preferences" && (
              <div>
                <div className="px-5 sm:px-6 py-5 border-b border-slate-100">
                  <h2 className="text-lg font-semibold text-slate-800">
                    Preferences
                  </h2>

                  <p className="text-sm text-slate-500 mt-0.5">
                    Your current appearance and notification settings.
                  </p>
                </div>

                <div className="p-5 sm:p-6 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {preferenceItems.map((item) => {
                      const Icon = item.icon;

                      return (
                        <div
                          key={item.label}
                          className="border border-slate-200 rounded-xl p-4 flex items-center gap-3"
                        >
                          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                            <Icon size={18} />
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs text-slate-500">
                              {item.label}
                            </p>

                            <p className="text-sm font-semibold text-slate-800">
                              {item.value}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/settings")}
                    className="group w-full flex items-center justify-between gap-4 border border-slate-200 rounded-xl p-4 text-left hover:border-blue-200 hover:bg-blue-50/40 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Settings size={18} />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          Open Settings
                        </p>

                        <p className="text-xs text-slate-500 mt-0.5">
                          Change theme, notifications and layout.
                        </p>
                      </div>
                    </div>

                    <ChevronRight
                      size={18}
                      className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition"
                    />
                  </button>
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
