'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { getRoleRedirect, type Role } from '@/lib/roles';
import styles from './Header.module.css';

export default function Header() {
  const { data: session } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const dashboardHref = session?.user
    ? getRoleRedirect((session.user as { role?: Role }).role ?? 'student')
    : '/login';

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.container}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <Image src="/logo.png" alt="Xbe Academy" width={36} height={36} priority />
          <span className={styles.logoText}>
            Xbe <span className="gradient-text">Academy</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className={styles.nav}>
          <Link href="/#features" className={styles.navLink}>Features</Link>
          <Link href="/#courses" className={styles.navLink}>Courses</Link>
          <Link href="/#testimonials" className={styles.navLink}>Testimonials</Link>
          <Link href="/#pricing" className={styles.navLink}>Pricing</Link>
        </nav>

        {/* CTA Buttons */}
        <div className={styles.actions}>
          {session ? (
            <>
              <Link href={dashboardHref} className="btn-gradient">
                Dashboard
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="btn-outline"
                style={{ padding: '0.6rem 1.25rem', fontSize: '0.875rem' }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-outline" style={{ padding: '0.6rem 1.25rem', fontSize: '0.875rem' }}>
                Login
              </Link>
              <Link href="/login?type=signup" className="btn-gradient">
                Free Trial ✦
              </Link>
            </>
          )}
        </div>

        {/* Mobile Burger */}
        <button
          className={styles.burger}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className={menuOpen ? styles.burgerLineOpen : styles.burgerLine} />
          <span className={menuOpen ? styles.burgerLineMid : styles.burgerLine} />
          <span className={menuOpen ? styles.burgerLineOpen : styles.burgerLine} />
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          <Link href="/#features" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Features</Link>
          <Link href="/#courses" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Courses</Link>
          <Link href="/#testimonials" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Testimonials</Link>
          <Link href="/#pricing" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Pricing</Link>
          <div className={styles.mobileCtas}>
            <Link href="/login" className="btn-outline" onClick={() => setMenuOpen(false)}>Login</Link>
            <Link href="/login?type=signup" className="btn-gradient" onClick={() => setMenuOpen(false)}>Free Trial ✦</Link>
          </div>
        </div>
      )}
    </header>
  );
}
