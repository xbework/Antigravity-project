import Image from 'next/image';
import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="gradient-divider" />
      <div className={styles.container}>
        <div className={styles.brand}>
          <Link href="/" className={styles.logo}>
            <Image src="/logo.png" alt="Xbe Academy" width={32} height={32} />
            <span className={styles.logoText}>Xbe <span className="gradient-text">Academy</span></span>
          </Link>
          <p className={styles.tagline}>
            Elevating careers through premium education. Join thousands of learners transforming their futures.
          </p>
        </div>

        <div className={styles.links}>
          <div className={styles.col}>
            <h4 className={styles.colTitle}>Platform</h4>
            <Link href="/#features" className={styles.link}>Features</Link>
            <Link href="/#courses" className={styles.link}>Courses</Link>
            <Link href="/#pricing" className={styles.link}>Pricing</Link>
            <Link href="/freetrial" className={styles.link}>Free Trial</Link>
          </div>
          <div className={styles.col}>
            <h4 className={styles.colTitle}>Access</h4>
            <Link href="/login" className={styles.link}>Login</Link>
            <Link href="/admin/dashboard" className={styles.link}>Admin Portal</Link>
            <Link href="/manager/dashboard" className={styles.link}>Manager Portal</Link>
            <Link href="/student/dashboard" className={styles.link}>Student Portal</Link>
          </div>
          <div className={styles.col}>
            <h4 className={styles.colTitle}>Contact</h4>
            <a href="mailto:hello@xbe.academy" className={styles.link}>hello@xbe.academy</a>
            <a href="tel:+1234567890" className={styles.link}>+1 (234) 567-890</a>
            <span className={styles.link}>Mon–Fri, 9am–6pm</span>
          </div>
        </div>
      </div>
      <div className={styles.bottom}>
        <p>© {new Date().getFullYear()} Xbe Academy. All rights reserved.</p>
        <div className={styles.bottomLinks}>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}
