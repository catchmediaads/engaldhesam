import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
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
      {/* ==========================================
          COMMON SITE HEADER
          ========================================== */}

      <SiteHeader />

      {/* ==========================================
          CONTENT
          ========================================== */}

      <div className="container">
        <div className="article-breadcrumb">
          <Link href="/">முகப்பு</Link>

          <span>›</span>

          <span>மாவட்டங்கள்</span>
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

        {/* ==========================================
            DISTRICT GRID
            ========================================== */}

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
                    {district.state_name || "Tamil Nadu"}
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

      {/* ==========================================
          FOOTER
          ========================================== */}

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