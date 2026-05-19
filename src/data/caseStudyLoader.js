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

    const groups = (data.caseStudy?.groups || []).map(group => ({
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

export function loadCaseStudies() {
  return Object.entries(caseStudyModules)
    .map(([path, module]) => {
      const slug = path.split('/').at(-2)
      const data = module.default || module
      return { slug, ...resolveImages(slug, data) }
    })
    .filter(project => project.visible !== false)
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
}
