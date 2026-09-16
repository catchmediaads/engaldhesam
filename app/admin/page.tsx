"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase-browser";

export default function AdminDashboard() {
  const supabase = createClient();

  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);

  const [totalNews, setTotalNews] = useState(0);
  const [pendingReview, setPendingReview] = useState(0);
  const [publishedNews, setPublishedNews] = useState(0);
  const [totalReporters, setTotalReporters] = useState(0);

  useEffect(() => {
    async function loadAdmin() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      setUserEmail(user.email ?? "");

      // Total News
      const { count: newsCount } = await supabase
        .from("articles")
        .select("*", {
          count: "exact",
          head: true,
        });

      // Pending Review
      const { count: pendingCount } = await supabase
        .from("articles")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("status", "submitted");

      // Published News
      const { count: publishedCount } = await supabase
        .from("articles")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("status", "published");

      // Total Reporters
      const { count: reporterCount } = await supabase
        .from("reporters")
        .select("*", {
          count: "exact",
          head: true,
        });

      setTotalNews(newsCount ?? 0);
      setPendingReview(pendingCount ?? 0);
      setPublishedNews(publishedCount ?? 0);
      setTotalReporters(reporterCount ?? 0);

      setLoading(false);
    }

    loadAdmin();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (loading) {
    return (
      <main className="admin-loading">
        <div>
          <strong>எங்கள் தேசம்</strong>
          <p>Loading Admin Panel...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-layout">

      {/* SIDEBAR */}
      <aside className="admin-sidebar">

        <div className="admin-brand">
          <div className="admin-brand-tamil">
            எங்கள் தேசம்
          </div>

          <div className="admin-brand-subtitle">
            ADMINISTRATION
          </div>
        </div>

        <nav className="admin-nav">

          <a href="/admin" className="active">
            <span>▣</span>
            Dashboard
          </a>

          <a href="/admin/news">
            <span>📰</span>
            News
          </a>

          <a href="/admin/review">
            <span>✓</span>
            News Review
          </a>

          <a href="/admin/reporters">
            <span>👤</span>
            Reporters
          </a>

          <a href="/admin/media">
            <span>▧</span>
            Media Library
          </a>

          <a href="/admin/comments">
            <span>💬</span>
            Comments
          </a>

          <a href="/admin/epaper">
            <span>▤</span>
            E-Paper
          </a>

          <a href="/admin/ads">
            <span>▰</span>
            Advertisements
          </a>

          <a href="/admin/languages">
            <span>文</span>
            Languages
          </a>

          <a href="/admin/categories">
            <span>☷</span>
            Categories
          </a>

          <a href="/admin/districts">
            <span>⌖</span>
            Districts
          </a>

          <a href="/admin/users">
            <span>♙</span>
            Users & Roles
          </a>

          <a href="/admin/settings">
            <span>⚙</span>
            Settings
          </a>

        </nav>

        <div className="admin-sidebar-bottom">

          <a href="/" target="_blank" rel="noreferrer">
            ↗ View Website
          </a>

          <button onClick={handleLogout}>
            ⇥ Logout
          </button>

        </div>

      </aside>

      {/* MAIN AREA */}
      <section className="admin-main">

        {/* TOPBAR */}
        <header className="admin-topbar">

          <div>
            <h1>Dashboard</h1>
            <p>
              எங்கள் தேசம் Newsroom Administration
            </p>
          </div>

          <div className="admin-user">

            <div className="admin-avatar">
              SA
            </div>

            <div>
              <strong>Super Admin</strong>
              <span>{userEmail}</span>
            </div>

          </div>

        </header>

        {/* CONTENT */}
        <div className="admin-content">

          {/* WELCOME */}
          <section className="admin-welcome">

            <div>

              <div className="admin-label">
                CONTROL CENTER
              </div>

              <h2>
                Welcome to Engal Dhesam
              </h2>

              <p>
                Manage news, reporters, media, advertisements,
                languages, E-Paper and newsroom settings from here.
              </p>

            </div>

            <a
              href="/admin/news/new"
              className="admin-primary-button"
            >
              + Create News
            </a>

          </section>

          {/* STATISTICS */}
          <section className="admin-stats">

            <div className="admin-stat-card">
              <span>📰</span>

              <div>
                <strong>{totalNews}</strong>
                <p>Total News</p>
              </div>
            </div>

            <div className="admin-stat-card">
              <span>⏳</span>

              <div>
                <strong>{pendingReview}</strong>
                <p>Pending Review</p>
              </div>
            </div>

            <div className="admin-stat-card">
              <span>✓</span>

              <div>
                <strong>{publishedNews}</strong>
                <p>Published</p>
              </div>
            </div>

            <div className="admin-stat-card">
              <span>👤</span>

              <div>
                <strong>{totalReporters}</strong>
                <p>Reporters</p>
              </div>
            </div>

          </section>

          {/* QUICK ACTIONS */}
          <section className="admin-section">

            <div className="admin-section-title">

              <div>
                <h2>Quick Actions</h2>
                <p>
                  Frequently used newsroom controls
                </p>
              </div>

            </div>

            <div className="admin-actions-grid">

              <a href="/admin/news/new">
                <strong>＋</strong>
                <span>Create News</span>
                <small>Create a new article</small>
              </a>

              <a href="/admin/review">
                <strong>✓</strong>
                <span>Review News</span>
                <small>Verify reporter submissions</small>
              </a>

              <a href="/admin/reporters">
                <strong>👤</strong>
                <span>Manage Reporters</span>
                <small>Create and manage Reporter IDs</small>
              </a>

              <a href="/admin/media">
                <strong>▧</strong>
                <span>Media Library</span>
                <small>Images and video files</small>
              </a>

              <a href="/admin/ads">
                <strong>▰</strong>
                <span>Advertisements</span>
                <small>Manage website advertising</small>
              </a>

              <a href="/admin/settings">
                <strong>⚙</strong>
                <span>Website Settings</span>
                <small>Configure the newspaper</small>
              </a>

            </div>

          </section>

          {/* WORKFLOW */}
          <section className="admin-section">

            <div className="admin-section-title">

              <div>
                <h2>News Workflow</h2>
                <p>
                  Current publishing process
                </p>
              </div>

            </div>

            <div className="workflow">

              <div>
                <span>1</span>
                <strong>Reporter</strong>
                <small>Create & Submit</small>
              </div>

              <div className="workflow-arrow">
                →
              </div>

              <div>
                <span>2</span>
                <strong>Editor</strong>
                <small>Review & Verify</small>
              </div>

              <div className="workflow-arrow">
                →
              </div>

              <div>
                <span>3</span>
                <strong>Super Admin</strong>
                <small>Publish</small>
              </div>

              <div className="workflow-arrow">
                →
              </div>

              <div>
                <span>4</span>
                <strong>Website</strong>
                <small>Published & Locked</small>
              </div>

            </div>

          </section>

        </div>

      </section>

    </main>
  );
}