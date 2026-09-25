import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Edit, LogOut } from "lucide-react";

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(user || null);
  const [loading, setLoading] = useState(!user);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await api.getMe();
        if (data) setProfile(data);
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const initial = profile?.username?.charAt(0)?.toUpperCase() || "U";

  return (
    <div className="min-h-screen pt-14 animated-gradient-bg">
      <div className="glass text-primary-foreground py-6 text-center shadow-md border-b border-border/40">
        <h1 className="text-2xl font-bold">Student Profile</h1>
      </div>
      <div className="flex flex-col md:flex-row items-center justify-center gap-10 p-8 md:p-16">
        <div className="w-40 h-40 rounded-full glass border border-primary/20 flex items-center justify-center text-5xl font-bold text-primary shadow-2xl flex-shrink-0 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5"></div>
          {initial}
        </div>
        <div className="space-y-4 w-full max-w-md">
          {[
            { label: "Name", value: profile?.username || "N/A" },
            { label: "Email", value: profile?.email || "N/A" },
            { label: "Department", value: profile?.department || "Not assigned" },
            { label: "Register Number", value: profile?.registerNumber || "N/A" },
            { label: "Role", value: profile?.role ? profile.role.toUpperCase() : "STUDENT" }
          ].map((item) => (
            <Card key={item.label} className="p-4 shadow-lg glass-card">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="font-semibold">{item.value}</p>
            </Card>
          ))}
          <div className="flex gap-3 pt-2">
            <Button onClick={() => navigate("/edit-profile")} className="gradient-navy text-primary-foreground flex-1">
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
            <Button onClick={handleLogout} variant="destructive" className="flex-initial">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;