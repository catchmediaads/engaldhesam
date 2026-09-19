"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

type Mode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<Mode>("login");

  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setError("");
    setMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    try {
      // ======================================================
      // LOGIN
      // ======================================================

      if (mode === "login") {
        const { data, error: loginError } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

        if (loginError) {
          throw new Error(loginError.message);
        }

        if (!data.user) {
          throw new Error("Login failed. Please try again.");
        }

        // Get role from existing database function
        const { data: role, error: roleError } =
          await supabase.rpc("get_my_role");

        if (roleError) {
          throw new Error(
            "Unable to determine your account role."
          );
        }

        if (role === "super_admin") {
          router.push("/admin");
          return;
        }

        if (role === "editor") {
          router.push("/admin/review");
          return;
        }

        if (role === "reporter") {
          router.push("/reporter");
          return;
        }

        // Reader
        router.push("/");
        return;
      }

      // ======================================================
      // SIGN UP
      // ======================================================

      if (!fullName.trim()) {
        throw new Error("Please enter your full name.");
      }

      if (!mobile.trim()) {
        throw new Error("Please enter your mobile number.");
      }

      if (!email.trim()) {
        throw new Error("Please enter your email address.");
      }

      if (password.length < 6) {
        throw new Error(
          "Password must contain at least 6 characters."
        );
      }

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      const { data, error: signupError } =
        await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              mobile: mobile.trim(),
            },
          },
        });

      if (signupError) {
        throw new Error(signupError.message);
      }

      // Supabase may require email confirmation.
      if (!data.session) {
        setMessage(
          "Account created successfully. Please check your email and confirm your account before logging in."
        );

        setPassword("");
        setConfirmPassword("");
        return;
      }

      // If email confirmation is disabled,
      // user may already have an active session.
      setMessage(
        "Account created successfully. Welcome to Engal Dhesam!"
      );

      setTimeout(() => {
        router.push("/");
      }, 1200);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-container">

        {/* ==================================================
            BRAND
        ================================================== */}

        <div className="auth-brand">
          <Link href="/" className="auth-brand-link">
            <div className="auth-brand-title">
              எங்கள் தேசம்
            </div>

            <div className="auth-brand-subtitle">
              ENGAL DHESAM
            </div>
          </Link>

          <p>
            ஓர் இனத்தின் பெருங்கனவு
          </p>
        </div>


        {/* ==================================================
            CARD
        ================================================== */}

        <div className="auth-card">

          <div className="auth-card-header">
            <h1>
              {mode === "login"
                ? "உள்நுழைய"
                : "கணக்கை உருவாக்குங்கள்"}
            </h1>

            <p>
              {mode === "login"
                ? "உங்கள் Engal Dhesam கணக்கில் உள்நுழையுங்கள்."
                : "Engal Dhesam வாசகர் கணக்கை இலவசமாக உருவாக்குங்கள்."}
            </p>
          </div>


          {/* ==================================================
              MODE SWITCH
          ================================================== */}

          <div className="auth-mode-switch">

            <button
              type="button"
              className={
                mode === "login"
                  ? "auth-mode-button active"
                  : "auth-mode-button"
              }
              onClick={() => switchMode("login")}
            >
              உள்நுழைய
            </button>

            <button
              type="button"
              className={
                mode === "signup"
                  ? "auth-mode-button active"
                  : "auth-mode-button"
              }
              onClick={() => switchMode("signup")}
            >
              புதிய கணக்கு
            </button>

          </div>


          {/* ==================================================
              ERROR
          ================================================== */}

          {error && (
            <div className="auth-message auth-error">
              {error}
            </div>
          )}


          {/* ==================================================
              SUCCESS
          ================================================== */}

          {message && (
            <div className="auth-message auth-success">
              {message}
            </div>
          )}


          {/* ==================================================
              FORM
          ================================================== */}

          <form
            onSubmit={handleSubmit}
            className="auth-form"
          >

            {/* SIGNUP FIELDS */}

            {mode === "signup" && (
              <>
                <div className="auth-field">
                  <label htmlFor="fullName">
                    முழுப் பெயர்
                  </label>

                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(event) =>
                      setFullName(event.target.value)
                    }
                    placeholder="உங்கள் முழுப் பெயர்"
                    autoComplete="name"
                    disabled={loading}
                    required
                  />
                </div>


                <div className="auth-field">
                  <label htmlFor="mobile">
                    மொபைல் எண்
                  </label>

                  <input
                    id="mobile"
                    type="tel"
                    value={mobile}
                    onChange={(event) =>
                      setMobile(event.target.value)
                    }
                    placeholder="உதாரணம்: 9876543210"
                    autoComplete="tel"
                    disabled={loading}
                    required
                  />
                </div>
              </>
            )}


            {/* EMAIL */}

            <div className="auth-field">
              <label htmlFor="email">
                மின்னஞ்சல்
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="your@email.com"
                autoComplete="email"
                disabled={loading}
                required
              />
            </div>


            {/* PASSWORD */}

            <div className="auth-field">
              <label htmlFor="password">
                கடவுச்சொல்
              </label>

              <div className="auth-password-wrapper">
                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="குறைந்தது 6 எழுத்துகள்"
                  autoComplete={
                    mode === "login"
                      ? "current-password"
                      : "new-password"
                  }
                  disabled={loading}
                  required
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  tabIndex={-1}
                >
                  {showPassword ? "மறை" : "காண்பி"}
                </button>
              </div>
            </div>


            {/* CONFIRM PASSWORD */}

            {mode === "signup" && (
              <div className="auth-field">
                <label htmlFor="confirmPassword">
                  கடவுச்சொல்லை உறுதிப்படுத்தவும்
                </label>

                <div className="auth-password-wrapper">
                  <input
                    id="confirmPassword"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(
                        event.target.value
                      )
                    }
                    placeholder="கடவுச்சொல்லை மீண்டும் உள்ளிடவும்"
                    autoComplete="new-password"
                    disabled={loading}
                    required
                  />

                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                    tabIndex={-1}
                  >
                    {showConfirmPassword
                      ? "மறை"
                      : "காண்பி"}
                  </button>
                </div>
              </div>
            )}


            {/* LOGIN HELP */}

            {mode === "login" && (
              <div className="auth-login-help">
                <Link href="/forgot-password">
                  கடவுச்சொல் மறந்துவிட்டதா?
                </Link>
              </div>
            )}


            {/* SIGNUP INFO */}

            {mode === "signup" && (
              <div className="auth-reader-info">
                <strong>வாசகர் கணக்கு</strong>

                <p>
                  கணக்கு உருவாக்கியவுடன் நீங்கள்
                  Engal Dhesam வாசகராக பதிவு செய்யப்படுவீர்கள்.
                  E-Paper சந்தா மற்றும் Reporter விண்ணப்பம்
                  போன்ற வசதிகளை பின்னர் பயன்படுத்தலாம்.
                </p>
              </div>
            )}


            {/* SUBMIT */}

            <button
              type="submit"
              className="auth-submit-button"
              disabled={loading}
            >
              {loading
                ? "செயல்படுத்தப்படுகிறது..."
                : mode === "login"
                ? "உள்நுழைய"
                : "கணக்கை உருவாக்கு"}
            </button>

          </form>


          {/* ==================================================
              FOOTER
          ================================================== */}

          <div className="auth-card-footer">

            <Link href="/">
              ← முகப்புப் பக்கத்திற்குச் செல்லுங்கள்
            </Link>

          </div>

        </div>

      </div>
    </main>
  );
}