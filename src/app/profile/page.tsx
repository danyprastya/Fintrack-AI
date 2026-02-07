"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Camera, LogOut, Loader2, Save } from "lucide-react";

export default function ProfilePage() {
  const { profile, signOut, updateUserProfile, isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();

  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const t = {
    id: {
      title: "Profil",
      name: "Nama",
      email: "Email",
      save: "Simpan Perubahan",
      saved: "Tersimpan!",
      signOut: "Keluar",
      signOutConfirm: "Yakin ingin keluar?",
      joined: "Bergabung sejak",
      photoHint: "Ketuk untuk ganti foto",
    },
    en: {
      title: "Profile",
      name: "Name",
      email: "Email",
      save: "Save Changes",
      saved: "Saved!",
      signOut: "Sign Out",
      signOutConfirm: "Are you sure you want to sign out?",
      joined: "Joined since",
      photoHint: "Tap to change photo",
    },
  };

  const l = t[language];
  const initials = (profile?.displayName || "U").charAt(0).toUpperCase();

  const handleSave = async () => {
    if (!displayName.trim()) return;
    setIsSaving(true);
    try {
      await updateUserProfile({ displayName: displayName.trim() });
    } catch {
      // silent
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      router.push("/login");
    } catch {
      setIsSigningOut(false);
    }
  };

  if (!isAuthenticated) {
    router.push("/login");
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title={l.title} showBack />

      <div className="flex-1 p-4 space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3 pt-4">
          <div className="relative">
            <Avatar className="h-24 w-24 border-4 border-primary/20 shadow-xl shadow-primary/10">
              {profile?.photoURL ? (
                <AvatarImage
                  src={profile.photoURL}
                  alt={profile.displayName || ""}
                />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground shadow-md flex items-center justify-center">
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground">{l.photoHint}</p>
        </div>

        {/* Form fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {l.name}
            </label>
            <Input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="h-12 rounded-xl"
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {l.email}
            </label>
            <Input
              type="email"
              value={profile?.email || ""}
              disabled
              className="h-12 rounded-xl bg-muted/50 text-muted-foreground"
            />
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={
            isSaving || displayName.trim() === (profile?.displayName || "")
          }
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Save className="h-4 w-4" />
              {l.save}
            </>
          )}
        </button>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="w-full h-12 rounded-xl border border-destructive/30 text-destructive font-semibold hover:bg-destructive/5 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSigningOut ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <LogOut className="h-4 w-4" />
              {l.signOut}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
