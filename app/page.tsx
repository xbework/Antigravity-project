import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getRoleRedirect, type Role } from '@/lib/roles';
import styles from './page.module.css';

export default async function LandingPage() {
  const session = await auth();
  const userRole = (session?.user as { role?: Role })?.role ?? 'student';
  const dashboardHref = getRoleRedirect(userRole);

  return (
    <div className={styles.wrapper}>
      <Header />
      
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBg}>
          <div className={styles.orb1} />
          <div className={styles.orb2} />
        </div>
        <div className="container">
          <div className={styles.heroContent}>
            <div className="badge badge-purple animate-fade">✦ NEW: MASTER AI & DESIGN 2024</div>
            <h1 className={`${styles.heroTitle} animate-fade-delay-1`}>
              Elevate Your Future with <br />
              <span className="gradient-text">Xbe Academy</span>
            </h1>
            <p className={`${styles.heroSubtitle} animate-fade-delay-2`}>
              Experience a premium learning environment designed for the elite. 
              Join the next generation of industry leaders with our world-class curriculum.
            </p>
            <div className={`${styles.heroCtas} animate-fade-delay-3`}>
              {!session ? (
                <>
                  <Link href="/login?type=signup" className="btn-gradient" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>
                    Start Free Trial
                  </Link>
                  <Link href="/login" className="btn-outline" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>
                    Student Login
                  </Link>
                </>
              ) : (
                <Link href={dashboardHref} className="btn-gradient" style={{ padding: '1rem 3rem', fontSize: '1.1rem' }}>
                  Go to Dashboard →
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={styles.statsSection}>
        <div className="container">
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <h3>15K+</h3>
              <p>Active Students</p>
            </div>
            <div className={styles.statItem}>
              <h3>98%</h3>
              <p>Success Rate</p>
            </div>
            <div className={styles.statItem}>
              <h3>50+</h3>
              <p>Premium Courses</p>
            </div>
            <div className={styles.statItem}>
              <h3>24/7</h3>
              <p>Expert Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="section-padding">
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Why Choose <span className="gradient-text">Xbe Academy</span>?</h2>
            <p className={styles.sectionSubtitle}>We provide the tools, mentorship, and community you need to excel in your career.</p>
          </div>
          
          <div className={styles.featuresGrid}>
            {[
              { icon: '💎', title: 'Premium Curriculum', desc: 'Individually crafted courses by industry experts with a focus on practical application.' },
              { icon: '🤝', title: '1-on-1 Mentorship', desc: 'Get direct feedback and career guidance from professionals who have been in your shoes.' },
              { icon: '🚀', title: 'Accelerated Growth', desc: 'Learn complex skills in half the time through our optimized pedagogical frameworks.' },
              { icon: '🌍', title: 'Global Community', desc: 'Connect with a diverse network of ambitious learners and alumni worldwide.' },
              { icon: '🛠️', title: 'Real-world Projects', desc: 'Build a stunning portfolio by shipping real projects instead of just watching videos.' },
              { icon: '📊', title: 'Role-based Learning', desc: 'Personalized dashboards and learning paths tailored to your specific goals.' },
            ].map((f, i) => (
              <div key={i} className="glass-card" style={{ padding: '2.5rem' }}>
                <div className={styles.featureIcon}>{f.icon}</div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner - Only for Students/Visitors */}
      {!(userRole === 'admin' || userRole === 'master' || userRole === 'staff') && (
        <section className={styles.ctaBanner}>
          <div className="container">
            <div className={styles.ctaContent + " glass"}>
              <h2>Ready to transform your life?</h2>
              <p>Join Xbe Academy today and unlock your true potential.</p>
              <Link href="/login?type=signup" className="btn-gradient" style={{ padding: '1.25rem 3rem' }}>
                Create My Free Account
              </Link>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
