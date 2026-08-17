import { useState } from "react";
import { User, Mail, Phone, Building2, Pencil } from "lucide-react";

import Layout from "../components/layout/Layout";

function Profile() {
  const [isEditing, setIsEditing] = useState(false);

  const [profile, setProfile] = useState(() => {
    const savedProfile = localStorage.getItem("profile");

    if (savedProfile) {
      return JSON.parse(savedProfile);
    }

    const defaultProfile = {
      name: "Admin User",
      email: "admin@example.com",
      role: "Administrator",
      phone: "+91 9876543210",
      department: "IT Support",
    };

    localStorage.setItem(
      "profile",
      JSON.stringify(defaultProfile)
    );

    return defaultProfile;
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();

    localStorage.setItem(
      "profile",
      JSON.stringify(profile)
    );

    setIsEditing(false);

    alert("Profile updated successfully!");
  };

  return (
    <Layout>

      {/* Heading */}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">
          My Profile
        </h1>

        <p className="text-gray-500 mt-2">
          View and manage your profile information.
        </p>
      </div>

      {/* Profile Card */}

      <div className="bg-white rounded-2xl shadow-md overflow-hidden">

        {/* Profile Header */}

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

        {/* Profile Information */}

        <form
          onSubmit={handleSave}
          className="p-8"
        >

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Name */}

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

            {/* Email */}

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

            {/* Phone */}

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

            {/* Department */}

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

            {/* Role */}

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

          {/* Buttons */}

          <div className="flex justify-end gap-4 mt-8">

            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-semibold"
              >
                <Pencil size={18} />
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-3 rounded-xl border hover:bg-gray-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold"
                >
                  Save Changes
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