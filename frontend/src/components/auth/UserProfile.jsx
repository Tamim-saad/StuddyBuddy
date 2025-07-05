import React, { useState, useEffect } from "react";
import { authServices } from "../../auth";
import { toast } from "../../lib/toast";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent } from "../ui/card";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Separator } from "../ui/separator";
import { Toaster } from "../ui/toaster";
import { User, Lock, Mail, Loader2, Shield, Settings } from "lucide-react";
import { appConfig } from "../../common/config";

export const UserProfile = () => {
  const [user, setUser] = useState({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
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
      });
      setLoading(false);
    } else {
      fetchUserProfile();
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = authServices.getAccessToken();
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
      const token = authServices.getAccessToken();
      const res = await fetch(`${process.env.REACT_APP_BASE_URL}/api/user/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
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
      const token = authServices.getAccessToken();
      const res = await fetch(`${process.env.REACT_APP_BASE_URL}/api/user/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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
      <div className="flex-1 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-slate-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <div className="w-full max-w-6xl mx-auto">
          {/* Single Card Layout */}
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm overflow-hidden w-full">
            {/* Profile Header with Avatar */}
            <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 px-6 md:px-8 py-8 md:py-12">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative z-10 flex flex-col lg:flex-row items-center lg:items-start gap-6">
                <div className="relative">
                  <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-white shadow-xl">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl md:text-4xl font-bold">
                      {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 md:w-8 md:h-8 rounded-full border-4 border-white"></div>
                </div>
                
                <div className="text-center lg:text-left text-white flex-1">
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">{user.name || "Anonymous User"}</h1>
                  <div className="flex items-center justify-center lg:justify-start gap-2 text-blue-100 mb-4">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm md:text-base">{user.email}</span>
                  </div>
                </div>
              </div>
            </div>

            <CardContent className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
              <Separator className="my-6 md:my-8" />

              {/* Profile Information Form */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-semibold text-slate-800">Profile Information</h2>
                    <p className="text-sm md:text-base text-slate-600">Update your personal information</p>
                  </div>
                </div>

                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        className="h-10 md:h-12 text-sm md:text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Enter your email"
                        className="h-10 md:h-12 text-sm md:text-base"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <Button
                      type="submit"
                      disabled={updating}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 md:px-8 py-2 md:py-3 h-10 md:h-12 text-sm md:text-base font-medium"
                    >
                      {updating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating Profile...
                        </>
                      ) : (
                        <>
                          <Settings className="mr-2 h-4 w-4" />
                          Update Profile
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>

              <Separator className="my-6 md:my-8" />

              {/* Security Settings Form */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <Lock className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-semibold text-slate-800">Security Settings</h2>
                    <p className="text-sm md:text-base text-slate-600">Update your password to keep your account secure</p>
                  </div>
                </div>

                <form onSubmit={handlePasswordUpdate} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      required
                      className="h-10 md:h-12 text-sm md:text-base"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        required
                        className="h-10 md:h-12 text-sm md:text-base"
                      />
                      <p className="text-xs md:text-sm text-slate-500">At least 6 characters</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        required
                        className={`h-10 md:h-12 text-sm md:text-base ${
                          passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword
                            ? 'border-red-500'
                            : ''
                        }`}
                      />
                      {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                        <p className="text-xs md:text-sm text-red-500">Passwords do not match</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <Button
                      type="submit"
                      disabled={changingPassword}
                      variant="destructive"
                      className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 px-6 md:px-8 py-2 md:py-3 h-10 md:h-12 text-sm md:text-base font-medium"
                    >
                      {changingPassword ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Changing Password...
                        </>
                      ) : (
                        <>
                          <Shield className="mr-2 h-4 w-4" />
                          Change Password
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-6 md:mt-8">
            <p className="text-slate-500 text-xs md:text-sm">
              Keep your profile information up to date
            </p>
          </div>
        </div>
      </div>
      <Toaster />
    </>
  );
};
