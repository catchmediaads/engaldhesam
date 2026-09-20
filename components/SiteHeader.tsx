import Link from "next/link";
import UserMenu from "@/components/UserMenu";

const sections = [
  { name: "முகப்பு", href: "/" },
  { name: "தமிழ்நாடு", href: "/category/tamil-nadu" },
  { name: "மாவட்டங்கள்", href: "/districts" },
  { name: "இந்தியா", href: "/category/india" },
  { name: "உலகம்", href: "/category/world" },
  { name: "அரசியல்", href: "/category/politics" },
  { name: "வணிகம்", href: "/category/business" },
  { name: "விளையாட்டு", href: "/category/sports" },
  { name: "சினிமா", href: "/category/cinema" },
  { name: "தொழில்நுட்பம்", href: "/category/technology" },
  { name: "விவசாயம்", href: "/category/agriculture" },
  { name: "கல்வி", href: "/category/education" },
  { name: "வாழ்க்கை", href: "/category/lifestyle" },
  { name: "சிறப்பு", href: "/category/special" },
];

export default function SiteHeader() {
  return (
    <>
      {/* ======================================
          SAME HEADER AS HOME PAGE
      ====================================== */}

      <header className="header">
        <div className="header-inner">

          <div className="brand">
            <Link href="/">
              <img
                src="/images/branding/engal-dhesam-logo-transparent.png"
                alt="எங்கள் தேசம் | ஓர் இனத்தின் பெருங்கனவு"
                className="site-logo"
                style={{
  width: "390px",
  height: "105px",
  objectFit: "contain",
  objectPosition: "left center",
  display: "block",
}}
              />
            </Link>
          </div>

          <div className="header-actions">

            <Link href="/search">
              ⌕ <span>தேடல்</span>
            </Link>

            <Link href="/epaper">
              ▣ <span>E-Paper</span>
            </Link>

            <UserMenu />

          </div>
        </div>
      </header>

      {/* ======================================
          SAME MENU AS HOME PAGE
      ====================================== */}

      <nav className="navigation">
        <div className="nav-inner">

          {sections.map((section) => (
            <Link
              href={section.href}
              key={section.href}
            >
              {section.name}
            </Link>
          ))}

        </div>
      </nav>

      {/* ======================================
          SAME BREAKING NEWS BAR AS HOME PAGE
      ====================================== */}

      <section className="breaking">

        <div className="breaking-label">
          BREAKING
        </div>

        <div className="breaking-text">
          முக்கிய செய்திகள் மற்றும் உடனடி தகவல்கள் — எங்கள் தேசம் நேரலை செய்தி புதுப்பிப்புகள்
        </div>

      </section>
    </>
  );
}
