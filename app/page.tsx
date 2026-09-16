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

const latestNews = [
  {
    category: "தமிழ்நாடு",
    title: "தமிழ்நாட்டில் புதிய வளர்ச்சி திட்டங்கள் குறித்து முக்கிய அறிவிப்பு",
    time: "10 நிமிடங்களுக்கு முன்",
  },
  {
    category: "இந்தியா",
    title: "நாட்டின் பொருளாதார வளர்ச்சி தொடர்பாக புதிய தகவல்கள் வெளியீடு",
    time: "25 நிமிடங்களுக்கு முன்",
  },
  {
    category: "வணிகம்",
    title: "சந்தையில் இன்று கவனம் பெற்ற முக்கிய மாற்றங்கள்",
    time: "40 நிமிடங்களுக்கு முன்",
  },
  {
    category: "விளையாட்டு",
    title: "முக்கிய போட்டிக்கான அணிகள் தீவிர தயாரிப்பு",
    time: "1 மணி நேரத்திற்கு முன்",
  },
  {
    category: "தொழில்நுட்பம்",
    title: "புதிய AI தொழில்நுட்பம் குறித்து எதிர்பார்ப்பு அதிகரிப்பு",
    time: "1 மணி நேரத்திற்கு முன்",
  },
];

const districtNews = [
  "தூத்துக்குடியில் புதிய திட்டப் பணிகள் தொடக்கம்",
  "திருநெல்வேலியில் மக்கள் பயன்பாட்டுக்கான புதிய வசதி",
  "மதுரையில் முக்கிய நிர்வாக நடவடிக்கை",
  "கோயம்புத்தூரில் தொழில் துறை தொடர்பான புதிய அறிவிப்பு",
  "சென்னையில் போக்குவரத்து தொடர்பான முக்கிய தகவல்",
];

