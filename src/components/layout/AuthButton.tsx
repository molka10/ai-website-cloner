import { LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { firebaseReady } from "@/lib/firebase";
import { useAuthStore } from "@/store/authStore";

export default function AuthButton() {
  const { user, loading, signIn, signOut } = useAuthStore();

  if (!firebaseReady || loading) return null;

  if (!user) {
    return (
      <Button variant="outline" size="sm" onClick={signIn}>
        <LogIn className="size-4" />
        <span className="hidden sm:inline">Sign in</span>
      </Button>
    );
  }

  const initial = (user.displayName ?? user.email ?? "?").charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-1">
      {user.photoURL ? (
        <img
          src={user.photoURL}
          alt=""
          referrerPolicy="no-referrer"
          className="size-8 rounded-full border"
          title={user.email ?? user.displayName ?? ""}
        />
      ) : (
        <span className="grid size-8 place-items-center rounded-full bg-muted text-sm font-medium">{initial}</span>
      )}
      <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out" title="Sign out">
        <LogOut className="size-4" />
      </Button>
    </div>
  );
}