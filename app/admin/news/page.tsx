"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../../lib/supabase-browser";

type Article = {
  id: string;
  status: string;
  article_type: string;
  category_id: string | null;
  district_id: string | null;
  reporter_id: string | null;
  editor_id: string | null;
  published_by: string | null;
  published_at: string | null;
  submitted_at: string | null;
  verified_at: string | null;
  locked_at: string | null;
  created_at: string;
  updated_at: string;
};

type Translation = {
  article_id: string;
  language_id: string;
  title: string;
  subtitle: string | null;
  content: string;
  status: string;
};

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
  native_name: string;
};

type MediaItem = {
  media_id: string;
  media_role: string;
  sort_order: number;
  file_url: string;
  file_name: string;
  alt_text: string | null;
  caption: string | null;
};

export default function NewsManagementPage() {
  const supabase = createClient();

  const [articles, setArticles] = useState<Article[]>([]);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedArticle, setSelectedArticle] =
    useState<Article | null>(null);

  const [selectedTranslation, setSelectedTranslation] =
    useState<Translation | null>(null);

  const [selectedMedia, setSelectedMedia] =
    useState<MediaItem | null>(null);

  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadNews();
  }, []);

  async function loadNews() {
    setLoading(true);
    setMessage("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      setUserEmail(user.email || "");

      const { data: roleData, error: roleError } =
        await supabase.rpc("get_my_role");

      if (roleError) {
        console.error("Role error:", roleError);
      }

      setUserRole(roleData || "");

      const [
        articlesResult,
        translationsResult,
        categoriesResult,
        districtsResult,
        languagesResult,
      ] = await Promise.all([
        supabase
          .from("articles")
          .select(
            `
              id,
              status,
              article_type,
              category_id,
              district_id,
              reporter_id,
              editor_id,
              published_by,
              published_at,
              submitted_at,
              verified_at,
              locked_at,
              created_at,
              updated_at
            `
          )
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("article_translations")
          .select(
            `
              article_id,
              language_id,
              title,
              subtitle,
              content,
              status
            `
          )
          .order("created_at", {
            ascending: true,
          }),

        supabase
          .from("categories")
          .select("id, name")
          .order("sort_order", {
            ascending: true,
          }),

        supabase
          .from("districts")
          .select("id, name")
          .order("sort_order", {
            ascending: true,
          }),

        supabase
          .from("languages")
          .select(
            "id, code, name, native_name"
          )
          .order("sort_order", {
            ascending: true,
          }),
      ]);

      if (articlesResult.error) {
        throw new Error(
          `News load error: ${articlesResult.error.message}`
        );
      }

      if (translationsResult.error) {
        throw new Error(
          `Translation load error: ${translationsResult.error.message}`
        );
      }

      if (categoriesResult.error) {
        console.error(
          "Categories load error:",
          categoriesResult.error
        );
      }

      if (districtsResult.error) {
        console.error(
          "Districts load error:",
          districtsResult.error
        );
      }

      if (languagesResult.error) {
        console.error(
          "Languages load error:",
          languagesResult.error
        );
      }

      const articleData =
        (articlesResult.data || []) as Article[];

      const translationData =
        (translationsResult.data || []) as Translation[];

      setArticles(articleData);
      setTranslations(translationData);
      setCategories(
        (categoriesResult.data || []) as Category[]
      );
      setDistricts(
        (districtsResult.data || []) as District[]
      );
      setLanguages(
        (languagesResult.data || []) as Language[]
      );

      /*
       * Load media links separately.
       *
       * We do this only after articles are loaded so
       * that the page remains compatible with the
       * current article_media schema.
       */
      if (articleData.length > 0) {
        const articleIds = articleData.map(
          (article) => article.id
        );

        const { data: articleMediaData, error: articleMediaError } =
          await supabase
            .from("article_media")
            .select(
              `
                article_id,
                media_id,
                media_role,
                sort_order
              `
            )
            .in("article_id", articleIds)
            .order("sort_order", {
              ascending: true,
            });

        if (articleMediaError) {
          console.error(
            "Article media load error:",
            articleMediaError
          );
        } else if (
          articleMediaData &&
          articleMediaData.length > 0
        ) {
          const mediaIds = articleMediaData.map(
            (item) => item.media_id
          );

          const { data: mediaData, error: mediaError } =
            await supabase
              .from("media")
              .select(
                `
                  id,
                  file_url,
                  file_name,
                  alt_text,
                  caption
                `
              )
              .in("id", mediaIds);

          if (mediaError) {
            console.error(
              "Media load error:",
              mediaError
            );
          } else {
            const combinedMedia: MediaItem[] =
              articleMediaData.map((item) => {
                const media = (
                  mediaData || []
                ).find(
                  (mediaRow) =>
                    mediaRow.id === item.media_id
                );

                return {
                  media_id: item.media_id,
                  media_role: item.media_role,
                  sort_order: item.sort_order,
                  file_url:
                    media?.file_url || "",
                  file_name:
                    media?.file_name || "",
                  alt_text:
                    media?.alt_text || null,
                  caption:
                    media?.caption || null,
                };
              });

            setMediaItems(combinedMedia);
          }
        }
      }
    } catch (error) {
      console.error(
        "News loading error:",
        error
      );

      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage(
          "News load செய்ய முடியவில்லை."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  function getTranslation(
    articleId: string
  ) {
    /*
     * Prefer Tamil when available.
     * Otherwise use the first translation.
     */
    const articleTranslations =
      translations.filter(
        (translation) =>
          translation.article_id === articleId
      );

    if (articleTranslations.length === 0) {
      return null;
    }

    const tamilLanguage =
      languages.find(
        (language) =>
          language.code === "ta"
      );

    if (tamilLanguage) {
      const tamilTranslation =
        articleTranslations.find(
          (translation) =>
            translation.language_id ===
            tamilLanguage.id
        );

      if (tamilTranslation) {
        return tamilTranslation;
      }
    }

    return articleTranslations[0];
  }

  function getCategoryName(
    categoryId: string | null
  ) {
    if (!categoryId) {
      return "—";
    }

    return (
      categories.find(
        (category) =>
          category.id === categoryId
      )?.name || "—"
    );
  }

  function getDistrictName(
    districtId: string | null
  ) {
    if (!districtId) {
      return "—";
    }

    return (
      districts.find(
        (district) =>
          district.id === districtId
      )?.name || "—"
    );
  }

  function getLanguageName(
    languageId: string
  ) {
    const language =
      languages.find(
        (item) =>
          item.id === languageId
      );

    if (!language) {
      return "—";
    }

    return (
      language.native_name ||
      language.name
    );
  }

  function getArticleMedia(
    articleId: string
  ) {
    /*
     * article_media does not store article_id
     * in our MediaItem type, so we find media
     * through the article_media query again
     * only when opening the article.
     */
    return mediaItems.filter(
      () => false
    );
  }

  async function openArticle(
    article: Article
  ) {
    setSelectedArticle(article);

    const translation =
      getTranslation(article.id);

    setSelectedTranslation(
      translation
    );

    setSelectedMedia(null);

    /*
     * Get this article's media.
     */
    const { data: articleMediaData, error } =
      await supabase
        .from("article_media")
        .select(
          `
            media_id,
            media_role,
            sort_order
          `
        )
        .eq("article_id", article.id)
        .order("sort_order", {
          ascending: true,
        });

    if (error) {
      console.error(
        "Article media error:",
        error
      );
      return;
    }

    if (
      articleMediaData &&
      articleMediaData.length > 0
    ) {
      const firstMedia =
        articleMediaData[0];

      const { data: mediaData } =
        await supabase
          .from("media")
          .select(
            `
              id,
              file_url,
              file_name,
              alt_text,
              caption
            `
          )
          .eq("id", firstMedia.media_id)
          .single();

      if (mediaData) {
        setSelectedMedia({
          media_id: firstMedia.media_id,
          media_role:
            firstMedia.media_role,
          sort_order:
            firstMedia.sort_order,
          file_url:
            mediaData.file_url,
          file_name:
            mediaData.file_name,
          alt_text:
            mediaData.alt_text,
          caption:
            mediaData.caption,
        });
      }
    }
  }

  function closeArticle() {
    if (processing) {
      return;
    }

    setSelectedArticle(null);
    setSelectedTranslation(null);
    setSelectedMedia(null);
  }

  /*
   * SUPER ADMIN ONLY
   *
   * Publish:
   *
   * verified -> published
   *
   * The database trigger will set:
   * published_at
   * locked_at
   * published_by
   */
  async function publishArticle(
    article: Article
  ) {
    if (userRole !== "super_admin") {
      setMessage(
        "Only Super Admin can publish news."
      );
      return;
    }

    const translation =
      getTranslation(article.id);

    const title =
      translation?.title ||
      "this article";

    const confirmed =
      window.confirm(
        `Publish "${title}"?\n\nOnce published, the article will be locked according to the newsroom workflow.`
      );

    if (!confirmed) {
      return;
    }

    setProcessing(true);
    setMessage("");

    try {
      const { error } =
        await supabase
          .from("articles")
          .update({
            status: "published",
          })
          .eq("id", article.id)
          .eq("status", "verified");

      if (error) {
        throw new Error(
          `Publishing failed: ${error.message}`
        );
      }

      /*
       * Update the translation status too.
       */
      const { error: translationError } =
        await supabase
          .from("article_translations")
          .update({
            status: "published",
          })
          .eq("article_id", article.id)
          .eq("status", "verified");

      if (translationError) {
        console.error(
          "Translation publishing error:",
          translationError
        );
      }

      setMessage(
        "News published successfully and is now locked. 🔒"
      );

      setSelectedArticle(null);
      setSelectedTranslation(null);
      setSelectedMedia(null);

      await loadNews();
    } catch (error) {
      console.error(
        "Publish error:",
        error
      );

      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage(
          "Unable to publish the news."
        );
      }
    } finally {
      setProcessing(false);
    }
  }

  async function deleteNews(
    article: Article
  ) {
    /*
     * Published articles should not be deleted
     * through this normal UI.
     */
   if (
  article.status === "published" &&
  userRole !== "super_admin"
) {
  setMessage(
    "Published news is locked and cannot be deleted from here."
  );
  return;
}

    const translation =
      getTranslation(article.id);

    const title =
      translation?.title ||
      "this article";

    const confirmed =
      window.confirm(
        `Delete "${title}"?\n\nThis action cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    setProcessing(true);
    setMessage("");

    try {
      const { error } =
        await supabase
          .from("articles")
          .delete()
          .eq("id", article.id);

      if (error) {
        throw new Error(
          `Delete failed: ${error.message}`
        );
      }

      setMessage(
        "News deleted successfully."
      );

      await loadNews();
    } catch (error) {
      console.error(
        "Delete error:",
        error
      );

      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage(
          "Unable to delete the news."
        );
      }
    } finally {
      setProcessing(false);
    }
  }

  const filteredArticles =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return articles.filter(
        (article) => {
          const translation =
            getTranslation(
              article.id
            );

          const title =
            translation?.title ||
            "";

          const matchesSearch =
            !query ||
            title
              .toLowerCase()
              .includes(query);

          const matchesStatus =
            statusFilter === "all" ||
            article.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      articles,
      translations,
      categories,
      districts,
      languages,
      search,
      statusFilter,
    ]);

  function statusLabel(
    status: string
  ) {
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

  function statusStyle(
    status: string
  ): React.CSSProperties {
    switch (status) {
      case "draft":
        return {
          background: "#eef2f7",
          color: "#475569",
        };

      case "submitted":
        return {
          background: "#fff4df",
          color: "#946200",
        };

      case "changes_requested":
        return {
          background: "#fff0f0",
          color: "#a33a3a",
        };

      case "verified":
        return {
          background: "#eaf7ef",
          color: "#207044",
        };

      case "published":
        return {
          background: "#e8f3f5",
          color: "#176b73",
        };

      case "archived":
        return {
          background: "#f1f1ef",
          color: "#666666",
        };

      case "rejected":
        return {
          background: "#fcecec",
          color: "#9f2d2d",
        };

      default:
        return {
          background: "#f1f1ef",
          color: "#555",
        };
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (loading) {
    return (
      <main className="admin-loading">
        <div>
          <strong>
            எங்கள் தேசம்
          </strong>

          <p>
            Loading News...
          </p>
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
            onClick={handleLogout}
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
              News Management
            </h1>

            <p>
              Manage newsroom articles and
              publishing workflow
            </p>

          </div>


          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >

            <span
              style={{
                fontSize: "14px",
                color: "#64748b",
              }}
            >
              {userEmail}
            </span>

            <a
              href="/admin/news/new"
              className="admin-primary-button"
              style={{
                textDecoration:
                  "none",
              }}
            >
              + Create News
            </a>

          </div>

        </header>


        <div className="admin-content">

          {/* HEADER */}

          <section className="admin-section">

            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                gap: "20px",
                flexWrap:
                  "wrap",
                marginBottom:
                  "20px",
              }}
            >

              <div>

                <h2
                  style={{
                    margin:
                      "0 0 5px",
                  }}
                >
                  All News
                </h2>

                <p
                  style={{
                    margin: 0,
                    color:
                      "#64748b",
                  }}
                >
                  {articles.length} total
                  articles
                </p>

              </div>

            </div>


            {/* SEARCH + FILTER */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr 220px",
                gap: "14px",
                marginBottom:
                  "20px",
              }}
            >

              <input
                type="text"
                placeholder="🔎 Search news..."
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                style={{
                  width: "100%",
                  padding:
                    "13px 15px",
                  border:
                    "1px solid var(--line)",
                  borderRadius:
                    "10px",
                  fontSize:
                    "16px",
                  outline:
                    "none",
                  boxSizing:
                    "border-box",
                }}
              />


              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
                style={{
                  width: "100%",
                  padding:
                    "13px 15px",
                  border:
                    "1px solid var(--line)",
                  borderRadius:
                    "10px",
                  fontSize:
                    "15px",
                  background:
                    "#fff",
                  boxSizing:
                    "border-box",
                  cursor:
                    "pointer",
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


            {/* MESSAGE */}

            {message && (
              <div
                style={{
                  marginBottom:
                    "20px",
                  padding:
                    "14px 16px",
                  borderRadius:
                    "10px",
                  border:
                    "1px solid var(--line)",
                  background:
                    "var(--soft)",
                  color:
                    "#18212b",
                  fontWeight:
                    600,
                }}
              >
                {message}
              </div>
            )}


            {/* EMPTY */}

            {filteredArticles.length ===
            0 ? (

              <div
                style={{
                  textAlign:
                    "center",
                  padding:
                    "70px 20px",
                  border:
                    "1px solid var(--line)",
                  borderRadius:
                    "10px",
                  background:
                    "#fff",
                }}
              >

                <div
                  style={{
                    fontSize:
                      "48px",
                    marginBottom:
                      "15px",
                  }}
                >
                  📰
                </div>

                <h2>
                  No News Found
                </h2>

                <p
                  style={{
                    color:
                      "#64748b",
                  }}
                >
                  {articles.length ===
                  0
                    ? "Create your first news article."
                    : "No articles match your current search or status filter."}
                </p>

                {articles.length ===
                  0 && (
                  <a
                    href="/admin/news/new"
                    className="admin-primary-button"
                    style={{
                      display:
                        "inline-block",
                      marginTop:
                        "15px",
                      textDecoration:
                        "none",
                    }}
                  >
                    + Create News
                  </a>
                )}

              </div>

            ) : (

              /* TABLE */

              <div
                style={{
                  overflowX:
                    "auto",
                }}
              >

                <table
                  style={{
                    width:
                      "100%",
                    borderCollapse:
                      "collapse",
                  }}
                >

                  <thead>

                    <tr>

                      <th
                        style={{
                          textAlign:
                            "left",
                          padding:
                            "12px",
                          borderBottom:
                            "1px solid var(--line)",
                        }}
                      >
                        News
                      </th>

                      <th
                        style={{
                          textAlign:
                            "left",
                          padding:
                            "12px",
                          borderBottom:
                            "1px solid var(--line)",
                        }}
                      >
                        Status
                      </th>

                      <th
                        style={{
                          textAlign:
                            "left",
                          padding:
                            "12px",
                          borderBottom:
                            "1px solid var(--line)",
                        }}
                      >
                        Category
                      </th>

                      <th
                        style={{
                          textAlign:
                            "left",
                          padding:
                            "12px",
                          borderBottom:
                            "1px solid var(--line)",
                        }}
                      >
                        District
                      </th>

                      <th
                        style={{
                          textAlign:
                            "left",
                          padding:
                            "12px",
                          borderBottom:
                            "1px solid var(--line)",
                        }}
                      >
                        Date
                      </th>

                      <th
                        style={{
                          textAlign:
                            "right",
                          padding:
                            "12px",
                          borderBottom:
                            "1px solid var(--line)",
                        }}
                      >
                        Actions
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {filteredArticles.map(
                      (article) => {

                        const translation =
                          getTranslation(
                            article.id
                          );

                        const isPublished =
                          article.status ===
                          "published";

                        const isVerified =
                          article.status ===
                          "verified";

                        return (
                          <tr
                            key={
                              article.id
                            }
                          >

                            {/* NEWS */}

                            <td
                              style={{
                                padding:
                                  "15px 12px",
                                borderBottom:
                                  "1px solid var(--line)",
                                minWidth:
                                  "280px",
                              }}
                            >

                              <strong
                                style={{
                                  display:
                                    "block",
                                  marginBottom:
                                    "5px",
                                }}
                              >
                                {translation?.title ||
                                  "Untitled News"}
                              </strong>

                              {translation?.subtitle && (
                                <span
                                  style={{
                                    display:
                                      "block",
                                    fontSize:
                                      "13px",
                                    color:
                                      "#64748b",
                                    marginBottom:
                                      "5px",
                                  }}
                                >
                                  {
                                    translation.subtitle
                                  }
                                </span>
                              )}

                              <span
                                style={{
                                  fontSize:
                                    "12px",
                                  color:
                                    "#94a3b8",
                                  textTransform:
                                    "uppercase",
                                }}
                              >
                                {
                                  article.article_type
                                }
                              </span>

                            </td>


                            {/* STATUS */}

                            <td
                              style={{
                                padding:
                                  "15px 12px",
                                borderBottom:
                                  "1px solid var(--line)",
                              }}
                            >

                              <span
                                style={{
                                  display:
                                    "inline-block",
                                  padding:
                                    "6px 10px",
                                  borderRadius:
                                    "20px",
                                  fontSize:
                                    "12px",
                                  fontWeight:
                                    700,
                                  ...statusStyle(
                                    article.status
                                  ),
                                }}
                              >
                                {statusLabel(
                                  article.status
                                )}

                                {isPublished &&
                                  " 🔒"}
                              </span>

                            </td>


                            {/* CATEGORY */}

                            <td
                              style={{
                                padding:
                                  "15px 12px",
                                borderBottom:
                                  "1px solid var(--line)",
                              }}
                            >
                              {getCategoryName(
                                article.category_id
                              )}
                            </td>


                            {/* DISTRICT */}

                            <td
                              style={{
                                padding:
                                  "15px 12px",
                                borderBottom:
                                  "1px solid var(--line)",
                              }}
                            >
                              {getDistrictName(
                                article.district_id
                              )}
                            </td>


                            {/* DATE */}

                            <td
                              style={{
                                padding:
                                  "15px 12px",
                                borderBottom:
                                  "1px solid var(--line)",
                                whiteSpace:
                                  "nowrap",
                              }}
                            >
                              {new Date(
                                article.created_at
                              ).toLocaleDateString(
                                "en-IN"
                              )}
                            </td>


                            {/* ACTIONS */}

                            <td
                              style={{
                                padding:
                                  "15px 12px",
                                borderBottom:
                                  "1px solid var(--line)",
                                textAlign:
                                  "right",
                              }}
                            >

                              <div
                                style={{
                                  display:
                                    "flex",
                                  justifyContent:
                                    "flex-end",
                                  gap:
                                    "8px",
                                  flexWrap:
                                    "wrap",
                                }}
                              >

                                {/* VIEW */}

                                <button
                                  type="button"
                                  onClick={() =>
                                    openArticle(
                                      article
                                    )
                                  }
                                  disabled={
                                    processing
                                  }
                                  className="admin-secondary-button"
                                >
                                  👁 View
                                </button>


                                {/* PUBLISH */}

                                {isVerified &&
                                  userRole ===
                                    "super_admin" && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        publishArticle(
                                          article
                                        )
                                      }
                                      disabled={
                                        processing
                                      }
                                      className="admin-primary-button"
                                      style={{
                                        border:
                                          "none",
                                        cursor:
                                          processing
                                            ? "not-allowed"
                                            : "pointer",
                                      }}
                                    >
                                      🚀 Publish
                                    </button>
                                  )}


                                {/* DELETE */}

                                {
                                  userRole ===
                                    "super_admin" && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        deleteNews(
                                          article
                                        )
                                      }
                                      disabled={
                                        processing
                                      }
                                      className="admin-secondary-button"
                                      style={{
                                        cursor:
                                          processing
                                            ? "not-allowed"
                                            : "pointer",
                                      }}
                                    >
                                      🗑 Delete
                                    </button>
                                  )}

                                {/* LOCKED */}

                                {isPublished && (
                                  <span
                                    style={{
                                      display:
                                        "inline-flex",
                                      alignItems:
                                        "center",
                                      padding:
                                        "8px 10px",
                                      borderRadius:
                                        "8px",
                                      background:
                                        "#f1f1ef",
                                      color:
                                        "#64748b",
                                      fontSize:
                                        "13px",
                                      fontWeight:
                                        600,
                                    }}
                                  >
                                    🔒 Locked
                                  </span>
                                )}

                              </div>

                            </td>

                          </tr>
                        );
                      }
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </section>

        </div>

      </section>


      {/* ARTICLE VIEW MODAL */}

      {selectedArticle && (
        <div
          style={{
            position:
              "fixed",
            inset: 0,
            zIndex: 1000,
            background:
              "rgba(15, 23, 42, 0.55)",
            padding:
              "30px",
            overflowY:
              "auto",
          }}
        >

          <div
            style={{
              maxWidth:
                "1000px",
              margin:
                "0 auto",
              background:
                "#fff",
              borderRadius:
                "14px",
              overflow:
                "hidden",
              boxShadow:
                "0 20px 60px rgba(0,0,0,0.25)",
            }}
          >

            {/* MODAL HEADER */}

            <div
              style={{
                padding:
                  "22px 25px",
                borderBottom:
                  "1px solid var(--line)",
                display:
                  "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                gap:
                  "20px",
              }}
            >

              <div>

                <div
                  style={{
                    fontSize:
                      "12px",
                    fontWeight:
                      700,
                    color:
                      "var(--accent)",
                    textTransform:
                      "uppercase",
                    letterSpacing:
                      "0.08em",
                    marginBottom:
                      "5px",
                  }}
                >
                  News Management
                </div>

                <h2
                  style={{
                    margin:
                      0,
                  }}
                >
                  Article Details
                </h2>

              </div>

              <button
                type="button"
                onClick={
                  closeArticle
                }
                disabled={
                  processing
                }
                className="admin-secondary-button"
              >
                ✕ Close
              </button>

            </div>


            {/* MODAL CONTENT */}

            <div
              style={{
                padding:
                  "25px",
              }}
            >

              {selectedTranslation ? (

                <>

                  <h1
                    style={{
                      fontSize:
                        "32px",
                      lineHeight:
                        1.25,
                      marginTop:
                        0,
                      marginBottom:
                        "10px",
                    }}
                  >
                    {
                      selectedTranslation.title
                    }
                  </h1>


                  {selectedTranslation.subtitle && (
                    <p
                      style={{
                        fontSize:
                          "18px",
                        color:
                          "#64748b",
                        marginTop:
                          0,
                      }}
                    >
                      {
                        selectedTranslation.subtitle
                      }
                    </p>
                  )}


                  {/* STATUS + META */}

                  <div
                    style={{
                      display:
                        "flex",
                      flexWrap:
                        "wrap",
                      gap:
                        "10px",
                      margin:
                        "20px 0 25px",
                    }}
                  >

                    <span
                      style={{
                        padding:
                          "7px 10px",
                        borderRadius:
                          "20px",
                        fontSize:
                          "13px",
                        fontWeight:
                          700,
                        ...statusStyle(
                          selectedArticle.status
                        ),
                      }}
                    >
                      {statusLabel(
                        selectedArticle.status
                      )}

                      {selectedArticle.status ===
                        "published" &&
                        " 🔒"}
                    </span>

                    <span
                      style={{
                        padding:
                          "7px 10px",
                        borderRadius:
                          "20px",
                        background:
                          "#eef3f2",
                        fontSize:
                          "13px",
                      }}
                    >
                      🗂️{" "}
                      {getCategoryName(
                        selectedArticle.category_id
                      )}
                    </span>

                    <span
                      style={{
                        padding:
                          "7px 10px",
                        borderRadius:
                          "20px",
                        background:
                          "#eef3f2",
                        fontSize:
                          "13px",
                      }}
                    >
                      📍{" "}
                      {getDistrictName(
                        selectedArticle.district_id
                      )}
                    </span>

                    <span
                      style={{
                        padding:
                          "7px 10px",
                        borderRadius:
                          "20px",
                        background:
                          "#eef3f2",
                        fontSize:
                          "13px",
                      }}
                    >
                      🌐{" "}
                      {getLanguageName(
                        selectedTranslation.language_id
                      )}
                    </span>

                  </div>


                  {/* FEATURED IMAGE */}

                  {selectedMedia?.file_url && (
                    <div
                      style={{
                        marginBottom:
                          "30px",
                      }}
                    >

                      <img
                        src={
                          selectedMedia.file_url
                        }
                        alt={
                          selectedMedia.alt_text ||
                          selectedTranslation.title
                        }
                        style={{
                          width:
                            "100%",
                          maxHeight:
                            "480px",
                          objectFit:
                            "cover",
                          borderRadius:
                            "12px",
                          display:
                            "block",
                        }}
                      />

                      {selectedMedia.caption && (
                        <p
                          style={{
                            marginTop:
                              "8px",
                            fontSize:
                              "13px",
                            color:
                              "#64748b",
                          }}
                        >
                          {
                            selectedMedia.caption
                          }
                        </p>
                      )}

                    </div>
                  )}


                  {/* CONTENT */}

                  <div
                    style={{
                      borderTop:
                        "1px solid var(--line)",
                      paddingTop:
                        "25px",
                    }}
                  >

                    <h3>
                      Article Content
                    </h3>

                    <div
                      style={{
                        whiteSpace:
                          "pre-wrap",
                        lineHeight:
                          1.8,
                        fontSize:
                          "16px",
                        color:
                          "#27313b",
                      }}
                    >
                      {
                        selectedTranslation.content
                      }
                    </div>

                  </div>


                  {/* WORKFLOW INFORMATION */}

                  <div
                    style={{
                      marginTop:
                        "30px",
                      padding:
                        "18px",
                      background:
                        "#f7f7f4",
                      borderRadius:
                        "10px",
                    }}
                  >

                    <h3>
                      Workflow Information
                    </h3>

                    <p>
                      <strong>
                        Article Status:
                      </strong>{" "}
                      {statusLabel(
                        selectedArticle.status
                      )}
                    </p>

                    {selectedArticle.submitted_at && (
                      <p>
                        <strong>
                          Submitted:
                        </strong>{" "}
                        {new Date(
                          selectedArticle.submitted_at
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </p>
                    )}

                    {selectedArticle.verified_at && (
                      <p>
                        <strong>
                          Verified:
                        </strong>{" "}
                        {new Date(
                          selectedArticle.verified_at
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </p>
                    )}

                    {selectedArticle.published_at && (
                      <p>
                        <strong>
                          Published:
                        </strong>{" "}
                        {new Date(
                          selectedArticle.published_at
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </p>
                    )}

                    {selectedArticle.locked_at && (
                      <p>
                        <strong>
                          Locked:
                        </strong>{" "}
                        {new Date(
                          selectedArticle.locked_at
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </p>
                    )}

                  </div>


                  {/* SUPER ADMIN PUBLISH */}

                  {selectedArticle.status ===
                    "verified" &&
                    userRole ===
                      "super_admin" && (

                    <div
                      style={{
                        marginTop:
                          "30px",
                        padding:
                          "20px",
                        border:
                          "1px solid #d7e7e9",
                        background:
                          "#f2f8f9",
                        borderRadius:
                          "12px",
                      }}
                    >

                      <h3>
                        Super Admin Publishing
                      </h3>

                      <p
                        style={{
                          color:
                            "#64748b",
                        }}
                      >
                        This article has been
                        verified by the Editor.
                        Publishing it will move
                        the article to Published
                        status and lock it.
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          publishArticle(
                            selectedArticle
                          )
                        }
                        disabled={
                          processing
                        }
                        className="admin-primary-button"
                        style={{
                          border:
                            "none",
                          cursor:
                            processing
                              ? "not-allowed"
                              : "pointer",
                          marginTop:
                            "10px",
                        }}
                      >
                        {processing
                          ? "Publishing..."
                          : "🚀 Publish News"}
                      </button>

                    </div>

                  )}


                  {/* PUBLISHED LOCK */}

                  {selectedArticle.status ===
                    "published" && (

                    <div
                      style={{
                        marginTop:
                          "30px",
                        padding:
                          "20px",
                        background:
                          "#f1f1ef",
                        borderRadius:
                          "12px",
                        border:
                          "1px solid var(--line)",
                      }}
                    >

                      <h3>
                        🔒 Article Locked
                      </h3>

                      <p
                        style={{
                          color:
                            "#64748b",
                          marginBottom:
                            0,
                        }}
                      >
                        This article is published
                        and locked according to the
                        newsroom workflow.
                      </p>

                    </div>

                  )}

                </>

              ) : (

                <div
                  style={{
                    textAlign:
                      "center",
                    padding:
                      "50px",
                  }}
                >

                  <h3>
                    Article translation not
                    found
                  </h3>

                  <p>
                    No translation record is
                    available for this article.
                  </p>

                </div>

              )}

            </div>

          </div>

        </div>
      )}

    </main>
  );
}