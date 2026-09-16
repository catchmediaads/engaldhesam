"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "../../../../lib/supabase-browser";

export default function CreateNewsPage() {
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [content, setContent] = useState("");
  const [articleType, setArticleType] = useState("news");

  const [categories, setCategories] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);

  const [categoryId, setCategoryId] = useState("");
  const [districtId, setDistrictId] = useState("");

  const [languageCode, setLanguageCode] = useState("ta");

  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadFormData();
  }, []);

  async function loadFormData() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data: categoryData } = await supabase
      .from("categories")
      .select("id, name")
      .order("name");

    const { data: districtData } = await supabase
      .from("districts")
      .select("id, name")
      .order("name");

    setCategories(categoryData ?? []);
    setDistricts(districtData ?? []);
  }

  async function saveNews(status: "draft" | "submitted") {
    setSaving(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    if (!title.trim()) {
      setMessage("Please enter the news title.");
      setSaving(false);
      return;
    }

    if (!content.trim()) {
      setMessage("Please enter the news content.");
      setSaving(false);
      return;
    }

    const { data: article, error: articleError } =
      await supabase
        .from("articles")
        .insert({
          title: title.trim(),
          subtitle: subtitle.trim() || null,
          content: content.trim(),
          article_type: articleType,
          status,
          category_id: categoryId || null,
          district_id: districtId || null,
          reporter_id: user.id,
        })
        .select()
        .single();

    if (articleError) {
      console.error(articleError);
      setMessage(articleError.message);
      setSaving(false);
      return;
    }

    const { error: translationError } =
      await supabase
        .from("article_translations")
        .insert({
          article_id: article.id,
          language_code: languageCode,
          title: title.trim(),
          subtitle: subtitle.trim() || null,
          content: content.trim(),
          seo_title: seoTitle.trim() || null,
          seo_description:
            seoDescription.trim() || null,
        });

    if (translationError) {
      console.error(translationError);
      setMessage(
        "News created, but translation data could not be saved."
      );
      setSaving(false);
      return;
    }

    setMessage(
      status === "draft"
        ? "News saved as Draft successfully."
        : "News submitted for Editor Review successfully."
    );

    setTitle("");
    setSubtitle("");
    setContent("");
    setSeoTitle("");
    setSeoDescription("");
    setCategoryId("");
    setDistrictId("");

    setSaving(false);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await saveNews("submitted");
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

          <a href="/admin/news" className="active">
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
            <h1>Create News</h1>

            <p>
              Create and submit a new article
            </p>
          </div>

          <a
            href="/admin/news"
            className="admin-small-button"
          >
            ← Back to News
          </a>

        </header>

        <div className="admin-content">

          <form onSubmit={handleSubmit}>

            {/* BASIC INFORMATION */}

            <section className="admin-section">

              <div className="admin-section-title">
                <div>
                  <h2>News Information</h2>

                  <p>
                    Enter the basic information for this
                    article.
                  </p>
                </div>
              </div>

              <div className="news-form-grid">

                <div className="news-form-full">

                  <label>
                    News Title *
                  </label>

                  <input
                    type="text"
                    value={title}
                    onChange={(e) =>
                      setTitle(e.target.value)
                    }
                    placeholder="செய்தியின் தலைப்பை உள்ளிடவும்"
                    required
                  />

                </div>

                <div className="news-form-full">

                  <label>
                    Subtitle
                  </label>

                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) =>
                      setSubtitle(e.target.value)
                    }
                    placeholder="செய்தியின் துணைத்தலைப்பு"
                  />

                </div>

                <div>

                  <label>
                    Article Type
                  </label>

                  <select
                    value={articleType}
                    onChange={(e) =>
                      setArticleType(e.target.value)
                    }
                  >

                    <option value="news">
                      News
                    </option>

                    <option value="breaking">
                      Breaking News
                    </option>

                    <option value="opinion">
                      Opinion
                    </option>

                    <option value="interview">
                      Interview
                    </option>

                    <option value="explainer">
                      Explainer
                    </option>

                    <option value="special">
                      Special
                    </option>

                    <option value="press_release">
                      Press Release
                    </option>

                  </select>

                </div>

                <div>

                  <label>
                    Language
                  </label>

                  <select
                    value={languageCode}
                    onChange={(e) =>
                      setLanguageCode(e.target.value)
                    }
                  >

                    <option value="ta">
                      தமிழ்
                    </option>

                    <option value="en">
                      English
                    </option>

                    <option value="hi">
                      हिन्दी
                    </option>

                  </select>

                </div>

                <div>

                  <label>
                    Category
                  </label>

                  <select
                    value={categoryId}
                    onChange={(e) =>
                      setCategoryId(e.target.value)
                    }
                  >

                    <option value="">
                      Select Category
                    </option>

                    {categories.map((category) => (
                      <option
                        key={category.id}
                        value={category.id}
                      >
                        {category.name}
                      </option>
                    ))}

                  </select>

                </div>

                <div>

                  <label>
                    District
                  </label>

                  <select
                    value={districtId}
                    onChange={(e) =>
                      setDistrictId(e.target.value)
                    }
                  >

                    <option value="">
                      Select District
                    </option>

                    {districts.map((district) => (
                      <option
                        key={district.id}
                        value={district.id}
                      >
                        {district.name}
                      </option>
                    ))}

                  </select>

                </div>

              </div>

            </section>

            {/* CONTENT */}

            <section className="admin-section">

              <div className="admin-section-title">

                <div>
                  <h2>News Content</h2>

                  <p>
                    Write the complete news article.
                  </p>
                </div>

              </div>

              <div className="news-form-full">

                <label>
                  Content *
                </label>

                <textarea
                  value={content}
                  onChange={(e) =>
                    setContent(e.target.value)
                  }
                  placeholder="இங்கே முழுமையான செய்தியை எழுதவும்..."
                  rows={16}
                  required
                />

              </div>

            </section>

            {/* SEO */}

            <section className="admin-section">

              <div className="admin-section-title">

                <div>
                  <h2>SEO Information</h2>

                  <p>
                    Search engine optimization details.
                  </p>
                </div>

              </div>

              <div className="news-form-grid">

                <div className="news-form-full">

                  <label>
                    SEO Title
                  </label>

                  <input
                    type="text"
                    value={seoTitle}
                    onChange={(e) =>
                      setSeoTitle(e.target.value)
                    }
                    placeholder="SEO optimized title"
                  />

                </div>

                <div className="news-form-full">

                  <label>
                    SEO Description
                  </label>

                  <textarea
                    value={seoDescription}
                    onChange={(e) =>
                      setSeoDescription(e.target.value)
                    }
                    placeholder="Short description for search engines"
                    rows={4}
                  />

                </div>

              </div>

            </section>

            {/* MESSAGE */}

            {message && (

              <div
                style={{
                  padding: "14px 16px",
                  background: "#eef3f2",
                  border: "1px solid #d9d7d0",
                  borderRadius: "8px",
                  marginBottom: "20px",
                }}
              >
                {message}
              </div>

            )}

            {/* ACTIONS */}

            <section
              className="admin-section"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "15px",
                flexWrap: "wrap",
              }}
            >

              <a
                href="/admin/news"
                className="admin-small-button"
              >
                Cancel
              </a>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >

                <button
                  type="button"
                  className="admin-small-button"
                  disabled={saving}
                  onClick={() =>
                    saveNews("draft")
                  }
                >
                  {saving
                    ? "Saving..."
                    : "Save Draft"}
                </button>

                <button
                  type="submit"
                  className="admin-primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Submitting..."
                    : "Submit for Review →"}
                </button>

              </div>

            </section>

          </form>

        </div>

      </section>

    </main>
  );
}