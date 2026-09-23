'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function PageExit() {
  const pathname = usePathname();
  if (pathname === '/') return null;
  return (
    <div className="page-exit">
      <Link href="/" className="back-link">
        Home
      </Link>
    </div>
  );
}
