'use client';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function FreeTrialPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session?.user && (session.user as any).isNewUser) {
      router.push('/freetrial/onboarding');
    }
  }, [session, router]);

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <Header />
      
      <main className="container section-padding" style={{ paddingTop: '120px' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '1rem', fontFamily: 'Outfit' }}>
            {session ? 'Welcome to Your ' : 'Unlock Your '}
            <span className="gradient-text">Free Trial</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
            {session 
              ? `Glad to have you here, ${session.user?.name}! Your premium access is now active.`
              : 'Sign in with Google to get instant 7-day access to our primary and high-school tuition modules.'}
          </p>
        </div>

        {status === 'loading' ? (
          <div style={{ textAlign: 'center', padding: '100px' }}>
             <p className="animate-fade">Checking your access...</p>
          </div>
        ) : !session ? (
          /* Locked State */
          <div className="glass-card animate-fade" style={{ maxWidth: '600px', margin: '0 auto', padding: '4rem 2rem', textAlign: 'center', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🔒</div>
            <h2 style={{ marginBottom: '1.5rem', fontFamily: 'Outfit' }}>Access Restricted</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
              Please sign in with your Google account to unlock the Free Trial content. 
              No credit card required.
            </p>
            <button 
              onClick={() => signIn('google')}
              className="btn-gradient" 
              style={{ padding: '1rem 3rem', fontSize: '1.1rem' }}
            >
              Sign in with Google
            </button>
            <p style={{ marginTop: '2rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Already have a student account? <Link href="/login" style={{ color: 'var(--primary)' }}>Login here</Link>
            </p>
          </div>
        ) : (
          /* Unlocked State */
          <div className="animate-fade">
            <div className="badge badge-green" style={{ marginBottom: '2rem', marginLeft: 'auto', marginRight: 'auto', display: 'flex', width: 'fit-content' }}>
              Trial Active: 7 Days Remaining
            </div>
            
            {/* School Tuition Section - PRIMARY */}
            <div className="glass-card" style={{ padding: '3rem', marginBottom: '3rem', border: '1px solid var(--primary-light)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '3rem', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', fontFamily: 'Outfit' }}>School <span className="gradient-text">Tuition</span></h2>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.1rem' }}>
                    Comprehensive learning modules for students from 5th to 12th standard. 
                    Master complex concepts with our top-tier educators.
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                    {['Maths', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English', 'Hindi'].map(sm => (
                      <div key={sm} className="badge badge-purple" style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}>{sm}</div>
                    ))}
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '20px', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem' }}>
                  📚
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              {[
                { title: 'Intro to High-End UI Design', duration: '45 mins', image: '🎨' },
                { title: 'Modern Web Architecture', duration: '1h 20m', image: '🏗️' },
                { title: 'Next.js 14 Deep Dive', duration: '2h 15m', image: '🚀' },
              ].map((video, i) => (
                <div key={i} className="glass-card" style={{ overflow: 'hidden', padding: '0' }}>
                  <div style={{ height: '180px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>
                    {video.image}
                  </div>
                  <div style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', fontFamily: 'Outfit' }}>{video.title}</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{video.duration}</span>
                      <button className="btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>Watch Now</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="glass-card" style={{ marginTop: '4rem', padding: '3rem', textAlign: 'center', background: 'var(--gradient-glow)' }}>
              <h2 style={{ fontFamily: 'Outfit', marginBottom: '1rem' }}>Ready for a full transformation?</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Upgrade to a full student account to get 1-on-1 mentorship and official certificates.</p>
              <button className="btn-gradient" style={{ padding: '1rem 3rem' }}>View Membership Plans</button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
