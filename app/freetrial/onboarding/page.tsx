'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import styles from './onboarding.module.css';

export default function OnboardingPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: '',
    standard: '10th',
  });

  useEffect(() => {
    if (session?.user?.name && !formData.name) {
      setFormData(prev => ({ ...prev, name: session.user?.name || '' }));
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // In a real app, this would be an API call. 
      // For this demo, we'll use a fetch to a mock API route we'll create
      // or just simulate the delay and store it in the client-side session if needed.
      // But since we want it in the Manager Dashboard, let's create a small API route.
      
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          email: session?.user?.email
        }),
      });

      if (res.ok) {
        // Force the NextAuth session to re-run the JWT callback
        await update();
        // Redirect and refresh
        router.push('/freetrial?refresh=' + Date.now());
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <Header />
      <main className="container section-padding" style={{ paddingTop: '120px' }}>
        <div className={styles.card + " glass-card animate-fade"}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div className="badge badge-cyan" style={{ marginBottom: '1rem' }}>STEP 2: CUSTOMIZE YOUR EXPERIENCE</div>
            <h1 style={{ fontFamily: 'Outfit', fontSize: '2rem', marginBottom: '0.5rem' }}>Welcome to Xbe Academy</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Help us tailor your free trial by providing a few details.</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                className="form-input"
                placeholder="+91 XXXXX XXXXX"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label className="form-label">Location (City)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Bangalore, Kochi"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label className="form-label">Academic Standard</label>
              <select
                className="form-input"
                value={formData.standard}
                onChange={(e) => setFormData({ ...formData, standard: e.target.value })}
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                {['5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'].map(std => <option key={std} value={std}>{std} Standard</option>)}
              </select>
            </div>

            <button type="submit" className="btn-gradient" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }} disabled={loading}>
              {loading ? 'Processing...' : 'Access My Free Trial →'}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
