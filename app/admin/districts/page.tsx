"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "../../../lib/supabase-browser";

type District = {
  id: string;
  name: string;
  slug: string;
  state_name: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

type DistrictForm = {
  name: string;
  slug: string;
  state_name: string;
  is_active: boolean;
  sort_order: string;
};

export default function DistrictsPage() {
  const supabase = createClient();

  const [districts, setDistricts] = useState<District[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<DistrictForm>({
    name: "",
    slug: "",
    state_name: "Tamil Nadu",
    is_active: true,
    sort_order: "0",
  });

  async function loadDistricts() {
    setIsLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("districts")
      .select(
        "id, name, slug, state_name, is_active, sort_order, created_at"
      )
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("District load error:", error);
      setMessage(`District load failed: ${error.message}`);
      setDistricts([]);
    } else {
      setDistricts(data ?? []);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    loadDistricts();
  }, []);

  function resetForm() {
    setForm({
      name: "",
      slug: "",
      state_name: "Tamil Nadu",
      is_active: true,
      sort_order: "0",
    });

    setEditingId(null);
  }

  function openCreateForm() {
    resetForm();
    setMessage("");
    setShowForm(true);
  }

  function openEditForm(district: District) {
    setEditingId(district.id);

    setForm({
      name: district.name,
      slug: district.slug,
      state_name: district.state_name,
      is_active: district.is_active,
      sort_order: String(district.sort_order),
    });

    setMessage("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    resetForm();
  }

  function createSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "")
      .replace(/-+/g, "-");
  }

  function handleNameChange(value: string) {
    setForm((current) => ({
      ...current,
      name: value,
      slug:
        editingId || current.slug
          ? current.slug
          : createSlug(value),
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");

    if (!form.name.trim()) {
      setMessage("Please enter a district name.");
      return;
    }

    if (!form.slug.trim()) {
      setMessage("Please enter a district slug.");
      return;
    }

    if (!form.state_name.trim()) {
      setMessage("Please enter the state name.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim().toLowerCase(),
        state_name: form.state_name.trim(),
        is_active: form.is_active,
        sort_order: Number(form.sort_order) || 0,
      };

      if (editingId) {
        const { error } = await supabase
          .from("districts")
          .update(payload)
          .eq("id", editingId);

        if (error) {
          throw new Error(
            `District update failed: ${error.message}`
          );
        }

        setMessage("District updated successfully.");
      } else {
        const { error } = await supabase
          .from("districts")
          .insert(payload);

        if (error) {
          throw new Error(
            `District creation failed: ${error.message}`
          );
        }

        setMessage("District created successfully.");
      }

      closeForm();
      await loadDistricts();
    } catch (error) {
      console.error("District save error:", error);

      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage(
          "Something went wrong. Please try again."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  async function toggleDistrict(district: District) {
    setMessage("");

    const { error } = await supabase
      .from("districts")
      .update({
        is_active: !district.is_active,
      })
      .eq("id", district.id);

    if (error) {
      console.error("District status error:", error);
      setMessage(
        `Status update failed: ${error.message}`
      );
      return;
    }

    await loadDistricts();
  }

  async function deleteDistrict(district: District) {
    const confirmed = window.confirm(
      `Delete "${district.name}"?\n\nIf this district is already used by news articles, deletion may fail.`
    );

    if (!confirmed) {
      return;
    }

    setMessage("");

    const { error } = await supabase
      .from("districts")
      .delete()
      .eq("id", district.id);

    if (error) {
      console.error("District delete error:", error);
      setMessage(
        `District could not be deleted: ${error.message}`
      );
      return;
    }

    setMessage("District deleted successfully.");
    await loadDistricts();
  }

  const filteredDistricts = districts.filter((district) => {
    const query = search.toLowerCase().trim();

    if (!query) {
      return true;
    }

    return (
      district.name.toLowerCase().includes(query) ||
      district.slug.toLowerCase().includes(query) ||
      district.state_name.toLowerCase().includes(query)
    );
  });

  return (
    <main className="admin-layout">
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

          <a
            href="/admin/districts"
            className="active"
          >
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

      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <h1>Districts</h1>

            <p>
              Manage districts used across the newspaper
            </p>
          </div>

          <div className="admin-user">
            <div className="admin-avatar">
              SA
            </div>

            <div>
              <strong>Super Admin</strong>
              <span>District Management</span>
            </div>
          </div>
        </header>

        <div className="admin-content">
          <section className="admin-section">
            <div className="admin-section-title">
              <div>
                <h2>District Management</h2>

                <p>
                  Create and manage districts available for news.
                </p>
              </div>

              <button
                type="button"
                className="admin-primary-button"
                onClick={openCreateForm}
              >
                + Create District
              </button>
            </div>

            {message && (
              <div
                style={{
                  marginBottom: "18px",
                  padding: "13px 15px",
                  borderRadius: "10px",
                  border: "1px solid var(--line)",
                  background: "var(--soft)",
                  color: "var(--ink)",
                  fontWeight: 600,
                }}
              >
                {message}
              </div>
            )}

            {showForm && (
              <div
                style={{
                  border: "1px solid var(--line)",
                  borderRadius: "12px",
                  padding: "22px",
                  marginBottom: "24px",
                  background: "var(--paper)",
                }}
              >
                <div
                  className="admin-section-title"
                  style={{ marginBottom: "18px" }}
                >
                  <div>
                    <h2>
                      {editingId
                        ? "Edit District"
                        : "Create District"}
                    </h2>

                    <p>
                      Configure the district information below.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="admin-form-grid">
                    <div className="admin-form-group">
                      <label htmlFor="districtName">
                        District Name *
                      </label>

                      <input
                        id="districtName"
                        type="text"
                        placeholder="Example: தூத்துக்குடி"
                        value={form.name}
                        onChange={(event) =>
                          handleNameChange(
                            event.target.value
                          )
                        }
                        required
                      />
                    </div>

                    <div className="admin-form-group">
                      <label htmlFor="districtSlug">
                        Slug *
                      </label>

                      <input
                        id="districtSlug"
                        type="text"
                        placeholder="Example: thoothukudi"
                        value={form.slug}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            slug: event.target.value
                              .toLowerCase()
                              .replace(/\s+/g, "-"),
                          }))
                        }
                        required
                      />
                    </div>

                    <div className="admin-form-group">
                      <label htmlFor="stateName">
                        State
                      </label>

                      <input
                        id="stateName"
                        type="text"
                        value={form.state_name}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            state_name:
                              event.target.value,
                          }))
                        }
                        required
                      />
                    </div>

                    <div className="admin-form-group">
                      <label htmlFor="sortOrder">
                        Display Order
                      </label>

                      <input
                        id="sortOrder"
                        type="number"
                        min="0"
                        value={form.sort_order}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            sort_order:
                              event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="admin-form-group admin-form-full">
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={form.is_active}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              is_active:
                                event.target.checked,
                            }))
                          }
                          style={{
                            width: "18px",
                            height: "18px",
                          }}
                        />

                        Active District
                      </label>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      marginTop: "20px",
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      type="submit"
                      className="admin-primary-button"
                      disabled={saving}
                    >
                      {saving
                        ? "Saving..."
                        : editingId
                        ? "Update District"
                        : "Save District"}
                    </button>

                    <button
                      type="button"
                      className="admin-secondary-button"
                      onClick={closeForm}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: "12px",
                marginBottom: "18px",
                flexWrap: "wrap",
              }}
            >
              <input
                type="search"
                placeholder="Search districts..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                style={{
                  flex: "1 1 280px",
                  minWidth: "240px",
                }}
              />

              <button
                type="button"
                className="admin-secondary-button"
                onClick={loadDistricts}
              >
                ↻ Refresh
              </button>
            </div>

            {isLoading ? (
              <div className="admin-loading">
                <div>
                  <strong>எங்கள் தேசம்</strong>
                  <p>Loading Districts...</p>
                </div>
              </div>
            ) : filteredDistricts.length === 0 ? (
              <div
                style={{
                  padding: "40px 20px",
                  textAlign: "center",
                  border: "1px dashed var(--line)",
                  borderRadius: "12px",
                  background: "var(--soft)",
                }}
              >
                <strong>
                  No districts found
                </strong>

                <p
                  style={{
                    marginTop: "8px",
                    color: "#6b7280",
                  }}
                >
                  Create your first district.
                </p>
              </div>
            ) : (
              <div
                style={{
                  overflowX: "auto",
                  border: "1px solid var(--line)",
                  borderRadius: "12px",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    minWidth: "800px",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: "var(--soft)",
                        borderBottom:
                          "1px solid var(--line)",
                      }}
                    >
                      <th
                        style={{
                          padding: "13px",
                          textAlign: "left",
                        }}
                      >
                        Order
                      </th>

                      <th
                        style={{
                          padding: "13px",
                          textAlign: "left",
                        }}
                      >
                        District
                      </th>

                      <th
                        style={{
                          padding: "13px",
                          textAlign: "left",
                        }}
                      >
                        Slug
                      </th>

                      <th
                        style={{
                          padding: "13px",
                          textAlign: "left",
                        }}
                      >
                        State
                      </th>

                      <th
                        style={{
                          padding: "13px",
                          textAlign: "left",
                        }}
                      >
                        Status
                      </th>

                      <th
                        style={{
                          padding: "13px",
                          textAlign: "right",
                        }}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredDistricts.map(
                      (district) => (
                        <tr
                          key={district.id}
                          style={{
                            borderBottom:
                              "1px solid var(--line)",
                          }}
                        >
                          <td
                            style={{
                              padding: "13px",
                            }}
                          >
                            {district.sort_order}
                          </td>

                          <td
                            style={{
                              padding: "13px",
                            }}
                          >
                            <strong>
                              {district.name}
                            </strong>
                          </td>

                          <td
                            style={{
                              padding: "13px",
                              color: "#6b7280",
                            }}
                          >
                            {district.slug}
                          </td>

                          <td
                            style={{
                              padding: "13px",
                            }}
                          >
                            {district.state_name}
                          </td>

                          <td
                            style={{
                              padding: "13px",
                            }}
                          >
                            <span
                              style={{
                                display: "inline-block",
                                padding:
                                  "5px 9px",
                                borderRadius:
                                  "999px",
                                fontSize: "12px",
                                fontWeight: 700,
                                background:
                                  district.is_active
                                    ? "#e8f5e9"
                                    : "#f3f4f6",
                                color:
                                  district.is_active
                                    ? "#166534"
                                    : "#6b7280",
                              }}
                            >
                              {district.is_active
                                ? "Active"
                                : "Inactive"}
                            </span>
                          </td>

                          <td
                            style={{
                              padding: "13px",
                              textAlign: "right",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent:
                                  "flex-end",
                                gap: "8px",
                                flexWrap: "wrap",
                              }}
                            >
                              <button
                                type="button"
                                className="admin-secondary-button"
                                onClick={() =>
                                  openEditForm(
                                    district
                                  )
                                }
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                className="admin-secondary-button"
                                onClick={() =>
                                  toggleDistrict(
                                    district
                                  )
                                }
                              >
                                {district.is_active
                                  ? "Disable"
                                  : "Enable"}
                              </button>

                              <button
                                type="button"
                                className="admin-secondary-button"
                                onClick={() =>
                                  deleteDistrict(
                                    district
                                  )
                                }
                              >
                                Delete
                              </button>
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