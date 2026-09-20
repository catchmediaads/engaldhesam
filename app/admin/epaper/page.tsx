"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";

type EpaperEdition = {
  id: string;
  edition_date: string;
  title: string;
  description: string | null;
  edition_type: string;
  status: string;
  published_at: string | null;
  scheduled_at: string | null;
  created_at: string;
};

export default function EpaperAdminPage() {
  const supabase = createClient();

  const [editions, setEditions] = useState<EpaperEdition[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadEpaper();
  }, []);

  async function loadEpaper() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data: role, error: roleError } = await supabase.rpc(
        "get_my_role"
      );

      if (roleError) {
        throw roleError;
      }

      if (role !== "super_admin") {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      setAuthorized(true);

      const { data, error: editionError } = await supabase
        .from("e_paper_editions")
        .select(
          `
            id,
            edition_date,
            title,
            description,
            edition_type,
            status,
            published_at,
            scheduled_at,
            created_at
          `
        )
        .order("edition_date", { ascending: false });

      if (editionError) {
        throw editionError;
      }

      setEditions(data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Unable to load E-Paper data.");
    } finally {
      setLoading(false);
    }
  }

  const publishedCount = editions.filter(
    (item) => item.status === "published"
  ).length;

  const draftCount = editions.filter(
    (item) => item.status === "draft"
  ).length;

  const scheduledCount = editions.filter(
    (item) => item.status === "scheduled"
  ).length;

  const archivedCount = editions.filter(
    (item) => item.status === "archived"
  ).length;

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function statusLabel(status: string) {
    switch (status) {
      case "published":
        return "Published";
      case "draft":
        return "Draft";
      case "scheduled":
        return "Scheduled";
      case "archived":
        return "Archived";
      default:
        return status;
    }
  }

  if (loading) {
    return (
      <main className="epaper-admin-page">
        <div className="epaper-admin-container">
          <div className="loading-box">Loading E-Paper...</div>
        </div>

        <style jsx>{styles}</style>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="epaper-admin-page">
        <div className="epaper-admin-container">
          <div className="access-box">
            <div className="access-icon">🔒</div>
            <h1>Access Denied</h1>
            <p>
              E-Paper management is available only to Super Admin users.
            </p>

            <Link href="/admin" className="back-button">
              Back to Admin
            </Link>
          </div>
        </div>

        <style jsx>{styles}</style>
      </main>
    );
  }

  return (
    <main className="epaper-admin-page">
      <div className="epaper-admin-container">

        {/* Header */}
        <div className="page-header">
          <div>
            <div className="breadcrumb">
              Admin / E-Paper
            </div>

            <h1>E-Paper Management</h1>

            <p>
              Upload, manage and publish digital newspaper editions.
            </p>
          </div>

          <Link href="/admin/epaper/new" className="primary-button">
            + Upload New Edition
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        {/* Statistics */}
        <section className="stats-grid">

          <div className="stat-card">
            <div className="stat-icon">📰</div>
            <div>
              <div className="stat-number">
                {editions.length}
              </div>
              <div className="stat-label">
                Total Editions
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div>
              <div className="stat-number">
                {publishedCount}
              </div>
              <div className="stat-label">
                Published
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📝</div>
            <div>
              <div className="stat-number">
                {draftCount}
              </div>
              <div className="stat-label">
                Drafts
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⏰</div>
            <div>
              <div className="stat-number">
                {scheduledCount}
              </div>
              <div className="stat-label">
                Scheduled
              </div>
            </div>
          </div>

        </section>

        {/* Editions */}
        <section className="content-card">

          <div className="section-header">
            <div>
              <h2>E-Paper Editions</h2>
              <p>
                Manage all newspaper editions from one place.
              </p>
            </div>

            <button
              type="button"
              onClick={loadEpaper}
              className="refresh-button"
            >
              ↻ Refresh
            </button>
          </div>

          {editions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📰</div>

              <h3>No E-Paper editions yet</h3>

              <p>
                Upload your first newspaper edition to get started.
              </p>

              <Link
                href="/admin/epaper/new"
                className="primary-button"
              >
                + Upload First Edition
              </Link>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>

                <thead>
                  <tr>
                    <th>Edition Date</th>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {editions.map((edition) => (
                    <tr key={edition.id}>

                      <td>
                        <strong>
                          {formatDate(edition.edition_date)}
                        </strong>
                      </td>

                      <td>
                        <div className="edition-title">
                          {edition.title}
                        </div>

                        {edition.description && (
                          <div className="edition-description">
                            {edition.description}
                          </div>
                        )}
                      </td>

                      <td>
                        <span className="type-badge">
                          {edition.edition_type}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`status-badge status-${edition.status}`}
                        >
                          {statusLabel(edition.status)}
                        </span>
                      </td>

                      <td>
                        {formatDate(edition.created_at)}
                      </td>

                      <td>
                        <div className="actions">

                          <Link
                            href={`/admin/epaper/${edition.id}`}
                            className="action-button"
                          >
                            View
                          </Link>

                          <Link
                            href={`/admin/epaper/${edition.id}/edit`}
                            className="action-button"
                          >
                            Edit
                          </Link>

                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}

        </section>

        {/* Archived summary */}
        {archivedCount > 0 && (
          <div className="archive-note">
            📦 {archivedCount} archived edition
            {archivedCount !== 1 ? "s" : ""} available.
          </div>
        )}

      </div>

      <style jsx>{styles}</style>
    </main>
  );
}

const styles = `
  .epaper-admin-page {
    min-height: 100vh;
    background: #f5f6f7;
    padding: 35px 20px 70px;
  }

  .epaper-admin-container {
    max-width: 1280px;
    margin: 0 auto;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 25px;
    margin-bottom: 30px;
  }

  .breadcrumb {
    color: #176b73;
    font-size: 13px;
    font-weight: 700;
    margin-bottom: 8px;
  }

  .page-header h1 {
    margin: 0;
    color: #18212b;
    font-size: 32px;
    font-weight: 800;
  }

  .page-header p {
    margin: 8px 0 0;
    color: #66727d;
    font-size: 15px;
  }

  .primary-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #176b73;
    color: white;
    text-decoration: none;
    border: none;
    border-radius: 8px;
    padding: 12px 18px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
  }

  .primary-button:hover {
    opacity: 0.9;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 18px;
    margin-bottom: 25px;
  }

  .stat-card {
    background: white;
    border: 1px solid #e1e3e5;
    border-radius: 10px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .stat-icon {
    width: 45px;
    height: 45px;
    border-radius: 9px;
    background: #eef3f2;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 21px;
  }

  .stat-number {
    color: #18212b;
    font-size: 25px;
    font-weight: 800;
    line-height: 1;
  }

  .stat-label {
    color: #77818a;
    font-size: 13px;
    margin-top: 5px;
  }

  .content-card {
    background: white;
    border: 1px solid #e1e3e5;
    border-radius: 10px;
    overflow: hidden;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 15px;
    padding: 22px 24px;
    border-bottom: 1px solid #e5e7e9;
  }

  .section-header h2 {
    margin: 0;
    color: #18212b;
    font-size: 20px;
  }

  .section-header p {
    margin: 5px 0 0;
    color: #77818a;
    font-size: 13px;
  }

  .refresh-button {
    background: white;
    border: 1px solid #d5d9dc;
    color: #39434c;
    border-radius: 7px;
    padding: 9px 13px;
    cursor: pointer;
    font-weight: 600;
  }

  .table-wrapper {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th {
    background: #f8f9fa;
    color: #5e6871;
    font-size: 12px;
    font-weight: 700;
    text-align: left;
    padding: 13px 18px;
    border-bottom: 1px solid #e1e3e5;
    white-space: nowrap;
  }

  td {
    padding: 16px 18px;
    border-bottom: 1px solid #edf0f1;
    color: #39434c;
    font-size: 13px;
    vertical-align: middle;
  }

  tr:last-child td {
    border-bottom: none;
  }

  .edition-title {
    color: #18212b;
    font-weight: 700;
  }

  .edition-description {
    color: #7b858d;
    font-size: 12px;
    margin-top: 4px;
    max-width: 350px;
  }

  .type-badge {
    display: inline-block;
    background: #f1f3f4;
    color: #4e5962;
    border-radius: 20px;
    padding: 5px 9px;
    font-size: 11px;
    font-weight: 700;
    text-transform: capitalize;
  }

  .status-badge {
    display: inline-block;
    border-radius: 20px;
    padding: 5px 10px;
    font-size: 11px;
    font-weight: 700;
  }

  .status-published {
    background: #e7f4ed;
    color: #197044;
  }

  .status-draft {
    background: #f0f1f2;
    color: #5c6670;
  }

  .status-scheduled {
    background: #fff3dc;
    color: #946500;
  }

  .status-archived {
    background: #eeeef1;
    color: #656875;
  }

  .actions {
    display: flex;
    gap: 7px;
  }

  .action-button {
    display: inline-block;
    text-decoration: none;
    color: #176b73;
    border: 1px solid #cbdcdd;
    background: #f8fbfb;
    border-radius: 6px;
    padding: 7px 10px;
    font-size: 12px;
    font-weight: 700;
  }

  .action-button:hover {
    background: #eef5f5;
  }

  .empty-state {
    text-align: center;
    padding: 65px 20px;
  }

  .empty-icon {
    font-size: 45px;
    margin-bottom: 12px;
  }

  .empty-state h3 {
    margin: 0;
    color: #18212b;
    font-size: 19px;
  }

  .empty-state p {
    color: #77818a;
    font-size: 14px;
    margin: 8px 0 20px;
  }

  .access-box {
    max-width: 500px;
    margin: 100px auto;
    background: white;
    border: 1px solid #e1e3e5;
    border-radius: 12px;
    padding: 45px 30px;
    text-align: center;
  }

  .access-icon {
    font-size: 45px;
    margin-bottom: 10px;
  }

  .access-box h1 {
    margin: 0;
    color: #18212b;
  }

  .access-box p {
    color: #6d7780;
    margin: 10px 0 22px;
  }

  .back-button {
    display: inline-block;
    text-decoration: none;
    color: white;
    background: #18212b;
    padding: 10px 18px;
    border-radius: 7px;
    font-weight: 700;
    font-size: 13px;
  }

  .loading-box {
    background: white;
    border: 1px solid #e1e3e5;
    border-radius: 10px;
    padding: 50px;
    text-align: center;
    color: #66727d;
  }

  .error-box {
    background: #fff0f0;
    border: 1px solid #f0caca;
    color: #a32929;
    border-radius: 8px;
    padding: 13px 16px;
    margin-bottom: 20px;
    font-size: 14px;
  }

  .archive-note {
    margin-top: 15px;
    color: #68737c;
    font-size: 13px;
  }

  @media (max-width: 900px) {
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .page-header {
      align-items: flex-start;
      flex-direction: column;
    }
  }

  @media (max-width: 600px) {
    .epaper-admin-page {
      padding: 22px 12px 50px;
    }

    .stats-grid {
      grid-template-columns: 1fr;
    }

    .page-header h1 {
      font-size: 27px;
    }

    .section-header {
      align-items: flex-start;
      flex-direction: column;
    }

    .primary-button {
      width: 100%;
    }
  }
`;