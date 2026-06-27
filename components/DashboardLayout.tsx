import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { ROLE_LABELS, type Role, MASTER_NAV_ITEMS } from '@/lib/roles';
import styles from './DashboardLayout.module.css';

interface NavItem {
  icon: string;
  label: string;
  href: string;
  subItems?: { label: string; href: string }[];
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  title: string;
}

export default function DashboardLayout({ children, navItems, title }: DashboardLayoutProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'staff' | 'master'>('staff');
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [masterPassword, setMasterPassword] = useState('');
  const [switchError, setSwitchError] = useState('');
  const [isSwitching, setIsSwitching] = useState(false);

  const user = session?.user as any;
  const userRole = (user?.role as Role) ?? 'student';
  const masterPriority = user?.masterPriority;
  const userName = user?.name ?? 'User';
  const userEmail = user?.email ?? '';
  const initials = userName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  // Cast nav items to ensure subItems property existence check works
  const currentNavItems = (viewMode === 'master' ? MASTER_NAV_ITEMS : navItems) as NavItem[];
  const currentTitle = viewMode === 'master' ? `Master Portal - ${title}` : title;

  const handleSwitchToMaster = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSwitching(true);
    setSwitchError('');
    
    try {
      const res = await fetch('/api/auth/master-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: masterPassword }),
      });

      if (res.ok) {
        setViewMode('master');
        setShowSwitchModal(false);
        setMasterPassword('');
        router.push('/master/dashboard');
      } else {
        const data = await res.json();
        setSwitchError(data.error || 'Invalid password');
      }
    } catch (err) {
      setSwitchError('Failed to switch mode');
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <Link href="/" className={styles.logo}>
            <Image src="/logo.png" alt="Xbe Academy Logo" width={30} height={30} className={styles.logoImage} />
            <span className={styles.logoText}>
              <Image src="/logo_full.png" alt="Xbe" width={31} height={14} className={styles.logoWordmark} />
              <span className="gradient-text">Academy</span>
            </span>
          </Link>
        </div>

        <nav className={styles.nav}>
          <p className={styles.navSection}>{viewMode === 'master' ? 'MASTER VIEW' : 'STAFF NAVIGATION'}</p>
          {currentNavItems.map((item: NavItem) => {
            const isActive = pathname === item.href || item.subItems?.some((sub: any) => pathname === sub.href);
            const isExpanded = item.subItems?.some((sub: any) => pathname === sub.href);

            return (
              <div key={item.href} className={styles.navGroup}>
                <Link
                  href={item.href}
                  className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  <span>{item.label}</span>
                  {item.subItems && <span className={styles.chevron}>▾</span>}
                </Link>
                
                {item.subItems && (
                  <div className={`${styles.subItems} ${isExpanded ? styles.expanded : ''}`}>
                    {item.subItems.map((sub: any) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className={`${styles.subItem} ${pathname === sub.href ? styles.subActive : ''}`}
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className={styles.sidebarBottom}>
          {masterPriority && (
            <div style={{ padding: '0 1rem 1rem' }}>
              {viewMode === 'staff' ? (
                <button 
                  onClick={() => setShowSwitchModal(true)}
                  className="btn-gradient"
                  style={{ width: '100%', fontSize: '0.85rem', padding: '0.6rem' }}
                >
                  ⚡ Switch to Master
                </button>
              ) : (
                <button 
                  onClick={() => {
                    setViewMode('staff');
                    router.push('/staff/dashboard');
                  }}
                  className="btn-outline"
                  style={{ width: '100%', fontSize: '0.85rem', padding: '0.6rem' }}
                >
                  ⬅ Back to Staff
                </button>
              )}
            </div>
          )}

          <div className={styles.userCard}>
            <div className={styles.avatar}>{initials}</div>
            <div className={styles.userInfo}>
              <p className={styles.userName}>{userName}</p>
              <p className={styles.userRole}>{viewMode === 'master' ? `Master (${masterPriority})` : ROLE_LABELS[userRole]}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className={styles.signOut}
          >
            ⎋ Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.topbar}>
          <h1 className={styles.pageTitle}>{currentTitle}</h1>
          <div className={styles.topbarRight}>
            <span className={styles.userEmail}>{userEmail}</span>
            <div className={styles.avatarSm}>{initials}</div>
          </div>
        </div>
        <div className={styles.content}>
          {children}
        </div>
      </main>

      {/* Master Switch Modal */}
      {showSwitchModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-card animate-slide-up" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem', textAlign: 'center' }}>
            <div className="avatar" style={{ margin: '0 auto 1.5rem', width: '60px', height: '60px', fontSize: '1.5rem', background: 'var(--accent-gradient)' }}>🔐</div>
            <h2 style={{ fontFamily: 'Outfit', marginBottom: '0.5rem' }}>Master Access</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>Please enter your secondary Master Access Password to escalate privileges.</p>
            
            <form onSubmit={handleSwitchToMaster} style={{ display: 'grid', gap: '1.25rem' }}>
              <input 
                type="password" 
                className="form-input" 
                placeholder="Enter Master Password" 
                autoFocus
                required
                value={masterPassword}
                onChange={e => setMasterPassword(e.target.value)}
              />
              {switchError && <p style={{ color: '#ff4d4d', fontSize: '0.8rem' }}>⚠️ {switchError}</p>}
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={() => { setShowSwitchModal(false); setSwitchError(''); setMasterPassword(''); }}>Cancel</button>
                <button type="submit" className="btn-gradient" style={{ flex: 1 }} disabled={isSwitching}>
                  {isSwitching ? 'Verifying...' : 'Unlock Master'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
