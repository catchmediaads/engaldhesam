"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { createClient } from "../../../lib/supabase-browser";

type MediaFile = {
  name: string;
  id: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const BUCKET = "news-media";

export default function MediaLibraryPage() {
  const supabase = createClient();

  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadMedia();
  }, []);

  async function loadMedia() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list("", {
        limit: 100,
        offset: 0,
        sortBy: {
          column: "created_at",
          order: "desc",
        },
      });

    if (error) {
      setMessage(
        `Media load error: ${error.message}`
      );
      setLoading(false);
      return;
    }

    setFiles(data ?? []);
    setLoading(false);
  }

  async function handleUpload(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploading(true);
    setMessage("");

    if (!file.type.startsWith("image/")) {
      setMessage("Please select an image file.");
      setUploading(false);
      event.target.value = "";
      return;
    }

    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      setMessage(
        "Image size must be less than 10 MB."
      );
      setUploading(false);
      event.target.value = "";
      return;
    }

    const extension =
      file.name.split(".").pop()?.toLowerCase() || "jpg";

    const safeName = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .toLowerCase();

    const uniqueName =
      `${Date.now()}-${safeName}.${extension}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(uniqueName, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      setMessage(
        `Upload error: ${error.message}`
      );
      setUploading(false);
      event.target.value = "";
      return;
    }

    setMessage("Image uploaded successfully. ✅");

    await loadMedia();

    setUploading(false);
    event.target.value = "";
  }

  function getPublicUrl(fileName: string) {
    const { data } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(fileName);

    return data.publicUrl;
  }

  async function copyUrl(fileName: string) {
    const url = getPublicUrl(fileName);

    try {
      await navigator.clipboard.writeText(url);
      setMessage("Public URL copied. ✅");
    } catch {
      setMessage(
        "Unable to copy URL automatically."
      );
    }
  }

  async function deleteFile(fileName: string) {
    const confirmed = window.confirm(
      `Delete "${fileName}"?`
    );

    if (!confirmed) {
      return;
    }

    const { error } = await supabase.storage
      .from(BUCKET)
      .remove([fileName]);

    if (error) {
      setMessage(
        `Delete error: ${error.message}`
      );
      return;
    }

    setFiles((current) =>
      current.filter(
        (file) => file.name !== fileName
      )
    );

    setMessage("Media deleted successfully.");
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

          <a
            href="/admin/media"
            className="active"
          >
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

      {/* MAIN */}

      <section className="admin-main">

        <header className="admin-topbar">

          <div>
            <h1>
              Media Library
            </h1>

            <p>
              Manage images and media used by the newspaper
            </p>
          </div>

          <label
            className="admin-primary-button"
            style={{
              cursor: uploading
                ? "not-allowed"
                : "pointer",
            }}
          >

            {uploading
              ? "Uploading..."
              : "+ Upload Image"}

            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              disabled={uploading}
              style={{
                display: "none",
              }}
            />

          </label>

        </header>

        <div className="admin-content">

          {/* MESSAGE */}

          {message && (
            <div
              style={{
                padding: "13px 16px",
                marginBottom: "20px",
                background: "#eef3f2",
                border: "1px solid #d9d7d0",
                borderRadius: "8px",
              }}
            >
              {message}
            </div>
          )}

          {/* UPLOAD AREA */}

          <section className="admin-section">

            <div className="admin-section-title">

              <div>
                <h2>
                  Upload Media
                </h2>

                <p>
                  JPG, PNG, WEBP and other image formats.
                  Maximum 10 MB.
                </p>
              </div>

            </div>

            <label
              style={{
                display: "block",
                padding: "45px 20px",
                border: "2px dashed #d9d7d0",
                borderRadius: "12px",
                textAlign: "center",
                cursor: uploading
                  ? "not-allowed"
                  : "pointer",
                background: "#fbfaf7",
              }}
            >

              <div
                style={{
                  fontSize: "42px",
                  marginBottom: "10px",
                }}
              >
                📷
              </div>

              <strong>
                {uploading
                  ? "Uploading image..."
                  : "Click to upload an image"}
              </strong>

              <p
                style={{
                  marginTop: "8px",
                  color: "#66717b",
                  fontSize: "13px",
                }}
              >
                Images up to 10 MB
              </p>

              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                disabled={uploading}
                style={{
                  display: "none",
                }}
              />

            </label>

          </section>

          {/* MEDIA GRID */}

          <section className="admin-section">

            <div className="admin-section-title">

              <div>
                <h2>
                  Media Files
                </h2>

                <p>
                  {files.length} files
                </p>
              </div>

            </div>

            {loading ? (

              <div
                style={{
                  padding: "50px",
                  textAlign: "center",
                }}
              >
                Loading media...
              </div>

            ) : files.length === 0 ? (

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
                  🖼️
                </div>

                <h3>
                  No Media Files
                </h3>

                <p>
                  Upload your first image to the Media Library.
                </p>

              </div>

            ) : (

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fill, minmax(220px, 1fr))",
                  gap: "20px",
                }}
              >

                {files.map((file) => {

                  const publicUrl =
                    getPublicUrl(file.name);

                  return (
                    <div
                      key={file.name}
                      style={{
                        background: "#fff",
                        border: "1px solid #d9d7d0",
                        borderRadius: "10px",
                        overflow: "hidden",
                      }}
                    >

                      <div
                        style={{
                          aspectRatio: "16 / 10",
                          background: "#f1f1ed",
                        }}
                      >

                        <img
                          src={publicUrl}
                          alt={file.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />

                      </div>

                      <div
                        style={{
                          padding: "14px",
                        }}
                      >

                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            marginBottom: "12px",
                          }}
                          title={file.name}
                        >
                          {file.name}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            gap: "7px",
                            flexWrap: "wrap",
                          }}
                        >

                          <button
                            type="button"
                            className="admin-small-button"
                            onClick={() =>
                              copyUrl(file.name)
                            }
                          >
                            Copy URL
                          </button>

                          <button
                            type="button"
                            className="admin-small-button"
                            onClick={() =>
                              deleteFile(file.name)
                            }
                          >
                            Delete
                          </button>

                        </div>

                      </div>

                    </div>
                  );
                })}

              </div>

            )}

          </section>

        </div>

      </section>

    </main>
  );
}