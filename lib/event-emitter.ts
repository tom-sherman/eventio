export type EventMap = Map<string, Function[]>

export default class EventEmitter {
  static readonly DEFAULT_MAX_LISTENERS = 10
  private _eventMap: EventMap = new Map()
  private _maxListeners: number = EventEmitter.DEFAULT_MAX_LISTENERS

  on = this.addListener
  off = this.removeListener

  addListener(
    eventNames: string,
    listener: Function,
    prepend: boolean = false
  ): void {
    if (typeof listener !== 'function') {
      throw new TypeError('listener must be a function')
    }

    for (const eventName of eventNames.split(' ')) {
      if (this.listenerCount(eventName) === this.maxListeners) {
        console.warn(
          'Possible EventEmitter memory leak detected. ' +
            `${this.listenerCount(name)} ${name} listeners ` +
            'added. Set emitter.maxListeners to ' +
            'increase limit.'
        )
      }

      if (!this._eventMap.has(eventName)) {
        this._eventMap.set(eventName, [])
      }

      if (prepend) {
        ;(this._eventMap.get(eventName) as Function[]).unshift(listener)
      } else {
        ;(this._eventMap.get(eventName) as Function[]).push(listener)
      }
    }
  }

  removeListener(eventNames: string, listener: Function): void {
    if (typeof listener !== 'function') {
      throw new TypeError('listener must be a function')
    }

    for (const eventName of eventNames.split(' ')) {
      const currentListeners = this.listeners(eventName)
      const newListeners = currentListeners.filter(l => l !== listener)

      if (newListeners.length === 0) {
        // Delete the event from the internal map if there are no events left
        this.removeAllListeners(eventName)
        continue
      }

      if (currentListeners !== newListeners) {
        this._eventMap.set(eventName, newListeners)
        this.emit('removeListener', eventName, listener)
      }
    }
  }

  emit(eventName: string, ...args: any[]): boolean {
    // Do we want to throw an error if there is no error event registered?

    // Clone the array to prevent race conditions
    const listeners = this.listeners(eventName)

    if (listeners.length === 0) {
      return false
    }

    listeners.forEach(listener => Reflect.apply(listener, this, args))
    return true
  }

  once(eventNames: string, listener: Function, prepend: boolean = false): void {
    const onceListener = (...args: any[]) => {
      listener(...args)
      this.removeListener(eventNames, onceListener)
    }

    this.addListener(eventNames, onceListener, prepend)
  }

  prependListener(eventNames: string, listener: Function): void {
    return this.addListener(eventNames, listener, true)
  }

  prependOnce(eventNames: string, listener: Function) {
    return this.once(eventNames, listener, true)
  }

  removeAllListeners(eventName: string): void {
    this._eventMap.delete(eventName)
  }

  eventNames(): string[] {
    return Array.from(this._eventMap.keys())
  }

  listeners(eventName: string): Function[] {
    return Object.assign([], this._eventMap.get(String(eventName)))
  }

  listenerCount(eventName: string): number {
    const listeners = this._eventMap.get(eventName)
    if (typeof listeners === 'undefined') {
      return 0
    }

    return listeners.length
  }

  get maxListeners() {
    return this._maxListeners
  }
  set maxListeners(n: number) {
    if (typeof n !== 'number' || isNaN(n)) {
      throw new TypeError('maxListeners must be a number.')
    }

    if (n < 0) {
      throw new RangeError('maxListeners cannot be set to a negative value.')
    }
    if (n === 0) {
      this._maxListeners = Infinity
      return
    }
    this._maxListeners = n
  }
}