export default function Home() {
  return (
    <main className="site">
      {/* HEADER */}
      <header className="header">
        <div className="header-inner">
          <div className="brand">
            <div className="brand-tamil">எங்கள் தேசம்</div>
            <div className="brand-english">ENGAL DHESAM • TAMIL DIGITAL NEWSPAPER</div>
          </div>

          <div className="header-actions">
            <button>⌕ <span>தேடல்</span></button>
            <button>▣ <span>E-Paper</span></button>
            <button>◉ <span>Login</span></button>
          </div>
        </div>
      </header>

      {/* NAVIGATION */}
      <nav className="navigation">
        <div className="nav-inner">
          {sections.map((section) => (
            <a href="#" key={section}>
              {section}
            </a>
          ))}
        </div>
      </nav>

      {/* BREAKING NEWS */}
      <section className="breaking">
        <div className="breaking-label">BREAKING</div>
        <div className="breaking-text">
          முக்கிய செய்திகள் மற்றும் உடனடி தகவல்கள் — எங்கள் தேசம் நேரலை
          செய்தி புதுப்பிப்புகள்
        </div>
      </section>

      {/* MAIN CONTENT */}
      <div className="container">

        {/* HERO */}
        <section className="hero-grid">
          <article className="hero-main">
            <div className="image-placeholder">
              <span>முக்கிய செய்தி படம்</span>
            </div>

            <div className="hero-content">
              <div className="category">தமிழ்நாடு</div>

              <h1>
                தமிழ்நாட்டின் முக்கிய செய்திகளை உடனுக்குடன் தெரிந்து கொள்ளுங்கள்
              </h1>

              <p>
                மாநிலத்தின் முக்கிய நிகழ்வுகள், நிர்வாக அறிவிப்புகள் மற்றும்
                மக்கள் தொடர்பான செய்திகளை விரிவாக அறியுங்கள்.
              </p>

              <div className="meta">இன்று • காலை 10:30</div>
            </div>
          </article>

          <div className="hero-side">
            <article className="small-card">
              <div className="small-image">செய்தி படம்</div>
              <div>
                <div className="category">இந்தியா</div>
                <h2>நாட்டின் முக்கிய நிகழ்வுகள் குறித்து புதிய தகவல்கள்</h2>
                <div className="meta">30 நிமிடங்களுக்கு முன்</div>
              </div>
            </article>

            <article className="small-card">
              <div className="small-image">செய்தி படம்</div>
              <div>
                <div className="category">உலகம்</div>
                <h2>உலகளவில் கவனம் பெற்ற முக்கிய செய்தி</h2>
                <div className="meta">45 நிமிடங்களுக்கு முன்</div>
              </div>
            </article>

            <article className="small-card">
              <div className="small-image">செய்தி படம்</div>
              <div>
                <div className="category">தொழில்நுட்பம்</div>
                <h2>புதிய தொழில்நுட்ப வளர்ச்சி குறித்து அறிவிப்பு</h2>
                <div className="meta">1 மணி நேரத்திற்கு முன்</div>
              </div>
            </article>
          </div>
        </section>

        {/* CONTENT + SIDEBAR */}
        <section className="content-layout">

          {/* LEFT */}
          <div className="main-column">

            <div className="section-heading">
              <h2>சமீபத்திய செய்திகள்</h2>
              <a href="#">அனைத்தையும் காண்க →</a>
            </div>

            <div className="news-list">
              {latestNews.map((news, index) => (
                <article className="news-item" key={index}>
                  <div className="news-image">படம்</div>

                  <div className="news-info">
                    <div className="category">{news.category}</div>
                    <h3>{news.title}</h3>
                    <div className="meta">{news.time}</div>
                  </div>
                </article>
              ))}
            </div>

            {/* DISTRICTS */}
            <div className="section-heading district-heading">
              <h2>மாவட்ட செய்திகள்</h2>
              <a href="#">அனைத்து மாவட்டங்கள் →</a>
            </div>

            <div className="district-grid">
              {districtNews.map((news, index) => (
                <article className="district-card" key={index}>
                  <div className="district-image">படம்</div>
                  <div className="category">மாவட்டம்</div>
                  <h3>{news}</h3>
                  <div className="meta">இன்று</div>
                </article>
              ))}
            </div>

          </div>

          {/* SIDEBAR */}
          <aside className="sidebar">

            <div className="sidebar-box">
              <h2>அதிகம் படிக்கப்பட்டவை</h2>

              {[1, 2, 3, 4, 5].map((number) => (
                <div className="most-read" key={number}>
                  <div className="number">{number}</div>
                  <div>
                    <h3>இன்றைய முக்கிய செய்திகளில் வாசகர்கள் கவனம்</h3>
                    <span>2.4K வாசிப்புகள்</span>
                  </div>
                </div>
              ))}
            </div>

            {/* AD */}
            <div className="ad-box">
              <span>ADVERTISEMENT</span>
              <strong>300 × 250</strong>
            </div>

            {/* SIDEBAR BREAKING */}
            <div className="sidebar-box">
              <h2>அவசர செய்திகள்</h2>

              <div className="side-breaking">
                <span>12:15 PM</span>
                <p>முக்கிய அறிவிப்பு தொடர்பான புதிய தகவல்</p>
              </div>

              <div className="side-breaking">
                <span>11:50 AM</span>
                <p>மாவட்ட நிர்வாகம் வெளியிட்ட தகவல்</p>
              </div>

              <div className="side-breaking">
                <span>11:20 AM</span>
                <p>மக்கள் தொடர்பான முக்கிய செய்தி</p>
              </div>
            </div>

          </aside>
        </section>

        {/* E-PAPER */}
        <section className="epaper">
          <div>
            <div className="category">E-PAPER</div>
            <h2>இன்றைய எங்கள் தேசம்</h2>
            <p>
              முழுமையான நாளிதழ் பதிப்பை வாசிக்க Subscriber Login செய்யவும்.
            </p>
          </div>

          <button>Login to Read →</button>
        </section>

      </div>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <div>
            <div className="footer-logo">எங்கள் தேசம்</div>
            <p>Tamil Digital Newspaper</p>
          </div>

          <div>
            <h3>பிரிவுகள்</h3>
            <p>தமிழ்நாடு • இந்தியா • உலகம் • வணிகம் • விளையாட்டு</p>
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

      {/* FLOATING AD */}
      <div className="floating-ad">
        <button aria-label="Close">×</button>
        <span>ADVERTISEMENT</span>
        <strong>உங்கள் விளம்பரம் இங்கே</strong>
      </div>
    </main>
  );
}