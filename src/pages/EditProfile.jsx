import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const EditProfile = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    department: "",
    registerNumber: ""
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await api.getMe();
        if (data) {
          setForm({
            username: data.username || "",
            email: data.email || "",
            department: data.department || "",
            registerNumber: data.registerNumber || ""
          });
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };
    fetchUserData();
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.updateProfile(form);
      if (refreshProfile) await refreshProfile();
      toast.success("Profile updated successfully in MongoDB!");
      navigate("/profile");
    } catch (err) {
      toast.error(err.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-14 animated-gradient-bg">
      <div className="glass text-primary-foreground py-6 text-center shadow-md border-b border-border/40">
        <h1 className="text-2xl font-bold">Edit Profile</h1>
      </div>
      <div className="flex items-center justify-center p-8">
        <Card className="w-full max-w-md shadow-2xl glass-card">
          <CardHeader>
            <CardTitle>Update Your Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="username">Name</Label>
                <Input
                  id="username"
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="department">Department / Branch</Label>
                <Input
                  id="department"
                  type="text"
                  placeholder="e.g. CSE, ECE, AI&ML, IT"
                  value={form.department}
                  onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="registerNumber">Register / Roll Number</Label>
                <Input
                  id="registerNumber"
                  type="text"
                  placeholder="e.g. 23FE1A0501"
                  value={form.registerNumber}
                  onChange={(e) => setForm((prev) => ({ ...prev, registerNumber: e.target.value }))}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate("/profile")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 gradient-navy text-primary-foreground font-bold"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditProfile;