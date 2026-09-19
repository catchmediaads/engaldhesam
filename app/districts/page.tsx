import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default async function DistrictsPage() {
  const { data: districts, error } = await supabase
    .from("districts")
    .select(
      `
        id,
        name,
        slug,
        state_name,
        is_active,
        sort_order
      `
    )
    .eq("is_active", true)
    .order("sort_order", {
      ascending: true,
    });

  if (error) {
    console.error("Districts loading error:", error);
  }

  return (
    <main className="site">
      {/* HEADER */}
      <header className="header">
        <div className="header-inner">
          <div className="brand">
            <Link href="/" className="news-card-link">
              <div className="brand-tamil">
                எங்கள் தேசம்
              </div>

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
          <Link href="/category/tamil-nadu">
            தமிழ்நாடு
          </Link>
          <Link href="/districts">
            மாவட்டங்கள்
          </Link>
          <Link href="/category/india">
            இந்தியா
          </Link>
          <Link href="/category/world">
            உலகம்
          </Link>
          <Link href="/category/politics">
            அரசியல்
          </Link>
          <Link href="/category/business">
            வணிகம்
          </Link>
          <Link href="/category/sports">
            விளையாட்டு
          </Link>
          <Link href="/category/cinema">
            சினிமா
          </Link>
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

      {/* CONTENT */}
      <div className="container">

        <div className="article-breadcrumb">
          <Link href="/">
            முகப்பு
          </Link>

          <span>›</span>

          <span>
            மாவட்டங்கள்
          </span>
        </div>

        <section className="districts-page-header">

          <div className="category">
            TAMIL NADU DISTRICTS
          </div>

          <h1>
            மாவட்ட செய்திகள்
          </h1>

          <p>
            தமிழ்நாட்டின் அனைத்து மாவட்டங்களிலும்
            வெளியாகும் செய்திகளை மாவட்ட வாரியாக
            அறியுங்கள்.
          </p>

        </section>

        {/* DISTRICT GRID */}

        <section className="districts-page-grid">

          {districts && districts.length > 0 ? (

            districts.map((district) => (

              <Link
                key={district.id}
                href={`/district/${district.slug}`}
                className="district-page-card"
              >

                <div className="district-page-number">
                  {String(
                    district.sort_order || 0
                  ).padStart(2, "0")}
                </div>

                <div className="district-page-content">

                  <h2>
                    {district.name}
                  </h2>

                  <p>
                    {district.state_name ||
                      "Tamil Nadu"}
                  </p>

                </div>

                <div className="district-page-arrow">
                  →
                </div>

              </Link>

            ))

          ) : (

            <div className="districts-empty">

              <h2>
                மாவட்டங்கள் கிடைக்கவில்லை
              </h2>

              <p>
                நிர்வாக பகுதியில் மாவட்டங்களை
                சேர்க்கவும்.
              </p>

            </div>

          )}

        </section>

      </div>

      {/* FOOTER */}

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
              தமிழ்நாடு • இந்தியா • உலகம் •
              வணிகம் • விளையாட்டு
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

    </main>
  );
}