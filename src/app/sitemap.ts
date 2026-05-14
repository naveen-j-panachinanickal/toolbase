import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://dev.toolbase.in'
  
  // List of main tool categories and pages
  const routes = [
    '',
    '/about',
    '/magic-pdf',
    '/pixels',
    '/data-lens',
    '/open-draw',
    '/redact-secrets',
    '/base64',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  return routes
}
