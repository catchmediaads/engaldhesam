import { notFound } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatTamilDate(dateString: string) {
  return new Intl.DateTimeFormat("ta-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateString));
}

export default async function NewsArticlePage({ params }: PageProps) {
  const { id } = await params;

  /*
   * 1. Load published article
   */
  const { data: article, error: articleError } = await supabase
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
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (articleError || !article) {
    notFound();
  }

  /*
   * 2. Load the published Tamil translation directly.
   *
   * We intentionally do not query the languages table here because
   * the public page does not need it and the languages table may have
   * stricter RLS for anonymous visitors.
   */
  const { data: translations, error: translationError } = await supabase
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
        status
      `
    )
    .eq("article_id", article.id)
    .eq("status", "published")
    .limit(10);

  const translation = translations?.[0] || null;

  if (translationError || !translation) {
    notFound();
  }

  /*
   * 3. Category
   */
  const { data: category } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("id", article.category_id)
    .maybeSingle();

  /*
   * 4. District
   */
  const { data: district } = await supabase
    .from("districts")
    .select("id, name, slug")
    .eq("id", article.district_id)
    .maybeSingle();

  /*
   * 5. Featured media
   */
  const { data: articleMedia } = await supabase
    .from("article_media")
    .select("article_id, media_id, media_role, sort_order")
    .eq("article_id", article.id)
    .eq("media_role", "featured")
    .order("sort_order", { ascending: true })
    .limit(1);

  let featuredMedia: {
    file_url: string | null;
    alt_text: string | null;
    caption: string | null;
  } | null = null;

  const mediaId = articleMedia?.[0]?.media_id;

  if (mediaId) {
    const { data: media } = await supabase
      .from("media")
      .select("file_url, alt_text, caption")
      .eq("id", mediaId)
      .eq("is_active", true)
      .maybeSingle();

    featuredMedia = media;
  }

  const publishedAt = article.published_at || article.created_at;

  return (
    <main className="site">
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

      <nav className="navigation">
        <div className="nav-inner">
          <Link href="/">முகப்பு</Link>
          <Link href="#">தமிழ்நாடு</Link>
          <Link href="#">மாவட்டங்கள்</Link>
          <Link href="#">இந்தியா</Link>
          <Link href="#">உலகம்</Link>
          <Link href="#">அரசியல்</Link>
          <Link href="#">வணிகம்</Link>
          <Link href="#">விளையாட்டு</Link>
          <Link href="#">சினிமா</Link>
          <Link href="#">தொழில்நுட்பம்</Link>
          <Link href="#">விவசாயம்</Link>
          <Link href="#">கல்வி</Link>
          <Link href="#">வாழ்க்கை</Link>
          <Link href="#">சிறப்பு</Link>
        </div>
      </nav>

      <div className="container">
        <div className="article-breadcrumb">
          <Link href="/">முகப்பு</Link>
          <span>›</span>
          <span>{category?.name || "செய்திகள்"}</span>
        </div>

        <article className="full-news-article">
          <div className="category">
            {category?.name || "செய்திகள்"}
            {district?.name ? ` • ${district.name}` : ""}
          </div>

          {article.breaking_news && (
            <div className="article-breaking-label">
              BREAKING
            </div>
          )}

          <h1>{translation.title}</h1>

          {translation.subtitle && (
            <p className="article-subtitle">
              {translation.subtitle}
            </p>
          )}

          <div className="article-meta">
            வெளியிடப்பட்டது: {formatTamilDate(publishedAt)}
          </div>

          {featuredMedia?.file_url ? (
            <figure className="article-featured-image">
              <img
                src={featuredMedia.file_url}
                alt={featuredMedia.alt_text || translation.title}
              />

              {featuredMedia.caption && (
                <figcaption>
                  {featuredMedia.caption}
                </figcaption>
              )}
            </figure>
          ) : null}

          <div className="article-content">
            {(translation.content || "")
              .split(/\n+/)
              .filter((paragraph: string) => paragraph.trim())
              .map((paragraph: string, index: number) => (
                <p key={index}>{paragraph}</p>
              ))}
          </div>

          <div className="article-share">
            <strong>இந்த செய்தியை பகிரவும்</strong>

            <div className="article-share-buttons">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  translation.title
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>

              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                  `/news/${article.id}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Facebook
              </a>

              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                  translation.title
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                X
              </a>
            </div>
          </div>
        </article>

        <div className="article-back">
          <Link href="/">
            ← முகப்புக்கு திரும்ப
          </Link>
        </div>
      </div>

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

/*
 * SEO metadata
 */
export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;

  const { data: article } = await supabase
    .from("articles")
    .select("id, status")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (!article) {
    return {
      title: "செய்தி | எங்கள் தேசம்",
      description: "எங்கள் தேசம் தமிழ் டிஜிட்டல் நாளிதழ்",
    };
  }

  const { data: translations } = await supabase
    .from("article_translations")
    .select("title, seo_title, seo_description")
    .eq("article_id", id)
    .eq("status", "published")
    .limit(1);

  const translation = translations?.[0] || null;

  return {
    title:
      translation?.seo_title ||
      translation?.title ||
      "செய்தி | எங்கள் தேசம்",
    description:
      translation?.seo_description ||
      translation?.title ||
      "எங்கள் தேசம் தமிழ் டிஜிட்டல் நாளிதழ்",
  };
}
