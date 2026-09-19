import { notFound } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;

  // Find the category
  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id, name, slug, description, is_active")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (categoryError || !category) {
    notFound();
  }

  // Get published articles from this category
  const { data: articles, error: articlesError } = await supabase
    .from("articles")
    .select(
      `
        id,
        category_id,
        district_id,
        status,
        article_type,
        breaking_news,
        published_at,
        created_at
      `
    )
    .eq("category_id", category.id)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(30);

  if (articlesError) {
    console.error("Category articles error:", articlesError);
  }

  const articleList = articles || [];

  // Get published Tamil translations
  const articleIds = articleList.map((article) => article.id);

  let translations: any[] = [];

  if (articleIds.length > 0) {
    const { data } = await supabase
      .from("article_translations")
      .select(
        `
          id,
          article_id,
          title,
          subtitle,
          excerpt,
          content,
          status
        `
      )
      .in("article_id", articleIds)
      .eq("status", "published");

    translations = data || [];
  }

  // Get featured media
  let articleMedia: any[] = [];

  if (articleIds.length > 0) {
    const { data } = await supabase
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
      .eq("media_role", "featured")
      .order("sort_order", { ascending: true });

    articleMedia = data || [];
  }

  const mediaIds = articleMedia.map((item) => item.media_id);

  let media: any[] = [];

  if (mediaIds.length > 0) {
    const { data } = await supabase
      .from("media")
      .select(
        `
          id,
          file_url,
          alt_text,
          caption
        `
      )
      .in("id", mediaIds)
      .eq("is_active", true);

    media = data || [];
  }

  const getTranslation = (articleId: string) =>
    translations.find(
      (translation) => translation.article_id === articleId
    );

  const getMedia = (articleId: string) => {
    const relation = articleMedia.find(
      (item) => item.article_id === articleId
    );

    if (!relation) return null;

    return media.find((item) => item.id === relation.media_id);
  };

  return (
    <main className="site">
      {/* HEADER */}
      <header className="header">
        <div className="header-inner">
          <div className="brand">
            <Link href="/" className="news-card-link">
              <div className="brand-tamil">எங்கள் தேசம்</div>
              <div className="brand-english">
                ENGAL DHESAM • TAMIL DIGITAL NEWSPAPER
              </div>
            </Link>
          </div>

          <div className="header-actions">
            <Link href="/">
              ⌂ <span>முகப்பு</span>
            </Link>

            <Link href="/login">
              ◉ <span>Login</span>
            </Link>
          </div>
        </div>
      </header>

      {/* NAVIGATION */}
      <nav className="navigation">
        <div className="nav-inner">
          <Link href="/">முகப்பு</Link>
          <Link href="/category/tamil-nadu">தமிழ்நாடு</Link>
          <Link href="/districts">மாவட்டங்கள்</Link>
          <Link href="/category/india">இந்தியா</Link>
          <Link href="/category/world">உலகம்</Link>
          <Link href="/category/politics">அரசியல்</Link>
          <Link href="/category/business">வணிகம்</Link>
          <Link href="/category/sports">விளையாட்டு</Link>
          <Link href="/category/cinema">சினிமா</Link>
          <Link href="/category/technology">
            தொழில்நுட்பம்
          </Link>
          <Link href="/category/agriculture">
            விவசாயம்
          </Link>
          <Link href="/category/education">
            கல்வி
          </Link>
          <Link href="/category/lifestyle">
            வாழ்க்கை
          </Link>
          <Link href="/category/special">
            சிறப்பு
          </Link>
        </div>
      </nav>

      {/* MAIN */}
      <div className="container">
        <div className="article-breadcrumb">
          <Link href="/">முகப்பு</Link>
          <span>›</span>
          <span>{category.name}</span>
        </div>

        <section className="category-page-header">
          <div className="category">NEWS CATEGORY</div>

          <h1>{category.name}</h1>

          {category.description && (
            <p>{category.description}</p>
          )}
        </section>

        {articleList.length === 0 ? (
          <div className="category-empty">
            <h2>இந்த பிரிவில் தற்போது செய்திகள் இல்லை.</h2>
            <p>புதிய செய்திகள் வெளியிடப்பட்டவுடன் இங்கு தோன்றும்.</p>
          </div>
        ) : (
          <section className="category-news-grid">
            {articleList.map((article) => {
              const translation = getTranslation(article.id);
              const featuredMedia = getMedia(article.id);

              if (!translation) {
                return null;
              }

              return (
                <Link
                  key={article.id}
                  href={`/news/${article.id}`}
                  className="category-news-card"
                >
                  <div className="category-news-image">
                    {featuredMedia?.file_url ? (
                      <img
                        src={featuredMedia.file_url}
                        alt={
                          featuredMedia.alt_text ||
                          translation.title
                        }
                      />
                    ) : (
                      <span>செய்தி படம்</span>
                    )}
                  </div>

                  <div className="category-news-content">
                    <div className="category">
                      {category.name}
                    </div>

                    {article.breaking_news && (
                      <span className="category-breaking">
                        BREAKING
                      </span>
                    )}

                    <h2>{translation.title}</h2>

                    {translation.subtitle && (
                      <p>{translation.subtitle}</p>
                    )}

                    <div className="meta">
                      {article.published_at
                        ? new Intl.DateTimeFormat("ta-IN", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          }).format(
                            new Date(article.published_at)
                          )
                        : "வெளியிடப்பட்டது"}
                    </div>
                  </div>
                </Link>
              );
            })}
          </section>
        )}
      </div>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <div>
            <div className="footer-logo">
              எங்கள் தேசம்
            </div>
            <p>Tamil Digital Newspaper</p>
          </div>

          <div>
            <h3>பிரிவுகள்</h3>
            <p>
              தமிழ்நாடு • இந்தியா • உலகம் • வணிகம் • விளையாட்டு
            </p>
          </div>

          <div>
            <h3>தொடர்பு</h3>
            <p>எங்களை தொடர்பு கொள்ள</p>
          </div>
        </div>

        <div className="copyright">
          © 2026 Engal Dhesam. All Rights Reserved.
        </div>
      </footer>
    </main>
  );
}

export async function generateMetadata({
  params,
}: PageProps) {
  const { slug } = await params;

  const { data: category } = await supabase
    .from("categories")
    .select("name, description")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  return {
    title: category
      ? `${category.name} | எங்கள் தேசம்`
      : "செய்திகள் | எங்கள் தேசம்",

    description:
      category?.description ||
      `எங்கள் தேசம் - ${category?.name || "செய்திகள்"}`,
  };
}