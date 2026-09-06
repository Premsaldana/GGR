'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export function LayoutBoundary({
  header,
  footer,
  children
}: {
  header: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Isolated layout for admin pages (do not render public header/footer)
  if (pathname?.startsWith('/admin')) {
    return (
      <main id="main-content" tabIndex={-1} className="w-full">
        {children}
      </main>
    );
  }

  // Default layout for public pages
  return (
    <>
      {header}
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      {footer}
    </>
  );
}
