"use client";

import { FormEvent, useState } from "react";
import { createClient } from "../../lib/supabase-browser";

export default function LoginPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    // 1. Login with Supabase Auth
    const { error: loginError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (loginError) {
      setMessage(loginError.message);
      setLoading(false);
      return;
    }

    // 2. Get the user's newsroom role
    const { data: role, error: roleError } =
      await supabase.rpc("get_my_role");

    if (roleError) {
      console.error("Role error:", roleError);

      setMessage(
        "Unable to determine your newsroom role. Please contact the administrator."
      );

      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    // 3. Check whether a role exists
    if (!role) {
      setMessage(
        "Your account is not connected to a newsroom profile. Please contact the administrator."
      );

      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    // 4. Redirect according to role

    if (role === "super_admin") {
      window.location.href = "/admin";
      return;
    }

    if (role === "editor") {
      window.location.href = "/editor";
      return;
    }

    if (role === "reporter") {
      window.location.href = "/reporter";
      return;
    }

    // 5. Unknown role
    setMessage(
      "Your account does not have a valid newsroom role. Please contact the administrator."
    );

    await supabase.auth.signOut();
    setLoading(false);
  }

  return (
    <main className="login-page">
      <div className="login-card">

        {/* BRAND */}
        <div className="login-brand">
          <div className="login-logo">
            எங்கள் தேசம்
          </div>

          <div className="login-subtitle">
            ENGAL DHESAM • DIGITAL NEWSROOM
          </div>
        </div>

        <div className="login-divider" />

        {/* TITLE */}
        <h1>Login</h1>

        <p className="login-description">
          உங்கள் கணக்கில் உள்நுழைந்து Newsroom-ஐ அணுகவும்.
        </p>

        {/* LOGIN FORM */}
        <form onSubmit={handleLogin}>

          <label htmlFor="email">
            Email Address
          </label>

          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />

          <label htmlFor="password">
            Password
          </label>

          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />

          <button
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Login"}
          </button>

        </form>

        {/* MESSAGE */}
        {message && (
          <div className="login-message">
            {message}
          </div>
        )}

        {/* BACK TO HOME */}
        <a
          href="/"
          className="back-home"
        >
          ← Back to Homepage
        </a>

      </div>
    </main>
  );
}