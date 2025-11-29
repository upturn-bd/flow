import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://flow.upturn.com.bd';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/home/',
          '/superadmin/',
          '/unauthorized/',
          '/verify/',
          '/forgot-password/',
          '/onboarding/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
