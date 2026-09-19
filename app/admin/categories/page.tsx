"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "../../../lib/supabase-browser";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type CategoryForm = {
  name: string;
  slug: string;
  description: string;
  parent_id: string;
  is_active: boolean;
  sort_order: string;
};

export default function CategoriesPage() {
  const supabase = createClient();

  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<CategoryForm>({
    name: "",
    slug: "",
    description: "",
    parent_id: "",
    is_active: true,
    sort_order: "0",
  });

  async function loadCategories() {
    setIsLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("categories")
      .select(
        "id, name, slug, description, parent_id, is_active, sort_order, created_at, updated_at"
      )
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("Category load error:", error);
      setMessage(`Category load failed: ${error.message}`);
      setCategories([]);
    } else {
      setCategories(data ?? []);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    loadCategories();
  }, []);

  function resetForm() {
    setForm({
      name: "",
      slug: "",
      description: "",
      parent_id: "",
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

  function openEditForm(category: Category) {
    setEditingId(category.id);

    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description ?? "",
      parent_id: category.parent_id ?? "",
      is_active: category.is_active,
      sort_order: String(category.sort_order),
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");

    if (!form.name.trim()) {
      setMessage("Please enter a category name.");
      return;
    }

    if (!form.slug.trim()) {
      setMessage("Please enter a category slug.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim().toLowerCase(),
        description: form.description.trim() || null,
        parent_id: form.parent_id || null,
        is_active: form.is_active,
        sort_order: Number(form.sort_order) || 0,
      };

      if (editingId) {
        const { error } = await supabase
          .from("categories")
          .update(payload)
          .eq("id", editingId);

        if (error) {
          throw new Error(`Category update failed: ${error.message}`);
        }

        setMessage("Category updated successfully.");
      } else {
        const { error } = await supabase
          .from("categories")
          .insert(payload);

        if (error) {
          throw new Error(`Category creation failed: ${error.message}`);
        }

        setMessage("Category created successfully.");
      }

      closeForm();
      await loadCategories();
    } catch (error) {
      console.error("Category save error:", error);

      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage("Something went wrong. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function toggleCategory(category: Category) {
    setMessage("");

    const { error } = await supabase
      .from("categories")
      .update({
        is_active: !category.is_active,
      })
      .eq("id", category.id);

    if (error) {
      console.error("Category status error:", error);
      setMessage(`Status update failed: ${error.message}`);
      return;
    }

    await loadCategories();
  }

  async function deleteCategory(category: Category) {
    const confirmed = window.confirm(
      `Delete "${category.name}"?\n\nIf this category is already used by news articles, deletion may fail.`
    );

    if (!confirmed) {
      return;
    }

    setMessage("");

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", category.id);

    if (error) {
      console.error("Category delete error:", error);
      setMessage(
        `Category could not be deleted: ${error.message}`
      );
      return;
    }

    setMessage("Category deleted successfully.");
    await loadCategories();
  }

  function getParentName(parentId: string | null) {
    if (!parentId) {
      return "—";
    }

    const parent = categories.find(
      (category) => category.id === parentId
    );

    return parent?.name ?? "Unknown";
  }

  const filteredCategories = categories.filter((category) => {
    const query = search.toLowerCase().trim();

    if (!query) {
      return true;
    }

    return (
      category.name.toLowerCase().includes(query) ||
      category.slug.toLowerCase().includes(query) ||
      (category.description ?? "")
        .toLowerCase()
        .includes(query)
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

          <a
            href="/admin/categories"
            className="active"
          >
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
            <h1>Categories</h1>

            <p>
              Manage newspaper categories and subcategories
            </p>
          </div>

          <div className="admin-user">
            <div className="admin-avatar">
              SA
            </div>

            <div>
              <strong>Super Admin</strong>
              <span>Category Management</span>
            </div>
          </div>
        </header>

        <div className="admin-content">
          <section className="admin-section">
            <div className="admin-section-title">
              <div>
                <h2>Category Management</h2>

                <p>
                  Create and manage categories used across the newspaper.
                </p>
              </div>

              <button
                type="button"
                className="admin-primary-button"
                onClick={openCreateForm}
              >
                + Create Category
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
                        ? "Edit Category"
                        : "Create Category"}
                    </h2>

                    <p>
                      Configure the category information below.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="admin-form-grid">
                    <div className="admin-form-group">
                      <label htmlFor="categoryName">
                        Category Name *
                      </label>

                      <input
                        id="categoryName"
                        type="text"
                        placeholder="Example: அரசியல்"
                        value={form.name}
                        onChange={(event) =>
                          handleNameChange(event.target.value)
                        }
                        required
                      />
                    </div>

                    <div className="admin-form-group">
                      <label htmlFor="categorySlug">
                        Slug *
                      </label>

                      <input
                        id="categorySlug"
                        type="text"
                        placeholder="Example: politics"
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
                      <label htmlFor="parentCategory">
                        Parent Category
                      </label>

                      <select
                        id="parentCategory"
                        value={form.parent_id}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            parent_id: event.target.value,
                          }))
                        }
                      >
                        <option value="">
                          No Parent
                        </option>

                        {categories
                          .filter(
                            (category) =>
                              category.id !== editingId
                          )
                          .map((category) => (
                            <option
                              key={category.id}
                              value={category.id}
                            >
                              {category.name}
                            </option>
                          ))}
                      </select>
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
                            sort_order: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="admin-form-group admin-form-full">
                      <label htmlFor="categoryDescription">
                        Description
                      </label>

                      <textarea
                        id="categoryDescription"
                        rows={4}
                        placeholder="Optional description for this category"
                        value={form.description}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            description: event.target.value,
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

                        Active Category
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
                        ? "Update Category"
                        : "Save Category"}
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
                placeholder="Search categories..."
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
                onClick={loadCategories}
              >
                ↻ Refresh
              </button>
            </div>

            {isLoading ? (
              <div className="admin-loading">
                <div>
                  <strong>எங்கள் தேசம்</strong>
                  <p>Loading Categories...</p>
                </div>
              </div>
            ) : filteredCategories.length === 0 ? (
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
                  No categories found
                </strong>

                <p
                  style={{
                    marginTop: "8px",
                    color: "#6b7280",
                  }}
                >
                  Create your first newspaper category.
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
                    minWidth: "850px",
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
                        Category
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
                        Parent
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
                    {filteredCategories.map(
                      (category) => (
                        <tr
                          key={category.id}
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
                            {category.sort_order}
                          </td>

                          <td
                            style={{
                              padding: "13px",
                            }}
                          >
                            <strong>
                              {category.name}
                            </strong>

                            {category.description && (
                              <div
                                style={{
                                  marginTop: "4px",
                                  fontSize: "13px",
                                  color: "#6b7280",
                                  maxWidth: "320px",
                                }}
                              >
                                {category.description}
                              </div>
                            )}
                          </td>

                          <td
                            style={{
                              padding: "13px",
                              color: "#6b7280",
                            }}
                          >
                            {category.slug}
                          </td>

                          <td
                            style={{
                              padding: "13px",
                            }}
                          >
                            {getParentName(
                              category.parent_id
                            )}
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
                                  category.is_active
                                    ? "#e8f5e9"
                                    : "#f3f4f6",
                                color:
                                  category.is_active
                                    ? "#166534"
                                    : "#6b7280",
                              }}
                            >
                              {category.is_active
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
                                    category
                                  )
                                }
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                className="admin-secondary-button"
                                onClick={() =>
                                  toggleCategory(
                                    category
                                  )
                                }
                              >
                                {category.is_active
                                  ? "Disable"
                                  : "Enable"}
                              </button>

                              <button
                                type="button"
                                className="admin-secondary-button"
                                onClick={() =>
                                  deleteCategory(
                                    category
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