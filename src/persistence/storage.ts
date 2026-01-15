/**
 * Storage abstraction for War game persistence
 *
 * Provides a generic interface for storage operations and a LocalStorage implementation.
 * Key prefixing follows the schema: war-game/{collection}/{id}
 */

/** Base storage interface for pluggable backends */
export interface StorageAdapter {
  get<T>(key: string): T | null
  set<T>(key: string, value: T): void
  delete(key: string): boolean
  has(key: string): boolean
  keys(prefix?: string): string[]
  clear(prefix?: string): void
}

/** Storage collections used by the game */
export type StorageCollection = 'profiles' | 'saves' | 'replays' | 'settings'

/** Full key format: war-game/{collection}/{id} */
export function buildKey(collection: StorageCollection, id: string): string {
  return `war-game/${collection}/${id}`
}

/** Extract collection and id from a full key */
export function parseKey(key: string): { collection: StorageCollection; id: string } | null {
  const match = key.match(/^war-game\/(profiles|saves|replays|settings)\/(.+)$/)
  if (!match) return null
  return {
    collection: match[1] as StorageCollection,
    id: match[2],
  }
}

/** LocalStorage implementation of StorageAdapter */
export class LocalStorageAdapter implements StorageAdapter {
  private readonly prefix = 'war-game/'

  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key)
      if (raw === null) return null
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }

  set<T>(key: string, value: T): void {
    const raw = JSON.stringify(value)
    localStorage.setItem(key, raw)
  }

  delete(key: string): boolean {
    const existed = localStorage.getItem(key) !== null
    localStorage.removeItem(key)
    return existed
  }

  has(key: string): boolean {
    return localStorage.getItem(key) !== null
  }

  keys(prefix?: string): string[] {
    const searchPrefix = prefix ?? this.prefix
    const result: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(searchPrefix)) {
        result.push(key)
      }
    }
    return result
  }

  clear(prefix?: string): void {
    const keysToDelete = this.keys(prefix)
    for (const key of keysToDelete) {
      localStorage.removeItem(key)
    }
  }
}

/**
 * Collection-scoped storage operations
 *
 * Wraps a StorageAdapter to provide type-safe operations scoped to a specific collection.
 */
export class CollectionStorage<T> {
  constructor(
    private readonly adapter: StorageAdapter,
    private readonly collection: StorageCollection
  ) {}

  get(id: string): T | null {
    return this.adapter.get<T>(buildKey(this.collection, id))
  }

  set(id: string, value: T): void {
    this.adapter.set(buildKey(this.collection, id), value)
  }

  delete(id: string): boolean {
    return this.adapter.delete(buildKey(this.collection, id))
  }

  has(id: string): boolean {
    return this.adapter.has(buildKey(this.collection, id))
  }

  list(): T[] {
    const keys = this.adapter.keys(buildKey(this.collection, ''))
    const items: T[] = []
    for (const key of keys) {
      const item = this.adapter.get<T>(key)
      if (item !== null) {
        items.push(item)
      }
    }
    return items
  }

  listIds(): string[] {
    const keys = this.adapter.keys(buildKey(this.collection, ''))
    return keys
      .map((key) => parseKey(key)?.id)
      .filter((id): id is string => id !== undefined)
  }

  clear(): void {
    this.adapter.clear(buildKey(this.collection, ''))
  }
}

/** Default storage instance using LocalStorage */
let defaultAdapter: StorageAdapter | null = null

export function getDefaultAdapter(): StorageAdapter {
  if (!defaultAdapter) {
    defaultAdapter = new LocalStorageAdapter()
  }
  return defaultAdapter
}

/** For testing: replace the default adapter */
export function setDefaultAdapter(adapter: StorageAdapter): void {
  defaultAdapter = adapter
}

/** Factory to get a collection-scoped storage */
export function getCollection<T>(collection: StorageCollection): CollectionStorage<T> {
  return new CollectionStorage<T>(getDefaultAdapter(), collection)
}
