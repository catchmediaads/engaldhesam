"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

type Article = {
  id: string;
  article_type: string;
  status: string;
  category_id: string | null;
  district_id: string | null;
  reporter_id: string | null;
  submitted_at: string | null;
  created_at: string;
};

type Translation = {
  article_id: string;
  language_id: string;
  title: string;
  subtitle: string | null;
  content: string;
  excerpt: string | null;
  seo_title: string | null;
  seo_description: string | null;
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

export default function ReviewPage() {
  const supabase = createClient();

  const [articles, setArticles] = useState<Article[]>([]);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);

  const [selectedArticle, setSelectedArticle] =
    useState<Article | null>(null);

  const [selectedTranslation, setSelectedTranslation] =
    useState<Translation | null>(null);

  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadReviewData();
  }, []);

  async function loadReviewData() {
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

      const { data: role, error: roleError } =
        await supabase.rpc("get_my_role");

      if (roleError) {
        console.error("Role error:", roleError);
      }

      if (
        role !== "editor" &&
        role !== "super_admin"
      ) {
        setMessage(
          "You do not have permission to access News Review."
        );
        setLoading(false);
        return;
      }

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
            "id, article_type, status, category_id, district_id, reporter_id, submitted_at, created_at"
          )
          .eq("status", "submitted")
          .order("submitted_at", {
            ascending: false,
          }),

        supabase
          .from("article_translations")
          .select(
            "article_id, language_id, title, subtitle, content, excerpt, seo_title, seo_description, status"
          )
          .eq("status", "submitted"),

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
          `Articles loading failed: ${articlesResult.error.message}`
        );
      }

      if (translationsResult.error) {
        throw new Error(
          `Translations loading failed: ${translationsResult.error.message}`
        );
      }

      if (categoriesResult.error) {
        console.error(
          "Categories error:",
          categoriesResult.error
        );
      }

      if (districtsResult.error) {
        console.error(
          "Districts error:",
          districtsResult.error
        );
      }

      if (languagesResult.error) {
        console.error(
          "Languages error:",
          languagesResult.error
        );
      }

      setArticles(
        (articlesResult.data || []) as Article[]
      );

      setTranslations(
        (translationsResult.data || []) as Translation[]
      );

      setCategories(
        (categoriesResult.data || []) as Category[]
      );

      setDistricts(
        (districtsResult.data || []) as District[]
      );

      setLanguages(
        (languagesResult.data || []) as Language[]
      );
    } catch (error) {
      console.error("Review loading error:", error);

      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage(
          "Unable to load News Review."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  function getTranslation(articleId: string) {
    return (
      translations.find(
        (translation) =>
          translation.article_id === articleId
      ) || null
    );
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
    const language = languages.find(
      (item) => item.id === languageId
    );

    if (!language) {
      return "—";
    }

    return (
      language.native_name ||
      language.name
    );
  }

  function openArticle(article: Article) {
    setSelectedArticle(article);
    setSelectedTranslation(
      getTranslation(article.id)
    );
    setMessage("");
  }

  function closeArticle() {
    if (processing) {
      return;
    }

    setSelectedArticle(null);
    setSelectedTranslation(null);
  }

  async function updateArticleStatus(
    article: Article,
    newStatus:
      | "verified"
      | "changes_requested"
  ) {
    setProcessing(true);
    setMessage("");

    try {
      const { data: updatedArticle, error } =
        await supabase
          .from("articles")
          .update({
            status: newStatus,
          })
          .eq("id", article.id)
          .eq("status", "submitted")
          .select("id, status")
          .single();

      if (error) {
        throw new Error(
          `Article update failed: ${error.message}`
        );
      }

      if (!updatedArticle) {
        throw new Error(
          "The article could not be updated. It may have already been processed."
        );
      }

      const { error: translationError } =
        await supabase
          .from("article_translations")
          .update({
            status: newStatus,
          })
          .eq("article_id", article.id)
          .eq("status", "submitted");

      if (translationError) {
        console.error(
          "Translation status update error:",
          translationError
        );
      }

      if (newStatus === "verified") {
        setMessage(
          "News verified successfully. It is now waiting for Super Admin publishing."
        );
      } else {
        setMessage(
          "News returned to the reporter for changes."
        );
      }

      setSelectedArticle(null);
      setSelectedTranslation(null);

      await loadReviewData();
    } catch (error) {
      console.error(
        "Status update error:",
        error
      );

      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage(
          "Unable to update the article."
        );
      }
    } finally {
      setProcessing(false);
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
          <strong>எங்கள் தேசம்</strong>
          <p>
            Loading News Review...
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

          <a href="/admin/news">
            <span>📰</span>
            News
          </a>

          <a
            href="/admin/review"
            className="active"
          >
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

          <button onClick={handleLogout}>
            ⇥ Logout
          </button>

        </div>

      </aside>


      {/* MAIN */}

      <section className="admin-main">

        <header className="admin-topbar">

          <div>
            <h1>
              News Review
            </h1>

            <p>
              Review and verify submitted news
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
              href="/admin/news"
              className="admin-small-button"
            >
              ← News
            </a>
          </div>

        </header>


        <div className="admin-content">

          {/* MESSAGE */}

          {message && (
            <div
              style={{
                marginBottom: "20px",
                padding: "14px 16px",
                borderRadius: "10px",
                border:
                  "1px solid var(--line)",
                background:
                  "var(--soft)",
                color: "#18212b",
                fontWeight: 600,
              }}
            >
              {message}
            </div>
          )}


          {/* HEADER */}

          <section className="admin-welcome">

            <div>

              <div className="admin-label">
                EDITOR WORKFLOW
              </div>

              <h2>
                Submitted News
              </h2>

              <p>
                Review reporter submissions
                before they move to Super Admin
                publishing.
              </p>

            </div>

            <div
              style={{
                minWidth: "90px",
                textAlign: "center",
              }}
            >

              <strong
                style={{
                  display: "block",
                  fontSize: "32px",
                  lineHeight: "1",
                }}
              >
                {articles.length}
              </strong>

              <span
                style={{
                  color: "#64748b",
                  fontSize: "13px",
                }}
              >
                Pending Review
              </span>

            </div>

          </section>


          {/* EMPTY STATE */}

          {articles.length === 0 ? (

            <section className="admin-section">

              <div
                style={{
                  textAlign: "center",
                  padding: "60px 20px",
                }}
              >

                <div
                  style={{
                    fontSize: "48px",
                    marginBottom: "15px",
                  }}
                >
                  ✓
                </div>

                <h2>
                  No News Pending Review
                </h2>

                <p
                  style={{
                    color: "#64748b",
                    marginTop: "8px",
                  }}
                >
                  There are currently no
                  submitted articles waiting
                  for Editor review.
                </p>

              </div>

            </section>

          ) : (

            <section className="admin-section">

              <div className="admin-section-title">

                <div>
                  <h2>
                    Review Queue
                  </h2>

                  <p>
                    Click any article to review
                    the complete content.
                  </p>
                </div>

              </div>


              {/* TABLE */}

              <div
                style={{
                  overflowX: "auto",
                }}
              >

                <table
                  style={{
                    width: "100%",
                    borderCollapse:
                      "collapse",
                  }}
                >

                  <thead>

                    <tr>

                      <th
                        style={{
                          textAlign: "left",
                          padding: "12px",
                          borderBottom:
                            "1px solid var(--line)",
                        }}
                      >
                        News
                      </th>

                      <th
                        style={{
                          textAlign: "left",
                          padding: "12px",
                          borderBottom:
                            "1px solid var(--line)",
                        }}
                      >
                        Category
                      </th>

                      <th
                        style={{
                          textAlign: "left",
                          padding: "12px",
                          borderBottom:
                            "1px solid var(--line)",
                        }}
                      >
                        District
                      </th>

                      <th
                        style={{
                          textAlign: "left",
                          padding: "12px",
                          borderBottom:
                            "1px solid var(--line)",
                        }}
                      >
                        Submitted
                      </th>

                      <th
                        style={{
                          textAlign: "right",
                          padding: "12px",
                          borderBottom:
                            "1px solid var(--line)",
                        }}
                      >
                        Action
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {articles.map(
                      (article) => {

                        const translation =
                          getTranslation(
                            article.id
                          );

                        return (
                          <tr
                            key={article.id}
                          >

                            <td
                              style={{
                                padding: "15px 12px",
                                borderBottom:
                                  "1px solid var(--line)",
                                minWidth: "300px",
                              }}
                            >

                              <strong
                                style={{
                                  display: "block",
                                  marginBottom: "5px",
                                }}
                              >
                                {translation?.title ||
                                  "Untitled News"}
                              </strong>

                              <span
                                style={{
                                  fontSize: "13px",
                                  color:
                                    "#64748b",
                                }}
                              >
                                {article.article_type}
                              </span>

                            </td>


                            <td
                              style={{
                                padding: "15px 12px",
                                borderBottom:
                                  "1px solid var(--line)",
                              }}
                            >
                              {getCategoryName(
                                article.category_id
                              )}
                            </td>


                            <td
                              style={{
                                padding: "15px 12px",
                                borderBottom:
                                  "1px solid var(--line)",
                              }}
                            >
                              {getDistrictName(
                                article.district_id
                              )}
                            </td>


                            <td
                              style={{
                                padding: "15px 12px",
                                borderBottom:
                                  "1px solid var(--line)",
                                whiteSpace:
                                  "nowrap",
                              }}
                            >
                              {article.submitted_at
                                ? new Date(
                                    article.submitted_at
                                  ).toLocaleString(
                                    "en-IN"
                                  )
                                : "—"}
                            </td>


                            <td
                              style={{
                                padding: "15px 12px",
                                borderBottom:
                                  "1px solid var(--line)",
                                textAlign: "right",
                              }}
                            >

                              <button
                                type="button"
                                onClick={() =>
                                  openArticle(
                                    article
                                  )
                                }
                                className="admin-primary-button"
                                style={{
                                  border: "none",
                                  cursor:
                                    "pointer",
                                }}
                              >
                                Review
                              </button>

                            </td>

                          </tr>
                        );
                      }
                    )}

                  </tbody>

                </table>

              </div>

            </section>

          )}

        </div>

      </section>


      {/* REVIEW PANEL */}

      {selectedArticle && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background:
              "rgba(15, 23, 42, 0.55)",
            padding: "30px",
            overflowY: "auto",
          }}
        >

          <div
            style={{
              maxWidth: "1000px",
              margin: "0 auto",
              background: "#ffffff",
              borderRadius: "14px",
              overflow: "hidden",
              boxShadow:
                "0 20px 60px rgba(0,0,0,0.25)",
            }}
          >

            {/* PANEL HEADER */}

            <div
              style={{
                padding: "22px 25px",
                borderBottom:
                  "1px solid var(--line)",
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                gap: "20px",
              }}
            >

              <div>

                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color:
                      "var(--accent)",
                    textTransform:
                      "uppercase",
                    letterSpacing:
                      "0.08em",
                    marginBottom: "5px",
                  }}
                >
                  Editor Review
                </div>

                <h2
                  style={{
                    margin: 0,
                  }}
                >
                  Article Review
                </h2>

              </div>

              <button
                type="button"
                onClick={closeArticle}
                disabled={processing}
                style={{
                  border: "1px solid #d1d5db",
                  background: "#fff",
                  borderRadius: "8px",
                  padding: "9px 14px",
                  cursor: "pointer",
                }}
              >
                ✕ Close
              </button>

            </div>


            {/* ARTICLE */}

            <div
              style={{
                padding: "25px",
              }}
            >

              {selectedTranslation ? (

                <>

                  <h1
                    style={{
                      fontSize: "30px",
                      lineHeight: 1.25,
                      marginTop: 0,
                      marginBottom: "10px",
                    }}
                  >
                    {
                      selectedTranslation.title
                    }
                  </h1>


                  {selectedTranslation.subtitle && (
                    <p
                      style={{
                        fontSize: "17px",
                        color: "#64748b",
                        marginTop: 0,
                      }}
                    >
                      {
                        selectedTranslation.subtitle
                      }
                    </p>
                  )}


                  {/* META */}

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "10px",
                      margin:
                        "20px 0 25px",
                    }}
                  >

                    <span
                      style={{
                        padding:
                          "7px 10px",
                        borderRadius: "20px",
                        background:
                          "#eef3f2",
                        fontSize: "13px",
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
                        borderRadius: "20px",
                        background:
                          "#eef3f2",
                        fontSize: "13px",
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
                        borderRadius: "20px",
                        background:
                          "#eef3f2",
                        fontSize: "13px",
                      }}
                    >
                      🌐{" "}
                      {getLanguageName(
                        selectedTranslation.language_id
                      )}
                    </span>

                    <span
                      style={{
                        padding:
                          "7px 10px",
                        borderRadius: "20px",
                        background:
                          "#fff4df",
                        fontSize: "13px",
                      }}
                    >
                      ⏳ Submitted
                    </span>

                  </div>


                  {/* CONTENT */}

                  <div
                    style={{
                      borderTop:
                        "1px solid var(--line)",
                      paddingTop: "25px",
                    }}
                  >

                    <h3>
                      Article Content
                    </h3>

                    <div
                      style={{
                        whiteSpace:
                          "pre-wrap",
                        lineHeight: 1.8,
                        fontSize: "16px",
                        color: "#27313b",
                      }}
                    >
                      {
                        selectedTranslation.content
                      }
                    </div>

                  </div>


                  {/* SEO */}

                  {(selectedTranslation.seo_title ||
                    selectedTranslation.seo_description) && (

                    <div
                      style={{
                        marginTop: "30px",
                        padding: "18px",
                        background:
                          "#f7f7f4",
                        borderRadius: "10px",
                      }}
                    >

                      <h3>
                        SEO Information
                      </h3>

                      {selectedTranslation.seo_title && (
                        <p>
                          <strong>
                            SEO Title:
                          </strong>{" "}
                          {
                            selectedTranslation.seo_title
                          }
                        </p>
                      )}

                      {selectedTranslation.seo_description && (
                        <p>
                          <strong>
                            SEO Description:
                          </strong>{" "}
                          {
                            selectedTranslation.seo_description
                          }
                        </p>
                      )}

                    </div>

                  )}


                  {/* ACTIONS */}

                  <div
                    style={{
                      marginTop: "35px",
                      paddingTop: "22px",
                      borderTop:
                        "1px solid var(--line)",
                    }}
                  >

                    <h3>
                      Editor Decision
                    </h3>

                    <p
                      style={{
                        color: "#64748b",
                      }}
                    >
                      Verification does not
                      publish the article.
                      Verified news will move
                      to Super Admin for final
                      publishing.
                    </p>


                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "12px",
                        marginTop: "18px",
                      }}
                    >

                      <button
                        type="button"
                        disabled={processing}
                        onClick={() =>
                          updateArticleStatus(
                            selectedArticle,
                            "verified"
                          )
                        }
                        className="admin-primary-button"
                        style={{
                          border: "none",
                          cursor:
                            processing
                              ? "not-allowed"
                              : "pointer",
                        }}
                      >
                        {processing
                          ? "Processing..."
                          : "✓ Verify News"}
                      </button>


                      <button
                        type="button"
                        disabled={processing}
                        onClick={() =>
                          updateArticleStatus(
                            selectedArticle,
                            "changes_requested"
                          )
                        }
                        className="admin-secondary-button"
                        style={{
                          cursor:
                            processing
                              ? "not-allowed"
                              : "pointer",
                        }}
                      >
                        ↩ Request Changes
                      </button>

                    </div>

                  </div>

                </>

              ) : (

                <div
                  style={{
                    textAlign: "center",
                    padding: "40px",
                  }}
                >
                  <h3>
                    Translation not found
                  </h3>

                  <p>
                    The submitted article does
                    not have a submitted
                    translation record.
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