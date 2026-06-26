'use client';
import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import styles from './login.module.css';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isSignup = searchParams.get('type') === 'signup';
  const apiError = searchParams.get('error');

  useEffect(() => {
    if (apiError === 'EmailAlreadyRegistered') {
      setError('This email is already registered as a student or staff member. Please use the login form instead.');
    }
  }, [apiError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError('Invalid credentials. Please try again.');
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <Link href="/" className={styles.backBtn}>
        ← Back to Home
      </Link>
      
      <div className={styles.card + " glass-card animate-fade"}>
        <div className={styles.header}>
          <Image src="/logo.png" alt="Xbe Academy" width={48} height={48} />
          <h1>{isSignup ? 'Start Your Trial' : 'Welcome Back'}</h1>
          <p>{isSignup ? 'Sign up with Google for instant access' : 'Login to your Xbe Academy account'}</p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {!isSignup && (
          <>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn-gradient" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }} disabled={loading}>
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            <div className={styles.divider}>
              <span>OR CONTINUE WITH</span>
            </div>
          </>
        )}

        <button 
          onClick={() => signIn('google', { callbackUrl: '/freetrial' })}
          className="btn-outline" 
          style={{ width: '100%', justifyContent: 'center', marginTop: isSignup ? '1rem' : '0' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: '8px' }}>
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Signup with Google
        </button>

        <div className={styles.footer}>
          {isSignup ? (
            <>Already have a student account? <Link href="/login">Login here</Link></>
          ) : (
            <>Don't have an account? <Link href="/login?type=signup">Start a Free Trial</Link></>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
