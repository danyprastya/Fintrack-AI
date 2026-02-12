"use client";

import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { useDynamicIslandToast } from "@/components/ui/dynamic-island-toast";
import { useRouter } from "next/navigation";
import { getFirebaseAuth } from "@/lib/firebase";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { PhotoCropDialog } from "@/components/profile/photo-crop-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Camera, LogOut, Loader2, Save, Trash2 } from "lucide-react";

export default function ProfilePage() {
  const { profile, signOut, updateUserProfile, isAuthenticated } = useAuth();
  const { language, t } = useLanguage();
  const { showToast } = useDynamicIslandToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [pendingPhotoBlob, setPendingPhotoBlob] = useState<Blob | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);

  const initials = (profile?.displayName || "U").charAt(0).toUpperCase();
  const currentPhotoURL = photoPreview || profile?.photoURL;

  // Track if there are unsaved changes
  const hasNameChange = displayName.trim() !== (profile?.displayName || "");
  const hasPhotoChange = pendingPhotoBlob !== null;
  const hasUnsavedChanges = hasNameChange || hasPhotoChange;

  /** Get Firebase ID token for API calls */
  async function getIdToken(): Promise<string | null> {
    const fireAuth = getFirebaseAuth();
    if (!fireAuth?.currentUser) return null;
    return fireAuth.currentUser.getIdToken();
  }

  /** Handle file selection — open crop dialog */
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError(null);

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      showToast("error", t.profile.unsupportedFormat);
      return;
    }

    setCropFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /** Store cropped blob as pending — don't upload yet */
  const handleCropConfirm = useCallback((blob: Blob) => {
    setCropFile(null);
    const previewUrl = URL.createObjectURL(blob);
    setPhotoPreview(previewUrl);
    setPendingPhotoBlob(blob);
  }, []);

  /** Handle avatar deletion */
  const handleDeletePhoto = async () => {
    if (!profile?.photoURL && !pendingPhotoBlob) return;

    // If there's a pending (unsaved) photo, just clear it
    if (pendingPhotoBlob) {
      setPhotoPreview(null);
      setPendingPhotoBlob(null);
      return;
    }

    setIsDeletingPhoto(true);
    setPhotoError(null);

    try {
      const idToken = await getIdToken();
      if (!idToken) throw new Error("Not authenticated");

      const res = await fetch("/api/avatar", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (!res.ok) throw new Error("Delete failed");

      await updateUserProfile({ photoURL: "" });
      setPhotoPreview(null);
      showToast("success", t.toast.photoDeleted);
    } catch (err) {
      console.error("Avatar delete failed:", err);
      setPhotoError(t.profile.deletePhotoFailed);
    } finally {
      setIsDeletingPhoto(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Upload pending photo if any
      if (pendingPhotoBlob) {
        const idToken = await getIdToken();
        if (!idToken) throw new Error("Not authenticated");

        const formData = new FormData();
        formData.append("avatar", pendingPhotoBlob, "avatar.jpg");

        const res = await fetch("/api/avatar", {
          method: "POST",
          headers: { Authorization: `Bearer ${idToken}` },
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Upload failed");
        }

        const { photoURL } = await res.json();
        await updateUserProfile({ photoURL });
        setPhotoPreview(null);
        setPendingPhotoBlob(null);
      }

      // Update name if changed
      if (hasNameChange && displayName.trim()) {
        await updateUserProfile({ displayName: displayName.trim() });
      }

      showToast("success", t.toast.profileSaved);
    } catch {
      showToast("error", t.profile.saveFailed);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowDiscardConfirm(true);
    } else {
      router.back();
    }
  };

  const handleDiscard = () => {
    setShowDiscardConfirm(false);
    setPhotoPreview(null);
    setPendingPhotoBlob(null);
    setDisplayName(profile?.displayName || "");
    router.back();
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      showToast("success", t.toast.signOutSuccess);
      router.push("/login");
    } catch {
      showToast("error", t.profile.signOutFailed);
      setIsSigningOut(false);
    }
  };

  if (!isAuthenticated) {
    router.push("/login");
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title={t.profile.title} showBack onBack={handleBack} />

      <div className="flex-1 p-4 space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3 pt-4">
          <div className="relative">
            <Avatar className="h-24 w-24 border-4 border-primary/20 shadow-xl shadow-primary/10">
              {currentPhotoURL ? (
                <AvatarImage
                  src={currentPhotoURL}
                  alt={profile?.displayName || ""}
                />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>

            {/* Camera button — triggers file input */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              onPointerDown={(e) => {
                // Prevent releasePointerCapture error from motion/draggable
                e.stopPropagation();
              }}
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground shadow-md flex items-center justify-center"
              style={{ touchAction: "manipulation" }}
            >
              <Camera className="h-3.5 w-3.5" />
            </button>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            {pendingPhotoBlob ? t.profile.photoReady : t.profile.photoHint}
          </p>
          <p className="text-[10px] text-muted-foreground/60">
            {t.profile.photoMaxSize}
          </p>

          {/* Photo error message */}
          {photoError && (
            <p className="text-xs text-destructive">{photoError}</p>
          )}

          {/* Delete photo button */}
          {(profile?.photoURL || pendingPhotoBlob) && (
            <button
              onClick={handleDeletePhoto}
              disabled={isDeletingPhoto}
              className="flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50"
            >
              {isDeletingPhoto ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
              {t.profile.deletePhoto}
            </button>
          )}
        </div>

        {/* Form fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t.profile.name}
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
              {t.profile.email}
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
          disabled={isSaving || !hasUnsavedChanges}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Save className="h-4 w-4" />
              {t.profile.save}
            </>
          )}
        </button>

        {/* Sign Out */}
        <button
          onClick={() => setShowSignOutConfirm(true)}
          disabled={isSigningOut}
          className="w-full h-12 rounded-xl border border-destructive/30 text-destructive font-semibold hover:bg-destructive/5 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSigningOut ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <LogOut className="h-4 w-4" />
              {t.profile.signOut}
            </>
          )}
        </button>
      </div>

      {/* Sign Out Confirmation */}
      <ConfirmationDialog
        open={showSignOutConfirm}
        title={t.settings.signOutTitle}
        message={t.settings.signOutConfirm}
        confirmLabel={t.profile.signOut}
        cancelLabel={t.settings.cancel}
        onConfirm={handleSignOut}
        onCancel={() => setShowSignOutConfirm(false)}
        danger
        isLoading={isSigningOut}
      />

      {/* Discard Changes Confirmation */}
      <ConfirmationDialog
        open={showDiscardConfirm}
        title={t.profile.discardTitle}
        message={t.profile.discardMessage}
        confirmLabel={t.profile.discard}
        cancelLabel={t.profile.continueEditing}
        onConfirm={handleDiscard}
        onCancel={() => setShowDiscardConfirm(false)}
        danger
      />

      {/* Photo Crop Dialog */}
      {cropFile && (
        <PhotoCropDialog
          file={cropFile}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropFile(null)}
        />
      )}
    </div>
  );
}
