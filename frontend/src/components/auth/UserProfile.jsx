import React, { useState, useEffect } from "react";
import { authServices } from "../../auth";
import { toast } from "react-toastify";
import {
  Avatar,
  Button,
  TextField,
  Paper,
  Typography,
  Divider,
  Box,
  CircularProgress,
} from "../../common/icons";
import { appConfig } from "../../common/config";

export const UserProfile = () => {
  const [user, setUser] = useState({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    bio: "",
    avatar: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const currentUser = authServices.getAuthUser();
    if (currentUser) {
      setUser(currentUser);
      setFormData({
        name: currentUser.name || "",
        email: currentUser.email || "",
        bio: currentUser.bio || "",
        avatar: currentUser.avatar || "",
      });
      setLoading(false);
    } else {
      fetchUserProfile();
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = authServices.getRefreshToken();
      const res = await fetch(`${process.env.REACT_APP_BASE_URL}/api/user/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch profile");

      const data = await res.json();
      setUser(data);
      setFormData({
        name: data.name || "",
        email: data.email || "",
        bio: data.bio || "",
        avatar: data.avatar || "",
      });
    } catch (err) {
      toast.error("Error loading profile: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const token = authServices.getRefreshToken();
      const res = await fetch(`${process.env.REACT_APP_BASE_URL}/api/user/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Refresh-Token": token,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          bio: formData.bio,
          avatar: formData.avatar,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update profile");
      }

      const result = await res.json();
      const currentUser = authServices.getAuthUser();
      const updatedUser = { ...currentUser, ...result.user };
      localStorage.setItem(appConfig.CURRENT_USER_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(err.message || "Error updating profile");
    } finally {
      setUpdating(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = passwordData;

    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setChangingPassword(true);

    try {
      const token = authServices.getRefreshToken();
      const res = await fetch(`${process.env.REACT_APP_BASE_URL}/api/user/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Refresh-Token": token,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update password");
      }

      toast.success("Password updated successfully");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.message || "Error updating password");
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div className="p-4 md:p-10 max-w-6xl mx-auto">
      <Typography variant="h4" gutterBottom className="text-gray-700 font-semibold">
        My Profile
      </Typography>

      <div className="grid md:grid-cols-2 gap-6 mt-4">
        {/* Profile Information */}
        <Paper elevation={2} className="p-6 rounded-lg">
          <div className="flex items-center mb-6">
            <Avatar
              src={user.avatar || undefined}
              alt={user.name}
              sx={{ width: 80, height: 80 }}
            >
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </Avatar>
            <div className="ml-4">
              <Typography variant="h6">{user.name}</Typography>
              <Typography variant="body2" color="textSecondary">
                {user.email}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Member since {new Date(user.createdAt).toLocaleDateString()}
              </Typography>
            </div>
          </div>

          <Divider className="mb-6" />

          <form onSubmit={handleProfileUpdate}>
            <div className="space-y-4">
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
              />
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
              />
              <TextField
                fullWidth
                label="Avatar URL"
                name="avatar"
                value={formData.avatar}
                onChange={handleInputChange}
                placeholder="https://example.com/avatar.jpg"
                helperText="Direct URL to your profile image"
              />
              <TextField
                fullWidth
                label="Bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                multiline
                rows={4}
                placeholder="Tell us something about yourself"
              />

              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={updating}
                startIcon={updating ? <CircularProgress size={20} /> : null}
              >
                {updating ? "Updating..." : "Update Profile"}
              </Button>
            </div>
          </form>
        </Paper>

        {/* Password Change */}
        <Paper elevation={2} className="p-6 rounded-lg">
          <Typography variant="h6" className="mb-4">
            Change Password
          </Typography>

          <form onSubmit={handlePasswordUpdate}>
            <div className="space-y-4">
              <TextField
                fullWidth
                label="Current Password"
                name="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                required
              />
              <TextField
                fullWidth
                label="New Password"
                name="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
                helperText="At least 6 characters"
              />
              <TextField
                fullWidth
                label="Confirm New Password"
                name="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                required
                error={
                  !!passwordData.confirmPassword &&
                  passwordData.newPassword !== passwordData.confirmPassword
                }
                helperText={
                  passwordData.confirmPassword &&
                  passwordData.newPassword !== passwordData.confirmPassword
                    ? "Passwords do not match"
                    : " "
                }
              />

              <Button
                type="submit"
                variant="contained"
                color="secondary"
                disabled={changingPassword}
                startIcon={
                  changingPassword ? <CircularProgress size={20} /> : null
                }
              >
                {changingPassword ? "Changing..." : "Change Password"}
              </Button>
            </div>
          </form>
        </Paper>
      </div>
    </div>
  );
};
