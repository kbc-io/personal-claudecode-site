// Auto-discover all case study JSON files
const caseStudyModules = import.meta.glob(
  '../case-studies/*/case-study.json',
  { eager: true }
)

// Auto-discover all images inside case study folders
const imageModules = import.meta.glob(
  '../case-studies/*/*.{png,jpg,jpeg,gif,webp,svg,avif}',
  { eager: true, import: 'default' }
)

/**
 * Resolves an image reference to its final URL.
 * - If the value starts with "/" or "http", it's already a full path — use as-is.
 * - Otherwise, treat it as a filename relative to the case study folder.
 */
function resolveImage(slug, filename) {
  if (!filename) return filename
  if (filename.startsWith('/') || filename.startsWith('http')) return filename
  const key = `../case-studies/${slug}/${filename}`
  return imageModules[key] || filename
}

function resolveImages(slug, data) {
  if (data.layout === 'multi-gallery') {
    // Auto-discover all images in the folder and group them by filename prefix.
    // Groups are defined in case-study.json as [{ label, prefix }].
    // Adding images to a group is as simple as dropping a file with the matching prefix.
    const folderPrefix = `../case-studies/${slug}/`
    const allEntries = Object.entries(imageModules)
      .filter(([path]) => path.startsWith(folderPrefix))
      .sort(([a], [b]) => a.localeCompare(b))

    // A group may be hidden with `"visible": false`, mirroring the flag on a
    // whole case study. Its images stay in the folder so it can be restored by
    // flipping the flag rather than re-deriving the prefix.
    const groups = (data.caseStudy?.groups || [])
      .filter(group => group.visible !== false)
      .map(group => ({
        label: group.label,
        prefix: group.prefix,
        images: allEntries
          .filter(([path]) => {
            const filename = path.split('/').pop()
            return filename.toLowerCase().startsWith(group.prefix.toLowerCase())
          })
          .map(([, url]) => ({ src: url, caption: '' }))
      }))

    const flatImages = groups.flatMap(g => g.images)

    return {
      ...data,
      image: data.image ? resolveImage(slug, data.image) : (flatImages[0]?.src ?? null),
      caseStudy: {
        ...data.caseStudy,
        groups,
        images: flatImages  // flat list used for the image strip
      }
    }
  }

  if (data.layout === 'gallery') {
    // Auto-discover every image in the folder, sorted by filename.
    // No manual list in case-study.json needed — just drop images into the folder.
    const prefix = `../case-studies/${slug}/`
    const galleryImages = Object.entries(imageModules)
      .filter(([path]) => path.startsWith(prefix))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, url]) => ({ src: url, caption: '' }))

    return {
      ...data,
      // Use explicit thumbnail if provided; otherwise fall back to first discovered image
      image: data.image ? resolveImage(slug, data.image) : (galleryImages[0]?.src ?? null),
      caseStudy: {
        ...data.caseStudy,
        images: galleryImages
      }
    }
  }

  return {
    ...data,
    image: resolveImage(slug, data.image),
    caseStudy: {
      ...data.caseStudy,
      heroImage: resolveImage(slug, data.caseStudy?.heroImage),
      images: data.caseStudy?.images?.map(img => ({
        ...img,
        src: resolveImage(slug, img.src)
      }))
    }
  }
}

// Optional per-case-study custom layout components.
// Drop a `layout.jsx` (default export a React component) into a case study
// folder and set `"layout": "custom"` in its case-study.json to render a
// fully bespoke body inside the shared chrome (sticky header, footer, lightbox).
const layoutModules = import.meta.glob('../case-studies/*/layout.jsx', {
  eager: true,
  import: 'default',
})

/**
 * Returns the custom layout component for a slug, or null if none exists.
 */
export function getCaseStudyLayout(slug) {
  return layoutModules[`../case-studies/${slug}/layout.jsx`] || null
}

/**
 * Resolved image URLs for a single case study, deduplicated.
 * Used to warm the browser cache for one project when a visitor hovers or
 * focuses its card, rather than downloading every image on the site up front.
 */
export function getCaseStudyImageUrls(slug) {
  const prefix = `../case-studies/${slug}/`
  return Array.from(
    new Set(
      Object.entries(imageModules)
        .filter(([path]) => path.startsWith(prefix))
        .map(([, url]) => url)
    )
  )
}

// The resolve/sort pipeline is deterministic and the underlying globs are
// eager, so the result is computed once and shared by every consumer.
let cache = null

export function loadCaseStudies() {
  if (cache) return cache

  cache = Object.entries(caseStudyModules)
    .map(([path, module]) => {
      const slug = path.split('/').at(-2)
      const data = module.default || module
      return { slug, ...resolveImages(slug, data) }
    })
    .filter(project => project.visible !== false)
    // `order` is the single source of sequencing; slug breaks ties so the
    // result never depends on glob iteration order.
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || a.slug.localeCompare(b.slug))

  return cache
}
