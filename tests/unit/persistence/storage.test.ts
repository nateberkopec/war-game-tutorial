import { describe, it, expect, beforeEach } from 'vitest'
import {
  buildKey,
  parseKey,
  LocalStorageAdapter,
  CollectionStorage,
} from '../../../src/persistence/storage'

describe('buildKey', () => {
  it('builds keys with correct format', () => {
    expect(buildKey('profiles', 'abc123')).toBe('war-game/profiles/abc123')
    expect(buildKey('saves', 'game-1')).toBe('war-game/saves/game-1')
    expect(buildKey('replays', 'r-001')).toBe('war-game/replays/r-001')
    expect(buildKey('settings', 'global')).toBe('war-game/settings/global')
  })
})

describe('parseKey', () => {
  it('parses valid keys', () => {
    expect(parseKey('war-game/profiles/abc123')).toEqual({
      collection: 'profiles',
      id: 'abc123',
    })
    expect(parseKey('war-game/saves/game-1')).toEqual({
      collection: 'saves',
      id: 'game-1',
    })
  })

  it('returns null for invalid keys', () => {
    expect(parseKey('invalid-key')).toBeNull()
    expect(parseKey('war-game/unknown/id')).toBeNull()
    expect(parseKey('other-prefix/profiles/id')).toBeNull()
  })

  it('handles IDs with special characters', () => {
    expect(parseKey('war-game/profiles/uuid-with-dashes-123')).toEqual({
      collection: 'profiles',
      id: 'uuid-with-dashes-123',
    })
  })
})

describe('LocalStorageAdapter', () => {
  let adapter: LocalStorageAdapter

  beforeEach(() => {
    localStorage.clear()
    adapter = new LocalStorageAdapter()
  })

  describe('get/set', () => {
    it('stores and retrieves values', () => {
      adapter.set('test-key', { name: 'test', value: 42 })
      expect(adapter.get('test-key')).toEqual({ name: 'test', value: 42 })
    })

    it('returns null for missing keys', () => {
      expect(adapter.get('nonexistent')).toBeNull()
    })

    it('handles complex nested objects', () => {
      const complex = {
        arr: [1, 2, 3],
        nested: { a: { b: { c: 'deep' } } },
        date: 1234567890,
      }
      adapter.set('complex', complex)
      expect(adapter.get('complex')).toEqual(complex)
    })
  })

  describe('delete', () => {
    it('removes existing keys and returns true', () => {
      adapter.set('to-delete', 'value')
      expect(adapter.delete('to-delete')).toBe(true)
      expect(adapter.get('to-delete')).toBeNull()
    })

    it('returns false for non-existent keys', () => {
      expect(adapter.delete('nonexistent')).toBe(false)
    })
  })

  describe('has', () => {
    it('returns true for existing keys', () => {
      adapter.set('exists', 'value')
      expect(adapter.has('exists')).toBe(true)
    })

    it('returns false for missing keys', () => {
      expect(adapter.has('missing')).toBe(false)
    })
  })

  describe('keys', () => {
    it('lists all keys with prefix', () => {
      adapter.set('war-game/profiles/1', { id: '1' })
      adapter.set('war-game/profiles/2', { id: '2' })
      adapter.set('war-game/saves/s1', { id: 's1' })

      const profileKeys = adapter.keys('war-game/profiles/')
      expect(profileKeys).toHaveLength(2)
      expect(profileKeys).toContain('war-game/profiles/1')
      expect(profileKeys).toContain('war-game/profiles/2')
    })

    it('returns empty array when no matches', () => {
      expect(adapter.keys('nonexistent/')).toEqual([])
    })
  })

  describe('clear', () => {
    it('clears only keys with prefix', () => {
      adapter.set('war-game/profiles/1', { id: '1' })
      adapter.set('war-game/saves/s1', { id: 's1' })
      adapter.set('other-app/data', { x: 1 })

      adapter.clear('war-game/profiles/')

      expect(adapter.get('war-game/profiles/1')).toBeNull()
      expect(adapter.get('war-game/saves/s1')).not.toBeNull()
      expect(adapter.get('other-app/data')).not.toBeNull()
    })
  })
})

describe('CollectionStorage', () => {
  let adapter: LocalStorageAdapter
  let collection: CollectionStorage<{ id: string; name: string }>

  beforeEach(() => {
    localStorage.clear()
    adapter = new LocalStorageAdapter()
    collection = new CollectionStorage(adapter, 'profiles')
  })

  it('stores items with correct key format', () => {
    collection.set('user1', { id: 'user1', name: 'Alice' })
    expect(adapter.get('war-game/profiles/user1')).toEqual({ id: 'user1', name: 'Alice' })
  })

  it('retrieves items by id', () => {
    collection.set('user1', { id: 'user1', name: 'Alice' })
    expect(collection.get('user1')).toEqual({ id: 'user1', name: 'Alice' })
  })

  it('checks existence with has()', () => {
    collection.set('user1', { id: 'user1', name: 'Alice' })
    expect(collection.has('user1')).toBe(true)
    expect(collection.has('user2')).toBe(false)
  })

  it('deletes items', () => {
    collection.set('user1', { id: 'user1', name: 'Alice' })
    expect(collection.delete('user1')).toBe(true)
    expect(collection.get('user1')).toBeNull()
  })

  it('lists all items', () => {
    collection.set('user1', { id: 'user1', name: 'Alice' })
    collection.set('user2', { id: 'user2', name: 'Bob' })

    const items = collection.list()
    expect(items).toHaveLength(2)
    expect(items).toContainEqual({ id: 'user1', name: 'Alice' })
    expect(items).toContainEqual({ id: 'user2', name: 'Bob' })
  })

  it('lists all ids', () => {
    collection.set('user1', { id: 'user1', name: 'Alice' })
    collection.set('user2', { id: 'user2', name: 'Bob' })

    const ids = collection.listIds()
    expect(ids).toHaveLength(2)
    expect(ids).toContain('user1')
    expect(ids).toContain('user2')
  })

  it('clears all items in collection', () => {
    collection.set('user1', { id: 'user1', name: 'Alice' })
    collection.set('user2', { id: 'user2', name: 'Bob' })

    // Add item in different collection
    adapter.set('war-game/saves/s1', { id: 's1' })

    collection.clear()

    expect(collection.list()).toHaveLength(0)
    expect(adapter.get('war-game/saves/s1')).not.toBeNull()
  })
})
