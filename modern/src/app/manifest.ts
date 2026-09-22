import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Goa Garden Resort Admin',
    short_name: 'GGR Admin',
    description: 'Secure remote operations for Goa Garden Resort.',
    start_url: '/admin',
    scope: '/admin',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#F5F1E9',
    theme_color: '#233B35',
    icons: [
      { src: '/icon.jpg', sizes: '1024x1024', type: 'image/jpeg', purpose: 'maskable' },
      { src: '/logo.png', sizes: '121x100', type: 'image/png', purpose: 'any' },
    ],
    shortcuts: [
      { name: 'Dashboard', short_name: 'Dashboard', url: '/admin', icons: [{ src: '/icon.jpg', sizes: '1024x1024', type: 'image/jpeg' }] },
      { name: 'Calendar', short_name: 'Calendar', url: '/admin/calendar', icons: [{ src: '/icon.jpg', sizes: '1024x1024', type: 'image/jpeg' }] },
      { name: 'Room prices', short_name: 'Prices', url: '/admin/pricing', icons: [{ src: '/icon.jpg', sizes: '1024x1024', type: 'image/jpeg' }] },
      { name: 'Invoices', short_name: 'Invoices', url: '/admin/invoices', icons: [{ src: '/icon.jpg', sizes: '1024x1024', type: 'image/jpeg' }] },
    ],
  };
}

export const dynamic = 'force-static';

export const revalidate = false;
