"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { createClient } from "../../../../lib/supabase-browser";

type Category = {
  id: string;
  name: string;
};

type District = {
  id: string;
  name: string;
};

type Language = {
  id: string;
  code: string;
  name: string;
  native_name?: string | null;
};

export default function CreateNewsPage() {
  const supabase = createClient();

  const [userEmail, setUserEmail] = useState("");

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [content, setContent] = useState("");

  const [articleType, setArticleType] = useState("news");
  const [categoryId, setCategoryId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [languageCode, setLanguageCode] = useState("ta");

  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");

  const [categories, setCategories] = useState<Category[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [altText, setAltText] = useState("");
  const [caption, setCaption] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      setUserEmail(user.email ?? "");

      const { data: categoryData, error: categoryError } = await supabase
        .from("categories")
        .select("id, name")
        .order("name", { ascending: true });

      if (categoryError) {
        console.error("Category load error:", categoryError);
      }

      const { data: districtData, error: districtError } = await supabase
        .from("districts")
        .select("id, name")
        .order("name", { ascending: true });

      if (districtError) {
        console.error("District load error:", districtError);
      }

      const { data: languageData, error: languageError } = await supabase
        .from("languages")
        .select("id, code, name, native_name")
        .eq("is_enabled", true)
        .order("sort_order", { ascending: true });

      if (languageError) {
        console.error("Language load error:", languageError);
      }

      setCategories(categoryData ?? []);
      setDistricts(districtData ?? []);
      setLanguages(languageData ?? []);

      if (languageData && languageData.length > 0) {
        const tamil = languageData.find((language) => language.code === "ta");
        setLanguageCode(tamil?.code ?? languageData[0].code);
      }

      setIsLoading(false);
    }

    loadData();
  }, []);

  function handleCoverChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessage("Please select an image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMessage("Cover image must be less than 10 MB.");
      event.target.value = "";
      return;
    }

    setMessage("");
    setCoverFile(file);

    const previewUrl = URL.createObjectURL(file);
    setCoverPreview(previewUrl);
  }

  function removeCoverImage() {
    if (coverPreview) {
      URL.revokeObjectURL(coverPreview);
    }

    setCoverFile(null);
    setCoverPreview("");
    setAltText("");
    setCaption("");
  }

  async function getImageDimensions(
    file: File
  ): Promise<{ width: number | null; height: number | null }> {
    return new Promise((resolve) => {
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);

      image.onload = () => {
        const width = image.naturalWidth || null;
        const height = image.naturalHeight || null;

        URL.revokeObjectURL(objectUrl);

        resolve({
          width,
          height,
        });
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);

        resolve({
          width: null,
          height: null,
        });
      };

      image.src = objectUrl;
    });
  }

  function createSafeFileName(fileName: string) {
    const extension = fileName.includes(".")
      ? fileName.substring(fileName.lastIndexOf(".")).toLowerCase()
      : "";

    const baseName = fileName
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase();

    return `${baseName || "cover-image"}-${Date.now()}${extension}`;
  }

  async function uploadCoverImage(userId: string) {
    if (!coverFile) {
      return null;
    }

    const fileName = createSafeFileName(coverFile.name);

    const filePath = `articles/${userId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("news-media")
      .upload(filePath, coverFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: coverFile.type,
      });

    if (uploadError) {
      throw new Error(
        `Cover image upload failed: ${uploadError.message}`
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from("news-media")
      .getPublicUrl(filePath);

    const fileUrl = publicUrlData.publicUrl;

    const dimensions = await getImageDimensions(coverFile);

    const { data: mediaData, error: mediaError } = await supabase
      .from("media")
      .insert({
        uploaded_by: userId,
        file_name: coverFile.name,
        file_path: filePath,
        file_url: fileUrl,
        media_type: "image",
        mime_type: coverFile.type,
        file_size: coverFile.size,
        width: dimensions.width,
        height: dimensions.height,
        alt_text: altText.trim() || null,
        caption: caption.trim() || null,
        is_active: true,
      })
      .select("id")
      .single();

    if (mediaError) {
      await supabase.storage
        .from("news-media")
        .remove([filePath]);

      throw new Error(
        `Media record creation failed: ${mediaError.message}`
      );
    }

    return {
      mediaId: mediaData.id,
      filePath,
    };
  }

  async function saveNews(status: "draft" | "submitted") {
    setMessage("");

    if (!title.trim()) {
      setMessage("Please enter the news title.");
      return;
    }

    if (!content.trim()) {
      setMessage("Please enter the news content.");
      return;
    }

    setSaving(true);

    let uploadedMedia: { mediaId: string; filePath: string } | null =
      null;

    let createdArticleId = "";

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      /*
       * STEP 1
       * Upload cover image and create media record.
       */
      if (coverFile) {
        uploadedMedia = await uploadCoverImage(user.id);
      }

      /*
       * STEP 2
       * Create article.
       */
      const { data: articleData, error: articleError } = await supabase
        .from("articles")
        .insert({
          article_type: articleType,
          status: "draft",
          category_id: categoryId || null,
          district_id: districtId || null,
          reporter_id: user.id,
        })
        .select("id")
        .single();

      if (articleError) {
        console.error("Article error:", articleError);

        if (uploadedMedia) {
          await supabase.storage
            .from("news-media")
            .remove([uploadedMedia.filePath]);

          await supabase
            .from("media")
            .delete()
            .eq("id", uploadedMedia.mediaId);
        }

        throw new Error(
          `News creation failed: ${articleError.message}`
        );
      }

      createdArticleId = articleData.id;

      /*
       * STEP 3
       * Create Tamil / selected language translation.
       */
      const selectedLanguage = languages.find(
        (language) => language.code === languageCode
      );

      if (!selectedLanguage) {
        await supabase
          .from("articles")
          .delete()
          .eq("id", articleData.id);

        if (uploadedMedia) {
          await supabase.storage
            .from("news-media")
            .remove([uploadedMedia.filePath]);

          await supabase
            .from("media")
            .delete()
            .eq("id", uploadedMedia.mediaId);
        }

        throw new Error(
          "Selected language could not be found. Please refresh the page and try again."
        );
      }

      const { error: translationError } = await supabase
        .from("article_translations")
        .insert({
          article_id: articleData.id,
          language_id: selectedLanguage.id,
          title: title.trim(),
          subtitle: subtitle.trim() || null,
          content: content.trim(),
          seo_title: seoTitle.trim() || null,
          seo_description: seoDescription.trim() || null,
          status: "draft",
          created_by: user.id,
          updated_by: user.id,
        });

      if (translationError) {
        console.error("Translation error:", translationError);

        await supabase
          .from("articles")
          .delete()
          .eq("id", articleData.id);

        if (uploadedMedia) {
          await supabase.storage
            .from("news-media")
            .remove([uploadedMedia.filePath]);

          await supabase
            .from("media")
            .delete()
            .eq("id", uploadedMedia.mediaId);
        }

        throw new Error(
          `Translation creation failed: ${translationError.message}`
        );
      }

      /*
       * STEP 4
       * Connect cover image to article.
       */
      if (uploadedMedia) {
        const { error: articleMediaError } = await supabase
          .from("article_media")
          .insert({
            article_id: articleData.id,
            media_id: uploadedMedia.mediaId,
            media_role: "featured",
            sort_order: 0,
          });

        if (articleMediaError) {
          console.error(
            "Article media error:",
            articleMediaError
          );

          await supabase
            .from("articles")
            .delete()
            .eq("id", articleData.id);

          await supabase.storage
            .from("news-media")
            .remove([uploadedMedia.filePath]);

          await supabase
            .from("media")
            .delete()
            .eq("id", uploadedMedia.mediaId);

          throw new Error(
            `Cover image linking failed: ${articleMediaError.message}`
          );
        }
      }

      /*
       * SUCCESS
       */
      if (status === "draft") {
        setMessage(
          "News draft saved successfully."
        );
      } else {
        setMessage(
          "News submitted successfully for Editor review."
        );
      }
      /*
 * STEP 5
 * If the user selected "Submit for Review",
 * move the article from draft to submitted.
 */
if (status === "submitted") {
  const { error: submitError } = await supabase
    .from("articles")
    .update({
      status: "submitted",
    })
    .eq("id", articleData.id);

  if (submitError) {
    console.error("Article submission error:", submitError);

    throw new Error(
      `News submission failed: ${submitError.message}`
    );
  }

  const { error: translationSubmitError } = await supabase
    .from("article_translations")
    .update({
      status: "submitted",
      updated_by: user.id,
    })
    .eq("article_id", articleData.id);

  if (translationSubmitError) {
    console.error(
      "Translation submission error:",
      translationSubmitError
    );

    throw new Error(
      `Translation submission failed: ${translationSubmitError.message}`
    );
  }
}

      setTitle("");
      setSubtitle("");
      setContent("");
      setArticleType("news");
      setCategoryId("");
      setDistrictId("");
      setLanguageCode("ta");
      setSeoTitle("");
      setSeoDescription("");
      removeCoverImage();

      console.log("Created article:", createdArticleId);
    } catch (error) {
      console.error("Save news error:", error);

      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage(
          "News save செய்ய முடியவில்லை. Please try again."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveNews("submitted");
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (isLoading) {
    return (
      <main className="admin-loading">
        <div>
          <strong>எங்கள் தேசம்</strong>
          <p>Loading News Editor...</p>
        </div>
      </main>
    );
  }

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

          <button onClick={handleLogout}>
            ⇥ Logout
          </button>
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <h1>Create News</h1>

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

        <div className="admin-content">
          <div
            style={{
              marginBottom: "20px",
            }}
          >
            <a
              href="/admin/news"
              style={{
                color: "var(--accent)",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              ← Back to News
            </a>
          </div>

          <form onSubmit={handleSubmit}>
            <section className="admin-section">
              <div className="admin-section-title">
                <div>
                  <h2>News Information</h2>
                  <p>
                    Basic information about this news article
                  </p>
                </div>
              </div>

              <div className="admin-form-grid">
                <div className="admin-form-group admin-form-full">
                  <label htmlFor="title">
                    News Title *
                  </label>

                  <input
                    id="title"
                    type="text"
                    placeholder="Enter the news headline"
                    value={title}
                    onChange={(event) =>
                      setTitle(event.target.value)
                    }
                    required
                  />
                </div>

                <div className="admin-form-group admin-form-full">
                  <label htmlFor="subtitle">
                    Subtitle
                  </label>

                  <input
                    id="subtitle"
                    type="text"
                    placeholder="Enter a short subtitle"
                    value={subtitle}
                    onChange={(event) =>
                      setSubtitle(event.target.value)
                    }
                  />
                </div>

                <div className="admin-form-group">
                  <label htmlFor="articleType">
                    Article Type
                  </label>

                  <select
                    id="articleType"
                    value={articleType}
                    onChange={(event) =>
                      setArticleType(event.target.value)
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

                <div className="admin-form-group">
                  <label htmlFor="languageCode">
                    Language
                  </label>

                  <select
                    id="languageCode"
                    value={languageCode}
                    onChange={(event) =>
                      setLanguageCode(event.target.value)
                    }
                  >
                    {languages.map((language) => (
                      <option
                        key={language.id}
                        value={language.code}
                      >
                        {language.native_name || language.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="admin-form-group">
                  <label htmlFor="category">
                    Category
                  </label>

                  <select
                    id="category"
                    value={categoryId}
                    onChange={(event) =>
                      setCategoryId(event.target.value)
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

                <div className="admin-form-group">
                  <label htmlFor="district">
                    District
                  </label>

                  <select
                    id="district"
                    value={districtId}
                    onChange={(event) =>
                      setDistrictId(event.target.value)
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

            <section className="admin-section">
              <div className="admin-section-title">
                <div>
                  <h2>Cover Image</h2>
                  <p>
                    Upload the main image for this news article
                  </p>
                </div>
              </div>

              {!coverFile ? (
                <div
                  style={{
                    border: "2px dashed var(--line)",
                    borderRadius: "12px",
                    padding: "35px 20px",
                    textAlign: "center",
                    background: "var(--soft)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "38px",
                      marginBottom: "10px",
                    }}
                  >
                    📸
                  </div>

                  <strong
                    style={{
                      display: "block",
                      marginBottom: "6px",
                    }}
                  >
                    Upload Cover Image
                  </strong>

                  <p
                    style={{
                      margin: "0 0 16px",
                      color: "#6b7280",
                    }}
                  >
                    JPG, PNG or WebP • Maximum 10 MB
                  </p>

                  <label
                    htmlFor="coverImage"
                    className="admin-primary-button"
                    style={{
                      display: "inline-block",
                      cursor: "pointer",
                    }}
                  >
                    Choose Image
                  </label>

                  <input
                    id="coverImage"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleCoverChange}
                    style={{ display: "none" }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    border: "1px solid var(--line)",
                    borderRadius: "12px",
                    padding: "16px",
                    background: "var(--paper)",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "minmax(240px, 360px) 1fr",
                      gap: "20px",
                      alignItems: "start",
                    }}
                  >
                    <div>
                      {coverPreview && (
                        <img
                          src={coverPreview}
                          alt="Cover preview"
                          style={{
                            width: "100%",
                            aspectRatio: "16 / 9",
                            objectFit: "cover",
                            borderRadius: "10px",
                            display: "block",
                          }}
                        />
                      )}

                      <button
                        type="button"
                        onClick={removeCoverImage}
                        style={{
                          marginTop: "10px",
                          width: "100%",
                          padding: "10px",
                          borderRadius: "8px",
                          border: "1px solid #d1d5db",
                          background: "#fff",
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        Remove Image
                      </button>
                    </div>

                    <div className="admin-form-grid">
                      <div className="admin-form-group admin-form-full">
                        <label>
                          Selected File
                        </label>

                        <div
                          style={{
                            padding: "11px 13px",
                            border: "1px solid var(--line)",
                            borderRadius: "8px",
                            background: "var(--soft)",
                          }}
                        >
                          <strong>
                            {coverFile.name}
                          </strong>

                          <div
                            style={{
                              fontSize: "13px",
                              color: "#6b7280",
                              marginTop: "4px",
                            }}
                          >
                            {(
                              coverFile.size /
                              (1024 * 1024)
                            ).toFixed(2)}{" "}
                            MB
                          </div>
                        </div>
                      </div>

                      <div className="admin-form-group admin-form-full">
                        <label htmlFor="altText">
                          Alt Text
                        </label>

                        <input
                          id="altText"
                          type="text"
                          placeholder="Describe the image for accessibility and SEO"
                          value={altText}
                          onChange={(event) =>
                            setAltText(event.target.value)
                          }
                        />
                      </div>

                      <div className="admin-form-group admin-form-full">
                        <label htmlFor="caption">
                          Image Caption
                        </label>

                        <input
                          id="caption"
                          type="text"
                          placeholder="Optional photo caption"
                          value={caption}
                          onChange={(event) =>
                            setCaption(event.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section className="admin-section">
              <div className="admin-section-title">
                <div>
                  <h2>Content</h2>
                  <p>
                    Write the complete news article
                  </p>
                </div>
              </div>

              <div className="admin-form-group admin-form-full">
                <label htmlFor="content">
                  News Content *
                </label>

                <textarea
                  id="content"
                  rows={18}
                  placeholder="Write the complete news article here..."
                  value={content}
                  onChange={(event) =>
                    setContent(event.target.value)
                  }
                  required
                />
              </div>
            </section>

            <section className="admin-section">
              <div className="admin-section-title">
                <div>
                  <h2>SEO</h2>
                  <p>
                    Search engine optimization information
                  </p>
                </div>
              </div>

              <div className="admin-form-grid">
                <div className="admin-form-group admin-form-full">
                  <label htmlFor="seoTitle">
                    SEO Title
                  </label>

                  <input
                    id="seoTitle"
                    type="text"
                    placeholder="SEO title for Google and social sharing"
                    value={seoTitle}
                    onChange={(event) =>
                      setSeoTitle(event.target.value)
                    }
                  />
                </div>

                <div className="admin-form-group admin-form-full">
                  <label htmlFor="seoDescription">
                    SEO Description
                  </label>

                  <textarea
                    id="seoDescription"
                    rows={4}
                    placeholder="Short description for search engines"
                    value={seoDescription}
                    onChange={(event) =>
                      setSeoDescription(event.target.value)
                    }
                  />
                </div>
              </div>
            </section>

            {message && (
              <div
                style={{
                  marginBottom: "20px",
                  padding: "14px 16px",
                  borderRadius: "10px",
                  border: "1px solid var(--line)",
                  background: "var(--soft)",
                  color: "#18212b",
                  fontWeight: 600,
                }}
              >
                {message}
              </div>
            )}

            <section className="admin-section">
              <div className="admin-section-title">
                <div>
                  <h2>Actions</h2>
                  <p>
                    Save the article or submit it for review
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={() => saveNews("draft")}
                  disabled={saving}
                  className="admin-secondary-button"
                >
                  {saving
                    ? "Saving..."
                    : "Save Draft"}
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="admin-primary-button"
                >
                  {saving
                    ? "Submitting..."
                    : "Submit for Review"}
                </button>

                <a
                  href="/admin/news"
                  className="admin-secondary-button"
                  style={{
                    textDecoration: "none",
                  }}
                >
                  Cancel
                </a>
              </div>
            </section>
          </form>
        </div>
      </section>
    </main>
  );
}