"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOutAction } from "@/lib/auth/actions";
import styles from "./AppNavigation.module.css";

type AppNavigationProps = {
  avatarUrl: string | null;
  displayName: string;
  username: string | null;
  unreadNotificationCount: number;
};

const centerLinks = [
  { href: "/browse", label: "Browse" },
  { href: "/discover", label: "Discover" },
  { href: "/circle", label: "Circle" },
  { href: "/proposals", label: "Proposals" },
  { href: "/trades", label: "Trades" },
];

function BellIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={styles.icon}>
      <path
        d="M12 22a2.7 2.7 0 0 0 2.62-2h-5.24A2.7 2.7 0 0 0 12 22Zm7-6.2-1.6-1.9V9.6a5.4 5.4 0 0 0-4.2-5.25V3a1.2 1.2 0 0 0-2.4 0v1.35A5.4 5.4 0 0 0 6.6 9.6v4.3L5 15.8V18h14v-2.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function AppNavigation({ avatarUrl, displayName, username, unreadNotificationCount }: AppNavigationProps) {
  const pathname = usePathname();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className={styles.shell}>
      <nav className={styles.nav} aria-label="Global navigation">
        <div className={styles.left}>
          <Link href="/browse" className={styles.brand}>
            Barter
          </Link>
        </div>

        <div className={styles.center}>
          {centerLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.navLink} ${isActive ? styles.active : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className={styles.right}>
          <Link
            href="/notifications"
            className={`${styles.iconButton} ${pathname.startsWith("/notifications") ? styles.active : ""}`}
            aria-label={`Notifications${unreadNotificationCount ? `, ${unreadNotificationCount} unread` : ""}`}
          >
            <BellIcon />
            {unreadNotificationCount > 0 ? (
              <span className={styles.badge}>{unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}</span>
            ) : null}
          </Link>

          <div className={styles.profileMenuWrap} ref={menuRef}>
            <button
              type="button"
              className={`${styles.avatarButton} ${pathname.startsWith("/profile") ? styles.active : ""}`}
              aria-label="Profile menu"
              aria-expanded={profileMenuOpen}
              onClick={() => setProfileMenuOpen((isOpen) => !isOpen)}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} />
              ) : (
                <span>{displayName.slice(0, 1).toUpperCase()}</span>
              )}
            </button>
            {profileMenuOpen ? (
              <div className={styles.profileMenu}>
                {username ? (
                  <Link href={`/profiles/${username}`} onClick={() => setProfileMenuOpen(false)}>
                    View Profile
                  </Link>
                ) : (
                  <span className={styles.disabledMenuItem}>View Profile</span>
                )}
                <Link href="/profile/edit" onClick={() => setProfileMenuOpen(false)}>
                  Edit Profile
                </Link>
                <Link href="/circle" onClick={() => setProfileMenuOpen(false)}>
                  Circle
                </Link>
                <Link href="/help" onClick={() => setProfileMenuOpen(false)}>
                  Help / Contact
                </Link>
                <form action={signOutAction}>
                  <button type="submit">Sign Out</button>
                </form>
              </div>
            ) : null}
          </div>
        </div>
      </nav>
    </header>
  );
}
