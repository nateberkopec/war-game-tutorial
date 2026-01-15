/**
 * Typed event emitter for game events.
 * Provides pub/sub functionality with type safety.
 */

import type { GameEvent, GameEventCallback, GameEventType } from './types'

export type EventKey = GameEventType | '*'

/**
 * Simple typed event emitter.
 */
export class EventEmitter {
  private listeners: Map<EventKey, Set<GameEventCallback>> = new Map()

  /**
   * Subscribe to an event type.
   * Use '*' to subscribe to all events.
   */
  on(event: EventKey, callback: GameEventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  /**
   * Unsubscribe from an event type.
   */
  off(event: EventKey, callback: GameEventCallback): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.delete(callback)
      if (callbacks.size === 0) {
        this.listeners.delete(event)
      }
    }
  }

  /**
   * Emit an event to all subscribers.
   * Notifies both specific event listeners and wildcard '*' listeners.
   */
  emit(event: GameEvent): void {
    // Notify specific listeners
    const specificListeners = this.listeners.get(event.type)
    if (specificListeners) {
      for (const callback of specificListeners) {
        try {
          callback(event)
        } catch (error) {
          console.error(`Error in event listener for '${event.type}':`, error)
        }
      }
    }

    // Notify wildcard listeners
    const wildcardListeners = this.listeners.get('*')
    if (wildcardListeners) {
      for (const callback of wildcardListeners) {
        try {
          callback(event)
        } catch (error) {
          console.error(`Error in wildcard event listener:`, error)
        }
      }
    }
  }

  /**
   * Remove all listeners for a specific event, or all listeners if no event specified.
   */
  removeAllListeners(event?: EventKey): void {
    if (event) {
      this.listeners.delete(event)
    } else {
      this.listeners.clear()
    }
  }

  /**
   * Get the number of listeners for an event.
   */
  listenerCount(event: EventKey): number {
    return this.listeners.get(event)?.size ?? 0
  }

  /**
   * Check if there are any listeners for an event.
   */
  hasListeners(event: EventKey): boolean {
    return this.listenerCount(event) > 0
  }
}
