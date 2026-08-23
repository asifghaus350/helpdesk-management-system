import { useEffect, useState } from "react";
import { User, Mail, Phone, Building2, Pencil } from "lucide-react";
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
    phone: "",
    department: "",
  });

  // =========================
  // USER ID
  // =========================

  const [userId, setUserId] = useState(null);

  // =========================
  // LOADING / ERROR
  // =========================

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
        // GET ALL USERS
        // =========================

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
              "Failed to fetch profile"
          );
        }

        // =========================
        // GET LOGGED-IN USER ID
        // =========================

        const tokenPayload = JSON.parse(
          atob(token.split(".")[1])
        );

        const loggedInUserId =
          tokenPayload.id;

        // =========================
        // FIND CURRENT USER
        // =========================

        const currentUser = (
          data.users || []
        ).find(
          (user) =>
            user._id === loggedInUserId ||
            user.id === loggedInUserId
        );

        if (!currentUser) {
          throw new Error(
            "Logged-in user was not found."
          );
        }

        // =========================
        // SAVE USER ID
        // =========================

        setUserId(
          currentUser._id ||
            currentUser.id
        );

        // =========================
        // SET PROFILE
        // =========================

        setProfile({
          name: currentUser.name || "",
          email: currentUser.email || "",
          role: currentUser.role || "",
          phone: currentUser.phone || "",
          department:
            currentUser.department || "",
        });
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
  // HANDLE CHANGE
  // =========================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================
  // SAVE PROFILE
  // =========================

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

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

      // =========================
      // UPDATE USER
      // =========================

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
            department: profile.department,
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

      // =========================
      // UPDATE LOCAL STATE
      // =========================

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
        phone:
          updatedUser.phone ??
          prev.phone,
        department:
          updatedUser.department ??
          prev.department,
      }));

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
  // LOADING
  // =========================

  if (loading) {
    return (
      <Layout>
        <div className="bg-white rounded-2xl shadow-md p-10 text-center text-gray-500">
          Loading profile...
        </div>
      </Layout>
    );
  }

  // =========================
  // PROFILE PAGE
  // =========================

  return (
    <Layout>

      {/* =========================
          HEADING
      ========================= */}

      <div className="mb-8">

        <h1 className="text-3xl font-bold text-slate-800">
          My Profile
        </h1>

        <p className="text-gray-500 mt-2">
          View and manage your profile information.
        </p>

      </div>

      {/* =========================
          ERROR
      ========================= */}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* =========================
          PROFILE CARD
      ========================= */}

      <div className="bg-white rounded-2xl shadow-md overflow-hidden">

        {/* =========================
            PROFILE HEADER
        ========================= */}

        <div className="bg-slate-800 p-8 text-white">

          <div className="flex items-center gap-5">

            <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center">

              <User size={40} />

            </div>

            <div>

              <h2 className="text-2xl font-bold">
                {profile.name}
              </h2>

              <p className="text-slate-300 mt-1">
                {profile.role}
              </p>

            </div>

          </div>

        </div>

        {/* =========================
            PROFILE INFORMATION
        ========================= */}

        <form
          onSubmit={handleSave}
          className="p-8"
        >

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* =========================
                NAME
            ========================= */}

            <div>

              <label className="block font-medium mb-2">
                Full Name
              </label>

              <div className="relative">

                <User
                  size={18}
                  className="absolute left-3 top-3.5 text-gray-400"
                />

                <input
                  type="text"
                  name="name"
                  value={profile.name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full border rounded-xl pl-10 pr-4 py-3 outline-none disabled:bg-gray-100 disabled:text-gray-600 focus:ring-2 focus:ring-blue-500"
                />

              </div>

            </div>

            {/* =========================
                EMAIL
            ========================= */}

            <div>

              <label className="block font-medium mb-2">
                Email
              </label>

              <div className="relative">

                <Mail
                  size={18}
                  className="absolute left-3 top-3.5 text-gray-400"
                />

                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full border rounded-xl pl-10 pr-4 py-3 outline-none disabled:bg-gray-100 disabled:text-gray-600 focus:ring-2 focus:ring-blue-500"
                />

              </div>

            </div>

            {/* =========================
                PHONE
            ========================= */}

            <div>

              <label className="block font-medium mb-2">
                Phone
              </label>

              <div className="relative">

                <Phone
                  size={18}
                  className="absolute left-3 top-3.5 text-gray-400"
                />

                <input
                  type="text"
                  name="phone"
                  value={profile.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full border rounded-xl pl-10 pr-4 py-3 outline-none disabled:bg-gray-100 disabled:text-gray-600 focus:ring-2 focus:ring-blue-500"
                />

              </div>

            </div>

            {/* =========================
                DEPARTMENT
            ========================= */}

            <div>

              <label className="block font-medium mb-2">
                Department
              </label>

              <div className="relative">

                <Building2
                  size={18}
                  className="absolute left-3 top-3.5 text-gray-400"
                />

                <input
                  type="text"
                  name="department"
                  value={profile.department}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full border rounded-xl pl-10 pr-4 py-3 outline-none disabled:bg-gray-100 disabled:text-gray-600 focus:ring-2 focus:ring-blue-500"
                />

              </div>

            </div>

            {/* =========================
                ROLE
            ========================= */}

            <div className="md:col-span-2">

              <label className="block font-medium mb-2">
                Role
              </label>

              <input
                type="text"
                value={profile.role}
                disabled
                className="w-full border rounded-xl px-4 py-3 bg-gray-100 text-gray-600"
              />

            </div>

          </div>

          {/* =========================
              BUTTONS
          ========================= */}

          <div className="flex justify-end gap-4 mt-8">

            {!isEditing ? (

              <button
                type="button"
                onClick={() =>
                  setIsEditing(true)
                }
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-semibold"
              >

                <Pencil size={18} />

                Edit Profile

              </button>

            ) : (

              <>

                <button
                  type="button"
                  onClick={() =>
                    setIsEditing(false)
                  }
                  disabled={saving}
                  className="px-6 py-3 rounded-xl border hover:bg-gray-100 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold disabled:bg-blue-400 disabled:cursor-not-allowed"
                >

                  {saving
                    ? "Saving..."
                    : "Save Changes"}

                </button>

              </>

            )}

          </div>

        </form>

      </div>

    </Layout>
  );
}

export default Profile;