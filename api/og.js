export const config = { runtime: 'edge' }

export default async function handler(req) {
  const { searchParams } = new URL(req.url)
  const path = '/' + (searchParams.get('path') || '').replace(/\/$/, '')

  const host = req.headers.get('host') || 'uniport-llb1-hub.vercel.app'
  const proto = host.includes('localhost') ? 'http' : 'https'
  const origin = `${proto}://${host}`

  const meta = resolveMeta(path, origin)

  const html = `<!DOCTYPE html>
<html><head>
  <meta charset="utf-8">
  <title>${esc(meta.title)}</title>
  <meta name="description" content="${esc(meta.description)}">
  <meta property="og:title" content="${esc(meta.title)}">
  <meta property="og:description" content="${esc(meta.description)}">
  <meta property="og:image" content="${meta.image}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${origin}${path}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="LLB 1 Hub">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(meta.title)}">
  <meta name="twitter:description" content="${esc(meta.description)}">
  <meta name="twitter:image" content="${meta.image}">
</head><body></body></html>`

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=3600'
    }
  })
}

function esc(s) {
  return String(s || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]))
}

function prettify(slug) {
  return decodeURIComponent(slug).replace(/-/g, ' ')
}

function resolveMeta(path, origin) {
  const img = `${origin}/og-default.png`

  const fallback = {
    title: 'LLB 1 Hub · UNIPORT',
    description: 'Course hub for LLB 1, Faculty of Law, University of Port Harcourt.',
    image: img
  }

  let m = path.match(/^\/materials\/([^/]+)\/([^/]+)$/)
  if (m) {
    return {
      title: `${prettify(m[2])} · ${decodeURIComponent(m[1]).toUpperCase()}`,
      description: 'Read this resource on the LLB 1 Hub.',
      image: img
    }
  }

  m = path.match(/^\/materials\/([^/]+)$/)
  if (m) {
    return {
      title: `${decodeURIComponent(m[1]).toUpperCase()} · Materials`,
      description: 'Notes, textbooks, statutes and past questions for this course.',
      image: img
    }
  }

  m = path.match(/^\/notices\/([^/]+)$/)
  if (m) {
    return {
      title: 'Notice · LLB 1 Hub',
      description: prettify(m[1]),
      image: img
    }
  }

  m = path.match(/^\/vote\/([^/]+)$/)
  if (m) {
    return {
      title: 'Class poll · LLB 1 Hub',
      description: `Vote on: ${prettify(m[1])}`,
      image: img
    }
  }

  return fallback
}
