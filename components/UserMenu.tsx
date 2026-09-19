"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

type UserInfo = {
  id: string;
  email: string | null;
  fullName: string;
};

export default function UserMenu() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (currentUser) {
        setUser({
          id: currentUser.id,
          email: currentUser.email ?? null,
          fullName:
            currentUser.user_metadata?.full_name ||
            currentUser.email?.split("@")[0] ||
            "User",
        });
      } else {
        setUser(null);
      }

      setLoading(false);
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;

        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email ?? null,
            fullName:
              session.user.user_metadata?.full_name ||
              session.user.email?.split("@")[0] ||
              "User",
          });
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleLogout() {
    setLoggingOut(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      setLoggingOut(false);
      return;
    }

    setMenuOpen(false);
    setUser(null);
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return null;
  }

  if (!user) {
    return (
      <Link href="/login" className="header-login-button">
        Login
      </Link>
    );
  }

  return (
    <div className="user-menu-wrapper">
      <button
        type="button"
        className="user-menu-button"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-expanded={menuOpen}
      >
        <span className="user-menu-avatar">
          {user.fullName.charAt(0).toUpperCase()}
        </span>

        <span className="user-menu-name">
          {user.fullName}
        </span>

        <span className="user-menu-arrow">
          {menuOpen ? "▲" : "▼"}
        </span>
      </button>

      {menuOpen && (
        <div className="user-dropdown">
          <div className="user-dropdown-header">
            <div className="user-dropdown-avatar">
              {user.fullName.charAt(0).toUpperCase()}
            </div>

            <div className="user-dropdown-info">
              <strong>{user.fullName}</strong>

              {user.email && (
                <span>{user.email}</span>
              )}
            </div>
          </div>

          <div className="user-dropdown-divider" />

          <Link
            href="/account"
            className="user-dropdown-item"
            onClick={() => setMenuOpen(false)}
          >
            <span>👤</span>
            My Account
          </Link>

          <Link
            href="/epaper"
            className="user-dropdown-item"
            onClick={() => setMenuOpen(false)}
          >
            <span>📰</span>
            E-Paper
          </Link>

          <Link
            href="/reporter/apply"
            className="user-dropdown-item"
            onClick={() => setMenuOpen(false)}
          >
            <span>✍️</span>
            Become a Reporter
          </Link>

          <div className="user-dropdown-divider" />

          <button
            type="button"
            className="user-dropdown-logout"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            <span>↪</span>
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      )}
    </div>
  );
}