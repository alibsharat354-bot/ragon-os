// Simple localStorage data store — no auth, no setup needed

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function getCollection(key: string): any[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(`ragon_${key}`) || '[]') }
  catch { return [] }
}

function saveCollection(key: string, data: any[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(`ragon_${key}`, JSON.stringify(data))
}

export function getAll<T = any>(collection: string): T[] {
  return getCollection(collection).sort((a: any, b: any) =>
    new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  )
}

export function insert<T = any>(collection: string, item: any): T {
  const items = getCollection(collection)
  const now = new Date().toISOString()
  const newItem = { ...item, id: generateId(), created_at: now, updated_at: now }
  items.push(newItem)
  saveCollection(collection, items)
  return newItem as T
}

export function update(collection: string, id: string, changes: any): void {
  const items = getCollection(collection)
  const idx = items.findIndex(i => i.id === id)
  if (idx !== -1) {
    items[idx] = { ...items[idx], ...changes, updated_at: new Date().toISOString() }
    saveCollection(collection, items)
  }
}

export function remove(collection: string, id: string): void {
  const items = getCollection(collection)
  saveCollection(collection, items.filter(i => i.id !== id))
}

export function getSettings(): Record<string, any> {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem('ragon_settings') || '{}') }
  catch { return {} }
}

export function saveSettings(settings: Record<string, any>): void {
  if (typeof window === 'undefined') return
  const existing = getSettings()
  localStorage.setItem('ragon_settings', JSON.stringify({ ...existing, ...settings }))
}

export function logActivity(action: string, entityType: string, entityName?: string): void {
  insert('activity_log', { action, entity_type: entityType, entity_name: entityName || null })
}
