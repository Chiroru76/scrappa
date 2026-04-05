const GUEST_MODE_KEY = 'scrappa_guest_mode'
const GUEST_CLIPS_KEY = 'scrappa_guest_clips'

export function isGuestMode() {
  return localStorage.getItem(GUEST_MODE_KEY) === 'true'
}

const DEFAULT_CLIPS = [
  {
    id: 'default-1',
    image_url: 'https://scrappa-images.s3.ap-northeast-1.amazonaws.com/clips/b0136db0-5947-4969-8004-15ea7aea18b6.jpg',
    tags: [],
    memo: null,
    is_public: true,
    page: 1,
    position: 0,
    created_at: '2026-01-01T00:00:00.000Z',
    likes_count: 0,
  },
  {
    id: 'default-2',
    image_url: 'https://scrappa-images.s3.ap-northeast-1.amazonaws.com/clips/7037ba62-9b50-4d67-b90a-15d284131681.jpg',
    tags: [],
    memo: null,
    is_public: true,
    page: 1,
    position: 1,
    created_at: '2026-01-01T00:00:01.000Z',
    likes_count: 0,
  },
]

export function enterGuestMode() {
  localStorage.setItem(GUEST_MODE_KEY, 'true')
  if (!localStorage.getItem(GUEST_CLIPS_KEY)) {
    localStorage.setItem(GUEST_CLIPS_KEY, JSON.stringify(DEFAULT_CLIPS))
  }
}

export function exitGuestMode() {
  localStorage.removeItem(GUEST_MODE_KEY)
  localStorage.removeItem(GUEST_CLIPS_KEY)
}

function readClips() {
  try {
    return JSON.parse(localStorage.getItem(GUEST_CLIPS_KEY) || '[]')
  } catch {
    return []
  }
}

function writeClips(clips) {
  localStorage.setItem(GUEST_CLIPS_KEY, JSON.stringify(clips))
}

export function getClips(tag = null) {
  const clips = readClips()
  if (!tag) return clips
  return clips.filter(c => (c.tags || []).includes(tag))
}

export function addClip({ imageDataUrl, tags, memo, isPublic = true }) {
  const clips = readClips()
  const newClip = {
    id: crypto.randomUUID(),
    image_url: imageDataUrl,
    tags: tags || [],
    memo: memo || null,
    is_public: isPublic,
    page: Math.floor(clips.length / 12) + 1,
    position: clips.length % 12,
    created_at: new Date().toISOString(),
    likes_count: 0,
  }
  clips.push(newClip)
  writeClips(clips)
  return newClip
}

export function updateClip(id, updates) {
  const clips = readClips()
  const idx = clips.findIndex(c => c.id === id)
  if (idx !== -1) {
    clips[idx] = { ...clips[idx], ...updates }
    writeClips(clips)
  }
}

export function deleteClip(id) {
  writeClips(readClips().filter(c => c.id !== id))
}

export function reorderClips(reordered) {
  writeClips(reordered)
}

export function getTags() {
  const clips = readClips()
  const countMap = {}
  clips.forEach(clip => {
    ;(clip.tags || []).forEach(tag => {
      countMap[tag] = (countMap[tag] || 0) + 1
    })
  })
  return Object.entries(countMap).map(([name, clip_count], i) => ({
    id: `guest-tag-${i}-${name}`,
    name,
    clip_count,
  }))
}

export function renameTag(oldName, newName) {
  const clips = readClips()
  clips.forEach(clip => {
    const idx = (clip.tags || []).indexOf(oldName)
    if (idx !== -1) clip.tags[idx] = newName
  })
  writeClips(clips)
}

export function deleteTag(name) {
  const clips = readClips()
  clips.forEach(clip => {
    clip.tags = (clip.tags || []).filter(t => t !== name)
  })
  writeClips(clips)
}
