"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

type UserData = {
  id: string;
  email: string;
  fullName: string;
  mobile: string;
  role: string;
};

export default function AccountPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadAccount() {
      try {
        const {
          data: { user: currentUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          console.error("Auth error:", authError);
        }

        if (!mounted) return;

        if (!currentUser) {
          router.replace("/login");
          return;
        }

        /*
         * IMPORTANT:
         * Use the existing security-definer RPC to determine
         * the user's actual role.
         */
        const {
          data: roleData,
          error: roleError,
        } = await supabase.rpc("get_my_role");

        if (roleError) {
          console.error("Role detection error:", roleError);
        }

        const role =
          typeof roleData === "string" && roleData.trim()
            ? roleData.trim()
            : "reader";

        if (!mounted) return;

        setUser({
          id: currentUser.id,
          email: currentUser.email ?? "",
          fullName:
            currentUser.user_metadata?.full_name ||
            currentUser.email?.split("@")[0] ||
            "User",
          mobile: currentUser.user_metadata?.mobile || "",
          role,
        });

        setLoading(false);
      } catch (error) {
        console.error("Account loading error:", error);

        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadAccount();

    return () => {
      mounted = false;
    };
  }, [router, supabase]);

  async function handleLogout() {
    setLoggingOut(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      setLoggingOut(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  if (loading) {
    return (
      <>
        <main className="account-page">
          <div className="account-loading">
            <div className="account-spinner" />
            <p>Loading your account...</p>
          </div>
        </main>

        <style jsx>{`
          .account-page {
            min-height: 70vh;
            background: #fbfaf7;
            padding: 40px 20px;
          }

          .account-loading {
            min-height: 60vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 15px;
            color: #6c7378;
          }

          .account-spinner {
            width: 38px;
            height: 38px;
            border: 3px solid #dce5e4;
            border-top-color: #176b73;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </>
    );
  }

  if (!user) {
    return null;
  }

  const firstLetter =
    user.fullName?.charAt(0)?.toUpperCase() || "U";

  const isSuperAdmin = user.role === "super_admin";
  const isEditor = user.role === "editor";
  const isReporter = user.role === "reporter";
  const isReader = user.role === "reader";

  let roleLabel = "USER";

  if (isSuperAdmin) {
    roleLabel = "SUPER ADMIN";
  } else if (isEditor) {
    roleLabel = "EDITOR";
  } else if (isReporter) {
    roleLabel = "REPORTER";
  } else if (isReader) {
    roleLabel = "READER";
  }

  return (
    <>
      <main className="account-page">
        <div className="account-container">

          {/* Breadcrumb */}
          <div className="account-breadcrumb">
            <Link href="/">Home</Link>
            <span>›</span>
            <span>My Account</span>
          </div>

          {/* Header */}
          <div className="account-heading">
            <div>
              <span className="account-kicker">
                {roleLabel}
              </span>

              <h1>My Account</h1>

              <p>
                Manage your profile and access the services
                available to your account.
              </p>
            </div>

            <Link
              href="/"
              className="account-home-button"
            >
              ← Back to Home
            </Link>
          </div>

          {/* Profile */}
          <section className="account-profile-card">

            <div className="account-profile-top">

              <div className="account-avatar">
                {isSuperAdmin ? "★" : firstLetter}
              </div>

              <div className="account-profile-info">

                <span className="account-role">
                  {roleLabel}
                </span>

                <h2>{user.fullName}</h2>

                <p>{user.email}</p>

              </div>

            </div>

            <div className="account-details">

              <div className="account-detail">
                <span className="account-detail-label">
                  Full Name
                </span>

                <strong>
                  {user.fullName}
                </strong>
              </div>

              <div className="account-detail">
                <span className="account-detail-label">
                  Email
                </span>

                <strong>
                  {user.email}
                </strong>
              </div>

              <div className="account-detail">
                <span className="account-detail-label">
                  Mobile Number
                </span>

                <strong>
                  {user.mobile || "Not provided"}
                </strong>
              </div>

              <div className="account-detail">
                <span className="account-detail-label">
                  Account Type
                </span>

                <strong>
                  {roleLabel}
                </strong>
              </div>

            </div>

          </section>

          {/* Services */}
          <section className="account-section">

            <div className="account-section-title">

              <span>
                ACCOUNT SERVICES
              </span>

              <h2>
                Available Options
              </h2>

            </div>

            <div className="account-services-grid">

              {/* SUPER ADMIN */}
              {isSuperAdmin && (
                <>
                  <Link
                    href="/admin"
                    className="account-service-card"
                  >
                    <div className="account-service-icon">
                      ⚙️
                    </div>

                    <div className="account-service-content">

                      <h3>
                        Admin Dashboard
                      </h3>

                      <p>
                        Manage news, users, reporters,
                        categories, districts, media and
                        website settings.
                      </p>

                      <span className="account-service-link">
                        Open Admin Dashboard →
                      </span>

                    </div>
                  </Link>

                  <Link
                    href="/epaper"
                    className="account-service-card"
                  >
                    <div className="account-service-icon">
                      📰
                    </div>

                    <div className="account-service-content">

                      <h3>
                        E-Paper
                      </h3>

                      <p>
                        Access the E-Paper area and manage
                        your available subscription.
                      </p>

                      <span className="account-service-link">
                        Open E-Paper →
                      </span>

                    </div>
                  </Link>
                </>
              )}

              {/* EDITOR */}
              {isEditor && (
                <>
                  <Link
                    href="/admin/review"
                    className="account-service-card"
                  >
                    <div className="account-service-icon">
                      ✓
                    </div>

                    <div className="account-service-content">

                      <h3>
                        Editorial Review
                      </h3>

                      <p>
                        Review submitted reporter articles
                        and manage editorial verification.
                      </p>

                      <span className="account-service-link">
                        Open Review →
                      </span>

                    </div>
                  </Link>

                  <Link
                    href="/admin"
                    className="account-service-card"
                  >
                    <div className="account-service-icon">
                      ⚙️
                    </div>

                    <div className="account-service-content">

                      <h3>
                        Admin Area
                      </h3>

                      <p>
                        Access the administration area
                        available to your role.
                      </p>

                      <span className="account-service-link">
                        Open Admin →
                      </span>

                    </div>
                  </Link>
                </>
              )}

              {/* REPORTER */}
              {isReporter && (
                <>
                  <Link
                    href="/reporter"
                    className="account-service-card"
                  >
                    <div className="account-service-icon">
                      ✍️
                    </div>

                    <div className="account-service-content">

                      <h3>
                        Reporter Dashboard
                      </h3>

                      <p>
                        Create news, manage drafts and
                        submit stories for verification.
                      </p>

                      <span className="account-service-link">
                        Open Reporter Dashboard →
                      </span>

                    </div>
                  </Link>

                  <Link
                    href="/epaper"
                    className="account-service-card"
                  >
                    <div className="account-service-icon">
                      📰
                    </div>

                    <div className="account-service-content">

                      <h3>
                        E-Paper
                      </h3>

                      <p>
                        View your E-Paper subscription
                        and available editions.
                      </p>

                      <span className="account-service-link">
                        Open E-Paper →
                      </span>

                    </div>
                  </Link>
                </>
              )}

              {/* READER */}
              {isReader && (
                <>
                  <Link
                    href="/epaper"
                    className="account-service-card"
                  >
                    <div className="account-service-icon">
                      📰
                    </div>

                    <div className="account-service-content">

                      <h3>
                        E-Paper
                      </h3>

                      <p>
                        View your E-Paper subscription
                        and available editions.
                      </p>

                      <span className="account-service-link">
                        Open E-Paper →
                      </span>

                    </div>
                  </Link>

                  <Link
                    href="/reporter/apply"
                    className="account-service-card"
                  >
                    <div className="account-service-icon">
                      ✍️
                    </div>

                    <div className="account-service-content">

                      <h3>
                        Become a Reporter
                      </h3>

                      <p>
                        Apply to become an authorized
                        எங்கள் தேசம் reporter.
                      </p>

                      <span className="account-service-link">
                        Apply Now →
                      </span>

                    </div>
                  </Link>
                </>
              )}

              {/* SECURITY */}
              <div className="account-service-card account-service-disabled">

                <div className="account-service-icon">
                  🔐
                </div>

                <div className="account-service-content">

                  <h3>
                    Account Security
                  </h3>

                  <p>
                    Password and security settings will
                    be available here.
                  </p>

                  <span className="account-coming-soon">
                    Coming Soon
                  </span>

                </div>

              </div>

            </div>

          </section>

          {/* Logout */}
          <section className="account-logout-section">

            <div>
              <h3>
                Sign out of your account
              </h3>

              <p>
                You can safely sign out from your
                எங்கள் தேசம் account.
              </p>
            </div>

            <button
              type="button"
              className="account-logout-button"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut
                ? "Logging out..."
                : "↪ Logout"}
            </button>

          </section>

        </div>
      </main>

      <style jsx>{`
        .account-page {
          min-height: calc(100vh - 150px);
          background: #fbfaf7;
          padding: 40px 20px 80px;
        }

        .account-container {
          width: min(1180px, 100%);
          margin: 0 auto;
        }

        .account-breadcrumb {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 28px;
          color: #777;
          font-size: 14px;
        }

        .account-breadcrumb a {
          color: #176b73;
          text-decoration: none;
          font-weight: 600;
        }

        .account-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 30px;
        }

        .account-kicker {
          display: inline-block;
          margin-bottom: 8px;
          color: #176b73;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1.4px;
        }

        .account-heading h1 {
          margin: 0;
          color: #18212b;
          font-size: clamp(30px, 5vw, 48px);
          line-height: 1.1;
        }

        .account-heading p {
          margin: 10px 0 0;
          color: #6c7378;
          font-size: 16px;
        }

        .account-home-button {
          flex-shrink: 0;
          padding: 11px 18px;
          border: 1px solid #d9d7d0;
          border-radius: 8px;
          background: #fff;
          color: #18212b;
          text-decoration: none;
          font-weight: 700;
        }

        .account-home-button:hover {
          border-color: #176b73;
          color: #176b73;
        }

        .account-profile-card {
          overflow: hidden;
          border: 1px solid #d9d7d0;
          border-radius: 16px;
          background: #fff;
          box-shadow: 0 8px 30px rgba(24, 33, 43, 0.06);
        }

        .account-profile-top {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 30px;
          border-bottom: 1px solid #e7e5df;
          background: #f3f7f6;
        }

        .account-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 76px;
          height: 76px;
          flex-shrink: 0;
          border-radius: 50%;
          background: #176b73;
          color: #fff;
          font-size: 30px;
          font-weight: 800;
        }

        .account-profile-info {
          min-width: 0;
        }

        .account-role {
          display: inline-block;
          margin-bottom: 5px;
          color: #176b73;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.2px;
        }

        .account-profile-info h2 {
          margin: 0;
          color: #18212b;
          font-size: 25px;
        }

        .account-profile-info p {
          margin: 5px 0 0;
          color: #6c7378;
          word-break: break-word;
        }

        .account-details {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
        }

        .account-detail {
          padding: 22px 25px;
          border-right: 1px solid #e7e5df;
        }

        .account-detail:last-child {
          border-right: 0;
        }

        .account-detail-label {
          display: block;
          margin-bottom: 7px;
          color: #8a8f92;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .account-detail strong {
          display: block;
          color: #18212b;
          font-size: 15px;
          overflow-wrap: anywhere;
        }

        .account-section {
          margin-top: 45px;
        }

        .account-section-title {
          margin-bottom: 18px;
        }

        .account-section-title > span {
          color: #176b73;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.2px;
        }

        .account-section-title h2 {
          margin: 5px 0 0;
          color: #18212b;
          font-size: 26px;
        }

        .account-services-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }

        .account-service-card {
          display: flex;
          gap: 16px;
          min-height: 175px;
          padding: 24px;
          border: 1px solid #d9d7d0;
          border-radius: 14px;
          background: #fff;
          color: inherit;
          text-decoration: none;
          box-shadow: 0 5px 20px rgba(24, 33, 43, 0.04);
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease,
            border-color 0.2s ease;
        }

        .account-service-card:not(.account-service-disabled):hover {
          transform: translateY(-3px);
          border-color: #176b73;
          box-shadow: 0 10px 28px rgba(24, 33, 43, 0.08);
        }

        .account-service-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          flex-shrink: 0;
          border-radius: 12px;
          background: #eef3f2;
          font-size: 23px;
        }

        .account-service-content h3 {
          margin: 1px 0 8px;
          color: #18212b;
          font-size: 18px;
        }

        .account-service-content p {
          margin: 0;
          color: #73797d;
          font-size: 14px;
          line-height: 1.55;
        }

        .account-service-link {
          display: inline-block;
          margin-top: 15px;
          color: #176b73;
          font-size: 13px;
          font-weight: 800;
        }

        .account-coming-soon {
          display: inline-block;
          margin-top: 15px;
          color: #999;
          font-size: 12px;
          font-weight: 700;
        }

        .account-service-disabled {
          opacity: 0.78;
        }

        .account-logout-section {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-top: 40px;
          padding: 22px 25px;
          border: 1px solid #e2dfd8;
          border-radius: 14px;
          background: #fff;
        }

        .account-logout-section h3 {
          margin: 0 0 5px;
          color: #18212b;
          font-size: 17px;
        }

        .account-logout-section p {
          margin: 0;
          color: #777;
          font-size: 14px;
        }

        .account-logout-button {
          flex-shrink: 0;
          padding: 11px 20px;
          border: 1px solid #b94b43;
          border-radius: 8px;
          background: #fff;
          color: #b94b43;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
        }

        .account-logout-button:hover:not(:disabled) {
          background: #b94b43;
          color: #fff;
        }

        .account-logout-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 900px) {
          .account-details {
            grid-template-columns: repeat(2, 1fr);
          }

          .account-detail:nth-child(2) {
            border-right: 0;
          }

          .account-detail:nth-child(-n + 2) {
            border-bottom: 1px solid #e7e5df;
          }

          .account-services-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .account-page {
            padding: 25px 14px 60px;
          }

          .account-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .account-home-button {
            width: 100%;
            text-align: center;
          }

          .account-profile-top {
            padding: 22px;
          }

          .account-avatar {
            width: 62px;
            height: 62px;
            font-size: 24px;
          }

          .account-profile-info h2 {
            font-size: 21px;
          }

          .account-details {
            grid-template-columns: 1fr;
          }

          .account-detail {
            border-right: 0 !important;
            border-bottom: 1px solid #e7e5df;
          }

          .account-detail:last-child {
            border-bottom: 0;
          }

          .account-service-card {
            padding: 20px;
          }

          .account-logout-section {
            align-items: stretch;
            flex-direction: column;
          }

          .account-logout-button {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}