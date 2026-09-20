import UserMenu from "@/components/UserMenu";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const sections = [
  "முகப்பு",
  "தமிழ்நாடு",
  "மாவட்டங்கள்",
  "இந்தியா",
  "உலகம்",
  "அரசியல்",
  "வணிகம்",
  "விளையாட்டு",
  "சினிமா",
  "தொழில்நுட்பம்",
  "விவசாயம்",
  "கல்வி",
  "வாழ்க்கை",
  "சிறப்பு",
];

function formatTamilTime(dateString: string) {
  const date = new Date(dateString);

  return new Intl.DateTimeFormat("ta-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getRelativeTime(dateString: string) {
  const date = new Date(dateString).getTime();
  const now = Date.now();

  const difference = Math.floor((now - date) / 1000);

  if (difference < 60) {
    return "சில விநாடிகளுக்கு முன்";
  }

  if (difference < 3600) {
    return `${Math.floor(difference / 60)} நிமிடங்களுக்கு முன்`;
  }

  if (difference < 86400) {
    return `${Math.floor(difference / 3600)} மணி நேரத்திற்கு முன்`;
  }

  if (difference < 604800) {
    return `${Math.floor(difference / 86400)} நாட்களுக்கு முன்`;
  }

  return formatTamilTime(dateString);
}

export default async function Home() {
  /*
   * ==========================================
   * 1. PUBLISHED ARTICLES
   * ==========================================
   */

  const { data: articles, error: articlesError } = await supabase
    .from("articles")
    .select(
      `
        id,
        category_id,
        district_id,
        status,
        article_type,
        featured,
        breaking_news,
        published_at,
        created_at
      `
    )
    .eq("status", "published")
    .order("published_at", {
      ascending: false,
    })
    .limit(30);

  /*
   * ==========================================
   * 2. PUBLISHED TAMIL TRANSLATIONS
   * ==========================================
   */

  const articleIds = (articles || []).map((article) => article.id);

  let translations: any[] = [];

  if (articleIds.length > 0) {
    const { data: translationData, error: translationError } =
      await supabase
        .from("article_translations")
        .select(
          `
            id,
            article_id,
            language_id,
            title,
            subtitle,
            content,
            excerpt,
            seo_title,
            seo_description,
            status,
            created_at,
            updated_at
          `
        )
        .in("article_id", articleIds)
        .eq("status", "published");

    if (!translationError) {
      translations = translationData || [];
    }
  }

  /*
   * ==========================================
   * 3. LANGUAGES
   * ==========================================
   */

  const { data: languages } = await supabase
    .from("languages")
    .select("id, code, name, native_name")
    .eq("code", "ta");

  const tamilLanguage = languages?.[0];

  /*
   * ==========================================
   * 4. CATEGORIES
   * ==========================================
   */

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("sort_order", {
      ascending: true,
    });

  /*
   * ==========================================
   * 5. DISTRICTS
   * ==========================================
   */

  const { data: districts } = await supabase
    .from("districts")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("sort_order", {
      ascending: true,
    });

  /*
   * ==========================================
   * 6. ARTICLE MEDIA
   * ==========================================
   */

  let articleMedia: any[] = [];

  if (articleIds.length > 0) {
    const { data: articleMediaData } = await supabase
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
      .eq("media_role", "featured");

    articleMedia = articleMediaData || [];
  }

  /*
   * ==========================================
   * 7. MEDIA
   * ==========================================
   */

  const mediaIds = articleMedia.map((item) => item.media_id);

  let media: any[] = [];

  if (mediaIds.length > 0) {
    const { data: mediaData } = await supabase
      .from("media")
      .select(
        `
          id,
          file_name,
          file_path,
          file_url,
          media_type,
          mime_type,
          alt_text,
          caption
        `
      )
      .in("id", mediaIds)
      .eq("is_active", true);

    media = mediaData || [];
  }

  /*
   * ==========================================
   * 8. BUILD FINAL NEWS OBJECTS
   * ==========================================
   */

  const publishedNews = (articles || [])
    .map((article) => {
      const translation =
        translations.find(
          (item) =>
            item.article_id === article.id &&
            item.language_id === tamilLanguage?.id
        ) ||
        translations.find(
          (item) => item.article_id === article.id
        );

      if (!translation) {
        return null;
      }

      const category = categories?.find(
        (item) => item.id === article.category_id
      );

      const district = districts?.find(
        (item) => item.id === article.district_id
      );

      const articleMediaItem = articleMedia.find(
        (item) => item.article_id === article.id
      );

      const mediaItem = media.find(
        (item) => item.id === articleMediaItem?.media_id
      );

      return {
        id: article.id,
        title: translation.title,
        subtitle: translation.subtitle,
        excerpt: translation.excerpt,
        content: translation.content,
        category: category?.name || "செய்திகள்",
        district: district?.name || "",
        image:
          mediaItem?.file_url ||
          null,
        imageAlt:
          mediaItem?.alt_text ||
          translation.title,
        publishedAt:
          article.published_at ||
          article.created_at,
        breakingNews:
          article.breaking_news,
      };
    })
    .filter(Boolean) as any[];

  /*
   * ==========================================
   * 9. SECTIONS
   * ==========================================
   */
const heroNews = publishedNews[0];

/*
 * HERO SIDE
 * Keep only 2 additional stories in the hero area.
 */
const heroSideNews = publishedNews.slice(1, 3);

/*
 * LATEST NEWS
 *
 * Start after the hero area when enough stories exist.
 * If there are only a few published stories, use the
 * remaining published stories so the section is not empty.
 */
const heroIds = new Set(
  publishedNews
    .slice(0, 3)
    .map((news) => news.id)
);

const latestAfterHero = publishedNews
  .filter((news) => !heroIds.has(news.id))
  .slice(0, 8);

const latestNews =
  latestAfterHero.length > 0
    ? latestAfterHero
    : publishedNews.slice(1, 9);

/*
 * DISTRICT NEWS
 *
 * Show published articles that have a district.
 * When there are enough articles, avoid articles already
 * shown in Hero / Latest. When there are only a few
 * articles, use district articles as a fallback.
 */
const districtCandidates = publishedNews.filter(
  (news) => news.district
);

const shownBeforeDistrict = new Set([
  ...heroIds,
  ...latestNews.map((news) => news.id),
]);

const districtNewsWithoutDuplicates = districtCandidates
  .filter((news) => !shownBeforeDistrict.has(news.id))
  .slice(0, 6);

const districtNews =
  districtNewsWithoutDuplicates.length > 0
    ? districtNewsWithoutDuplicates
    : districtCandidates.slice(0, 6);

/*
 * BREAKING NEWS
 */
const breakingNews = publishedNews
  .filter((news) => news.breakingNews)
  .slice(0, 5);

  return (
    <main className="site">

      {/* ======================================
          HEADER
      ====================================== */}

      <header className="header">
        <div className="header-inner">

          <div className="brand">
 
  <img
    src="/images/branding/engal-dhesam-logo-transparent.png"
    alt="எங்கள் தேசம் | ஓர் இனத்தின் பெருங்கனவு"
    className="site-logo"
    style={{
      width: "200px",
      height: "auto",
      objectFit: "contain",
      objectPosition: "left center",
      display: "block",
    }}
  />
</div>

          <div className="header-actions">

            <button type="button">
              ⌕ <span>தேடல்</span>
            </button>

            <button type="button">
              ▣ <span>E-Paper</span>
            </button>

            <UserMenu />

          </div>
        </div>
      </header>

      {/* ======================================
          NAVIGATION
      ====================================== */}

      <nav className="navigation">
        <div className="nav-inner">

  {sections.map((section) => {
  const routes: Record<string, string> = {
    முகப்பு: "/",
    தமிழ்நாடு: "/category/tamil-nadu",
    மாவட்டங்கள்: "/districts",
    இந்தியா: "/category/india",
    உலகம்: "/category/world",
    அரசியல்: "/category/politics",
    வணிகம்: "/category/business",
    விளையாட்டு: "/category/sports",
    சினிமா: "/category/cinema",
    தொழில்நுட்பம்: "/category/technology",
    விவசாயம்: "/category/agriculture",
    கல்வி: "/category/education",
    வாழ்க்கை: "/category/lifestyle",
    சிறப்பு: "/category/special",
  };

  return (
    <Link
      href={routes[section] || "/"}
      key={section}
    >
      {section}
    </Link>
  );
})}

        </div>
      </nav>

      

      {/* ======================================
          BREAKING NEWS
      ====================================== */}

      <section className="breaking">

        <div className="breaking-label">
          BREAKING
        </div>

        <div className="breaking-text">

          {breakingNews.length > 0
            ? breakingNews
                .map((news) => news.title)
                .join("  •  ")
            : "முக்கிய செய்திகள் மற்றும் உடனடி தகவல்கள் — எங்கள் தேசம் நேரலை செய்தி புதுப்பிப்புகள்"}

        </div>

      </section>

       {/* ======================================
          BREAKING NEWS BOTTOM AD
      ====================================== */}

      <section className="breaking-ad-section">
        <div className="top-ad-banner">
          <span>ADVERTISEMENT</span>
          <strong>970 × 90</strong>
          <small>உங்கள் விளம்பரம் இங்கே</small>
        </div>
      </section>

      {/* ======================================
          MAIN CONTENT
      ====================================== */}

      <div className="container">

        {/* ====================================
            HERO
        ==================================== */}

        {heroNews ? (

          <section className="hero-grid">

            <Link
              href={`/news/${heroNews.id}`}
              className="news-card-link hero-main"
            >

              <div className="image-placeholder">

                {heroNews.image ? (
                  <img
                    src={heroNews.image}
                    alt={heroNews.imageAlt}
                  />
                ) : (
                  <span>
                    முக்கிய செய்தி படம்
                  </span>
                )}

              </div>

              <div className="hero-content">

                <div className="category">
                  {heroNews.category}
                </div>

                <h1>
                  {heroNews.title}
                </h1>

                {heroNews.subtitle && (
                  <p>
                    {heroNews.subtitle}
                  </p>
                )}

                <div className="meta">
                  {getRelativeTime(
                    heroNews.publishedAt
                  )}
                </div>

              </div>

            </Link>

            <div className="hero-side">

              {heroSideNews.map((news) => (

                <Link
                  href={`/news/${news.id}`}
                  className="news-card-link small-card"
                  key={news.id}
                >

                  <div className="small-image">

                    {news.image ? (
                      <img
                        src={news.image}
                        alt={news.imageAlt}
                      />
                    ) : (
                      <span>
                        செய்தி படம்
                      </span>
                    )}

                  </div>

                  <div>

                    <div className="category">
                      {news.category}
                    </div>

                    <h2>
                      {news.title}
                    </h2>

                    <div className="meta">
                      {getRelativeTime(
                        news.publishedAt
                      )}
                    </div>

                  </div>

                </Link>

              ))}

            </div>

          </section>

        ) : (

          <section className="hero-grid">

            <article className="hero-main">

              <div className="image-placeholder">
                <span>
                  இன்னும் செய்திகள் வெளியிடப்படவில்லை
                </span>
              </div>

              <div className="hero-content">

                <div className="category">
                  எங்கள் தேசம்
                </div>

                <h1>
                  விரைவில் முக்கிய செய்திகள் இங்கே வெளியாகும்
                </h1>

                <p>
                  ஆசிரியர் குழுவால் வெளியிடப்படும்
                  செய்திகள் இந்த பகுதியில் காணப்படும்.
                </p>

              </div>

            </article>

          </section>

        )}

        {/* ====================================
            CONTENT + SIDEBAR
        ==================================== */}

        <section className="content-layout">

          {/* LEFT COLUMN */}

          <div className="main-column">

            <div className="section-heading">

              <h2>
                சமீபத்திய செய்திகள்
              </h2>

              <Link href="#">
                அனைத்தையும் காண்க →
              </Link>

            </div>

            <div className="news-list">

              {latestNews.length > 0 ? (

                latestNews.map((news) => (

                  <Link
                    href={`/news/${news.id}`}
                    className="news-card-link news-item"
                    key={news.id}
                  >

                    <div className="news-image">

                      {news.image ? (
                        <img
                          src={news.image}
                          alt={news.imageAlt}
                        />
                      ) : (
                        <span>
                          படம்
                        </span>
                      )}

                    </div>

                    <div className="news-info">

                      <div className="category">
                        {news.category}
                      </div>

                      <h3>
                        {news.title}
                      </h3>

                      <div className="meta">
                        {getRelativeTime(
                          news.publishedAt
                        )}
                      </div>

                    </div>

                  </Link>

                ))

              ) : (

                <div className="news-item">

                  <div className="news-info">

                    <h3>
                      தற்போது வெளியிடப்பட்ட செய்திகள் இல்லை.
                    </h3>

                  </div>

                </div>

              )}

            </div>

            {/* =================================
                DISTRICT NEWS
            ================================= */}

            <div className="section-heading district-heading">

              <h2>
                மாவட்ட செய்திகள்
              </h2>

              <Link href="#">
                அனைத்து மாவட்டங்கள் →
              </Link>

            </div>

            <div className="district-grid">

              {districtNews.length > 0 ? (

                districtNews.map((news) => (

                  <Link
                    href={`/news/${news.id}`}
                    className="news-card-link district-card"
                    key={news.id}
                  >

                    <div className="district-image">

                      {news.image ? (
                        <img
                          src={news.image}
                          alt={news.imageAlt}
                        />
                      ) : (
                        <span>
                          படம்
                        </span>
                      )}

                    </div>

                    <div className="category">
                      {news.district}
                    </div>

                    <h3>
                      {news.title}
                    </h3>

                    <div className="meta">
                      {getRelativeTime(
                        news.publishedAt
                      )}
                    </div>

                  </Link>

                ))

              ) : (

                <div className="district-card">

                  <h3>
                    மாவட்ட செய்திகள் விரைவில் வெளியாகும்.
                  </h3>

                </div>

              )}

            </div>

          </div>

          {/* ==================================
              SIDEBAR
          ================================== */}

          <aside className="sidebar">

            {/* MOST READ */}

            <div className="sidebar-box">

              <h2>
                அதிகம் படிக்கப்பட்டவை
              </h2>

              {latestNews
                .slice(0, 5)
                .map((news, index) => (

                  <div
                    className="most-read"
                    key={news.id}
                  >

                    <div className="number">
                      {index + 1}
                    </div>

                    <div>

                      <h3>
                        {news.title}
                      </h3>

                      <span>
                        {news.category}
                      </span>

                    </div>

                  </div>

                ))}

              {latestNews.length === 0 && (
                <p>
                  தற்போது செய்திகள் இல்லை.
                </p>
              )}

            </div>

            {/* AD */}

            <div className="ad-box">

              <span>
                ADVERTISEMENT
              </span>

              <strong>
                300 × 250
              </strong>

            </div>

            {/* SIDEBAR BREAKING */}

            <div className="sidebar-box">

              <h2>
                அவசர செய்திகள்
              </h2>

              {breakingNews.length > 0 ? (

                breakingNews
                  .slice(0, 3)
                  .map((news) => (

                    <div
                      className="side-breaking"
                      key={news.id}
                    >

                      <span>
                        {getRelativeTime(
                          news.publishedAt
                        )}
                      </span>

                      <p>
                        {news.title}
                      </p>

                    </div>

                  ))

              ) : (

                <div className="side-breaking">

                  <p>
                    தற்போது அவசர செய்திகள் இல்லை.
                  </p>

                </div>

              )}

            </div>

          </aside>

        </section>

        {/* ====================================
            E-PAPER
        ==================================== */}

        <section className="epaper">

          <div>

            <div className="category">
              E-PAPER
            </div>

            <h2>
              இன்றைய எங்கள் தேசம்
            </h2>

            <p>
              முழுமையான நாளிதழ் பதிப்பை வாசிக்க
              Subscriber Login செய்யவும்.
            </p>

          </div>

          <Link href="/login">
            Login to Read →
          </Link>

        </section>

      </div>

      {/* ======================================
          FOOTER
      ====================================== */}

      <footer className="footer">

        <div className="footer-inner">

          <div>

            <div className="footer-logo">
              எங்கள் தேசம்
            </div>

            <p>
              Tamil Digital Newspaper
            </p>

          </div>

          <div>

            <h3>
              பிரிவுகள்
            </h3>

            <p>
              தமிழ்நாடு • இந்தியா • உலகம் • வணிகம் • விளையாட்டு
            </p>

          </div>

          <div>

            <h3>
              தொடர்பு
            </h3>

            <p>
              எங்களை தொடர்பு கொள்ள
            </p>

          </div>

        </div>

        <div className="copyright">
          © 2026 Engal Dhesam. All Rights Reserved.
        </div>

      </footer>

      {/* ======================================
          FLOATING AD
      ====================================== */}

      <div className="floating-ad">

        <button aria-label="Close">
          ×
        </button>

        <span>
          ADVERTISEMENT
        </span>

        <strong>
          உங்கள் விளம்பரம் இங்கே
        </strong>

      </div>

    </main>
  );
}