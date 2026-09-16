"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../../lib/supabase-browser";

type Article = {
  id: string;
  title: string;
  status: string;
  article_type: string;
  created_at: string;
  updated_at: string;
};

export default function NewsManagementPage() {
  const supabase = createClient();

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadNews();
  }, []);

  async function loadNews() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data, error } = await supabase
      .from("articles")
      .select(
        "id, title, status, article_type, created_at, updated_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(
        `News load error: ${error.message || "Unable to load news."}`
      );
      setLoading(false);
      return;
    }

    setArticles(data ?? []);
    setLoading(false);
  }

  async function deleteNews(id: string) {
    const confirmed = window.confirm(
      "இந்த செய்தியை Delete செய்ய வேண்டுமா?"
    );

    if (!confirmed) {
      return;
    }

    const { error } = await supabase
      .from("articles")
      .delete()
      .eq("id", id);

    if (error) {
      setMessage(
        `Delete error: ${error.message || "Unable to delete news."}`
      );
      return;
    }

    setArticles((current) =>
      current.filter((article) => article.id !== id)
    );

    setMessage("News deleted successfully.");
  }

  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      article.title
        ?.toLowerCase()
        .includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      article.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  function statusLabel(status: string) {
    switch (status) {
      case "draft":
        return "Draft";

      case "submitted":
        return "Submitted";

      case "changes_requested":
        return "Changes Requested";

      case "verified":
        return "Verified";

      case "published":
        return "Published";

      case "archived":
        return "Archived";

      case "rejected":
        return "Rejected";

      default:
        return status;
    }
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

          <a href="/admin">
            <span>▣</span>
            Dashboard
          </a>

          <a
            href="/admin/news"
            className="active"
          >
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
            Users &amp; Roles
          </a>

          <a href="/admin/settings">
            <span>⚙</span>
            Settings
          </a>

        </nav>

        <div className="admin-sidebar-bottom">

          <a
            href="/"
            target="_blank"
            rel="noreferrer"
          >
            ↗ View Website
          </a>

          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/login";
            }}
          >
            ⇥ Logout
          </button>

        </div>

      </aside>

      {/* MAIN CONTENT */}

      <section className="admin-main">

        <header className="admin-topbar">

          <div>

            <h1>
              News Management
            </h1>

            <p>
              Create, manage and publish newsroom content
            </p>

          </div>

          <a
            href="/admin/news/new"
            className="admin-primary-button"
          >
            + Create News
          </a>

        </header>

        <div className="admin-content">

          <section className="admin-section">

            <div className="admin-section-title">

              <div>

                <h2>
                  All News
                </h2>

                <p>
                  {articles.length} total articles
                </p>

              </div>

            </div>

            {/* SEARCH + FILTER */}

            <div
              style={{
                display: "flex",
                gap: "12px",
                marginBottom: "20px",
                flexWrap: "wrap",
              }}
            >

              <input
                type="text"
                placeholder="🔎 Search news..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                style={{
                  flex: 1,
                  minWidth: "240px",
                  padding: "12px 14px",
                  border: "1px solid #d9d7d0",
                  borderRadius: "8px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                style={{
                  padding: "12px 14px",
                  border: "1px solid #d9d7d0",
                  borderRadius: "8px",
                  background: "#fff",
                  fontSize: "14px",
                }}
              >

                <option value="all">
                  All Status
                </option>

                <option value="draft">
                  Draft
                </option>

                <option value="submitted">
                  Submitted
                </option>

                <option value="changes_requested">
                  Changes Requested
                </option>

                <option value="verified">
                  Verified
                </option>

                <option value="published">
                  Published
                </option>

                <option value="archived">
                  Archived
                </option>

                <option value="rejected">
                  Rejected
                </option>

              </select>

            </div>

            {/* ERROR / SUCCESS MESSAGE */}

            {message && (
              <div
                style={{
                  padding: "12px 14px",
                  background: "#eef3f2",
                  border: "1px solid #d9d7d0",
                  borderRadius: "8px",
                  marginBottom: "16px",
                }}
              >
                {message}
              </div>
            )}

            {/* NEWS LIST */}

            {loading ? (

              <div
                style={{
                  padding: "50px",
                  textAlign: "center",
                }}
              >
                Loading news...
              </div>

            ) : filteredArticles.length === 0 ? (

              <div
                style={{
                  padding: "60px 20px",
                  textAlign: "center",
                  border: "1px solid #d9d7d0",
                  borderRadius: "10px",
                  background: "#fff",
                }}
              >

                <div
                  style={{
                    fontSize: "42px",
                    marginBottom: "10px",
                  }}
                >
                  📰
                </div>

                <h3>
                  No News Found
                </h3>

                <p>
                  {articles.length === 0
                    ? "Create your first news article."
                    : "No news matches your search or filter."}
                </p>

                <a
                  href="/admin/news/new"
                  className="admin-primary-button"
                  style={{
                    display: "inline-block",
                    marginTop: "15px",
                  }}
                >
                  + Create News
                </a>

              </div>

            ) : (

              <div
                style={{
                  overflowX: "auto",
                  background: "#fff",
                  border: "1px solid #d9d7d0",
                  borderRadius: "10px",
                }}
              >

                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    minWidth: "850px",
                  }}
                >

                  <thead>

                    <tr
                      style={{
                        background: "#f5f5f2",
                        textAlign: "left",
                      }}
                    >

                      <th style={thStyle}>
                        News
                      </th>

                      <th style={thStyle}>
                        Type
                      </th>

                      <th style={thStyle}>
                        Status
                      </th>

                      <th style={thStyle}>
                        Created
                      </th>

                      <th style={thStyle}>
                        Actions
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {filteredArticles.map(
                      (article) => (

                        <tr key={article.id}>

                          <td style={tdStyle}>

                            <strong>
                              {article.title ||
                                "Untitled News"}
                            </strong>

                          </td>

                          <td style={tdStyle}>
                            {article.article_type}
                          </td>

                          <td style={tdStyle}>

                            <span
                              style={{
                                display: "inline-block",
                                padding: "5px 10px",
                                borderRadius: "20px",
                                background: "#eef3f2",
                                color: "#18212b",
                                fontSize: "12px",
                                fontWeight: 600,
                              }}
                            >
                              {statusLabel(
                                article.status
                              )}
                            </span>

                          </td>

                          <td style={tdStyle}>

                            {new Date(
                              article.created_at
                            ).toLocaleDateString(
                              "en-IN"
                            )}

                          </td>

                          <td style={tdStyle}>

                            <div
                              style={{
                                display: "flex",
                                gap: "8px",
                                flexWrap: "wrap",
                              }}
                            >

                              <a
                                href={`/admin/news/${article.id}`}
                                className="admin-small-button"
                              >
                                View
                              </a>

                              <a
                                href={`/admin/news/${article.id}/edit`}
                                className="admin-small-button"
                              >
                                Edit
                              </a>

                              {article.status !==
                                "published" && (

                                <button
                                  type="button"
                                  onClick={() =>
                                    deleteNews(
                                      article.id
                                    )
                                  }
                                  className="admin-small-button"
                                >
                                  Delete
                                </button>

                              )}

                            </div>

                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </section>

        </div>

      </section>

    </main>
  );
}

const thStyle = {
  padding: "14px 16px",
  borderBottom: "1px solid #d9d7d0",
  fontSize: "13px",
  fontWeight: 700,
};

const tdStyle = {
  padding: "14px 16px",
  borderBottom: "1px solid #eceae4",
  fontSize: "14px",
};