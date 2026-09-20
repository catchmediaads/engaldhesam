import SiteHeader from "@/components/SiteHeader";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";

type District = {
  id: string;
  name: string;
  slug: string;
  state_name: string;
};

type Article = {
  id: string;
  category_id: string | null;
  district_id: string | null;
  article_type: string;
  published_at: string | null;
  featured: boolean;
  breaking_news: boolean;
};

type Translation = {
  article_id: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
};

type Category = {
  id: string;
  name: string;
  slug: string;
};

type Media = {
  id: string;
  file_url: string;
  alt_text: string | null;
};

type ArticleMedia = {
  article_id: string;
  media_id: string;
  media_role: string;
};

type DistrictNews = {
  id: string;
  title: string;
  subtitle: string;
  excerpt: string;
  categoryName: string;
  categorySlug: string;
  imageUrl: string | null;
  publishedAt: string | null;
  breakingNews: boolean;
};

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function DistrictPage({ params }: PageProps) {
  const { slug } = await params;

  // --------------------------------------------------
  // 1. Find district
  // --------------------------------------------------

  const { data: district, error: districtError } = await supabase
    .from("districts")
    .select("id, name, slug, state_name")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (districtError) {
    console.error("District error:", districtError);
    return <DistrictError message="மாவட்டத் தகவலை பெற முடியவில்லை." />;
  }

  if (!district) {
    notFound();
  }

  // --------------------------------------------------
  // 2. Get published articles for this district
  // --------------------------------------------------

  const { data: articles, error: articlesError } = await supabase
    .from("articles")
    .select(
      "id, category_id, district_id, article_type, published_at, featured, breaking_news"
    )
    .eq("district_id", district.id)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(50);

  if (articlesError) {
    console.error("Articles error:", articlesError);
  }

  const publishedArticles = (articles || []) as Article[];

  // --------------------------------------------------
  // 3. Get published Tamil translations
  // --------------------------------------------------

  const articleIds = publishedArticles.map((article) => article.id);

  let translations: Translation[] = [];

  if (articleIds.length > 0) {
    const { data: translationData, error: translationError } =
      await supabase
        .from("article_translations")
        .select("article_id, title, subtitle, excerpt")
        .in("article_id", articleIds)
        .eq("status", "published");

    if (translationError) {
      console.error("Translation error:", translationError);
    }

    translations = (translationData || []) as Translation[];
  }

  // --------------------------------------------------
  // 4. Get categories
  // --------------------------------------------------

  const categoryIds = [
    ...new Set(
      publishedArticles
        .map((article) => article.category_id)
        .filter(Boolean) as string[]
    ),
  ];

  let categories: Category[] = [];

  if (categoryIds.length > 0) {
    const { data: categoryData, error: categoryError } = await supabase
      .from("categories")
      .select("id, name, slug")
      .in("id", categoryIds);

    if (categoryError) {
      console.error("Category error:", categoryError);
    }

    categories = (categoryData || []) as Category[];
  }

  // --------------------------------------------------
  // 5. Get featured media
  // --------------------------------------------------

  let articleMedia: ArticleMedia[] = [];
  let media: Media[] = [];

  if (articleIds.length > 0) {
    const { data: articleMediaData, error: articleMediaError } =
      await supabase
        .from("article_media")
        .select("article_id, media_id, media_role")
        .in("article_id", articleIds)
        .eq("media_role", "featured");

    if (articleMediaError) {
      console.error("Article media error:", articleMediaError);
    }

    articleMedia = (articleMediaData || []) as ArticleMedia[];

    const mediaIds = [
      ...new Set(articleMedia.map((item) => item.media_id)),
    ];

    if (mediaIds.length > 0) {
      const { data: mediaData, error: mediaError } = await supabase
        .from("media")
        .select("id, file_url, alt_text")
        .in("id", mediaIds)
        .eq("is_active", true);

      if (mediaError) {
        console.error("Media error:", mediaError);
      }

      media = (mediaData || []) as Media[];
    }
  }

  // --------------------------------------------------
  // 6. Build news cards
  // --------------------------------------------------

  const news: DistrictNews[] = publishedArticles
    .map((article) => {
      const translation = translations.find(
        (item) => item.article_id === article.id
      );

      if (!translation) {
        return null;
      }

      const category = categories.find(
        (item) => item.id === article.category_id
      );

      const articleMediaItem = articleMedia.find(
        (item) => item.article_id === article.id
      );

      const image = articleMediaItem
        ? media.find((item) => item.id === articleMediaItem.media_id)
        : null;

      return {
        id: article.id,
        title: translation.title,
        subtitle: translation.subtitle || "",
        excerpt: translation.excerpt || translation.subtitle || "",
        categoryName: category?.name || "செய்திகள்",
        categorySlug: category?.slug || "",
        imageUrl: image?.file_url || null,
        publishedAt: article.published_at,
        breakingNews: article.breaking_news,
      };
    })
    .filter(Boolean) as DistrictNews[];

  // --------------------------------------------------
  // 7. Page
  // --------------------------------------------------

  return (
    <main className="district-news-page">
      <header className="site-header">
        <div className="header-inner">
          <Link href="/" className="brand">
            <span className="brand-title">எங்கள் தேசம்</span>
            <span className="brand-subtitle">ENGAL DHESAM</span>
          </Link>

          <div className="header-tools">
            <Link href="/" className="header-tool">
              முகப்பு
            </Link>

            <Link href="/districts" className="header-tool">
              மாவட்டங்கள்
            </Link>

            <Link href="/search" className="header-tool">
              தேடல்
            </Link>
          </div>
        </div>
      </header>

      <nav className="main-nav">
        <div className="main-nav-inner">
          <Link href="/">முகப்பு</Link>
          <Link href="/category/tamil-nadu">தமிழ்நாடு</Link>
          <Link href="/districts">மாவட்டங்கள்</Link>
          <Link href="/category/india">இந்தியா</Link>
          <Link href="/category/world">உலகம்</Link>
          <Link href="/category/politics">அரசியல்</Link>
          <Link href="/category/business">வணிகம்</Link>
          <Link href="/category/sports">விளையாட்டு</Link>
          <Link href="/category/cinema">சினிமா</Link>
          <Link href="/category/technology">தொழில்நுட்பம்</Link>
        </div>
      </nav>

      <div className="district-news-container">
        <div className="district-news-breadcrumb">
          <Link href="/">முகப்பு</Link>
          <span>›</span>
          <Link href="/districts">மாவட்டங்கள்</Link>
          <span>›</span>
          <strong>{district.name}</strong>
        </div>

        <section className="district-news-header">
          <div>
            <span className="district-news-label">மாவட்ட செய்திகள்</span>

            <h1>{district.name}</h1>

            <p>
              {district.name} மாவட்டத்தின் சமீபத்திய செய்திகள், நிகழ்வுகள் மற்றும்
              முக்கிய தகவல்கள்.
            </p>
          </div>

          <Link href="/districts" className="district-back-button">
            ← அனைத்து மாவட்டங்கள்
          </Link>
        </section>

        {news.length === 0 ? (
          <section className="district-empty-state">
            <div className="district-empty-icon">📰</div>

            <h2>இந்த மாவட்டத்திற்கு செய்திகள் இல்லை</h2>

            <p>
              தற்போது {district.name} மாவட்டத்திற்கான வெளியிடப்பட்ட செய்திகள்
              எதுவும் இல்லை.
            </p>

            <Link href="/" className="district-home-button">
              முகப்புப் பக்கத்திற்குச் செல்லுங்கள்
            </Link>
          </section>
        ) : (
          <section className="district-news-grid">
            {news.map((item) => (
              <article key={item.id} className="district-news-card">
                <Link
                  href={`/news/${item.id}`}
                  className="district-news-card-link"
                >
                  <div className="district-news-image">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                      />
                    ) : (
                      <div className="district-news-image-placeholder">
                        <span>எங்கள் தேசம்</span>
                      </div>
                    )}

                    {item.breakingNews && (
                      <span className="district-breaking-badge">
                        BREAKING
                      </span>
                    )}
                  </div>

                  <div className="district-news-card-body">
                    <span className="district-news-category">
                      {item.categoryName}
                    </span>

                    <h2>{item.title}</h2>

                    {item.subtitle && (
                      <p className="district-news-subtitle">
                        {item.subtitle}
                      </p>
                    )}

                    <div className="district-news-meta">
                      <span>
                        {formatDate(item.publishedAt)}
                      </span>

                      <span>→</span>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </section>
        )}
      </div>

      <footer className="site-footer">
        <div className="footer-inner">
          <div>
            <strong>எங்கள் தேசம்</strong>
            <p>ஓர் இனத்தின் பெருங்கனவு</p>
          </div>

          <div className="footer-links">
            <Link href="/">முகப்பு</Link>
            <Link href="/districts">மாவட்டங்கள்</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

// --------------------------------------------------
// Date formatter
// --------------------------------------------------

function formatDate(date: string | null) {
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("ta-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

// --------------------------------------------------
// Error component
// --------------------------------------------------

function DistrictError({ message }: { message: string }) {
  return (
    <main className="district-error-page">
      <div>
        <h1>மாவட்ட செய்திகள்</h1>
        <p>{message}</p>

        <Link href="/districts">
          ← மாவட்டங்கள் பக்கத்திற்குச் செல்லுங்கள்
        </Link>
      </div>
    </main>
  );
}

// --------------------------------------------------
// Metadata
// --------------------------------------------------

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;

  const { data: district } = await supabase
    .from("districts")
    .select("name, state_name")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!district) {
    return {
      title: "மாவட்ட செய்திகள் | எங்கள் தேசம்",
    };
  }

  return {
    title: `${district.name} மாவட்ட செய்திகள் | எங்கள் தேசம்`,
    description: `${district.name} மாவட்டத்தின் சமீபத்திய செய்திகள் மற்றும் முக்கிய தகவல்கள்.`,
  };
}