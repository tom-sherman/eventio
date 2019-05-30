import { EventEmitter, EventMap } from '../event-emitter'

let emitter: EventEmitter
beforeEach(() => (emitter = new EventEmitter()))

test('can be initialized', () => {
  expect(() => new EventEmitter()).not.toThrow()
})

test('aliases for on and off should exist', () => {
  expect(emitter.on).toEqual(emitter.addListener)
  expect(emitter.off).toEqual(emitter.removeListener)
})

describe('max listeners', () => {
  test('should be set to the default', () => {
    expect(emitter.maxListeners).toBe(EventEmitter.DEFAULT_MAX_LISTENERS)
  })

  test('can be set to number greater than 0', () => {
    emitter.maxListeners = 1
    expect(emitter.maxListeners).toBe(1)
  })

  test('when set to 0, it is set to 0', () => {
    emitter.maxListeners = 0
    expect(emitter.maxListeners).toBe(Infinity)
  })

  test('cannot be set to a negative number', () => {
    expect(() => (emitter.maxListeners = -1)).toThrow(
      'maxListeners cannot be set to a negative value.'
    )
    expect(emitter.maxListeners).toEqual(EventEmitter.DEFAULT_MAX_LISTENERS)
  })

  test('should throw when setting to a non number', () => {
    expect(() => (emitter.maxListeners = ('3' as unknown) as number)).toThrow(
      'maxListeners must be a number.'
    )
  })

  test('should throw when setting to NaN', () => {
    expect(() => (emitter.maxListeners = NaN)).toThrow(
      'maxListeners must be a number.'
    )
  })
})

describe('listener count', () => {
  test("returns 0 when the event hasn't been registered", () => {
    expect(emitter.listenerCount('event')).toBe(0)
  })

  test('returns the correct number', () => {
    const cb = () => {}

    expect(emitter.listenerCount('event')).toBe(0)

    emitter.on('event', cb)
    expect(emitter.listenerCount('event')).toBe(1)

    emitter.off('event', cb)
    expect(emitter.listenerCount('event')).toBe(0)
  })
})

describe('listeners', () => {
  test('should get empty array when there are no registered events', () => {
    expect(emitter.listeners('event')).toStrictEqual([])
  })

  test('should return an array', () => {
    const cb = () => {}
    emitter.on('event', cb)
    expect(emitter.listeners('event')).toStrictEqual([cb])
  })
})

describe('add listener', () => {
  test('can add a single listener', () => {
    expect(() => emitter.on('event', () => {})).not.toThrow()
    expect(emitter.listenerCount('event')).toBe(1)
  })

  test('can add multiple listeners', () => {
    expect(() => {
      emitter.on('event', () => {})
      emitter.on('event', () => {})
      emitter.on('event', () => {})
    }).not.toThrow()
    expect(emitter.listenerCount('event')).toBe(3)
  })

  test('can add the same listener to multiple events', () => {
    expect(() => emitter.on('event1 event2', () => {})).not.toThrow()
    expect(emitter.listenerCount('event1')).toBe(1)
    expect(emitter.listenerCount('event2')).toBe(1)
  })

  test('can prepend a listener using on/addListener', () => {
    const cb1 = () => {}
    const cb2 = () => {}
    const cb3 = () => {}

    emitter.on('event', cb1)
    emitter.on('event', cb2, true)
    expect(emitter.listeners('event')).toStrictEqual([cb2, cb1])

    emitter.addListener('event', cb3, true)
    expect(emitter.listeners('event')).toStrictEqual([cb3, cb2, cb1])
  })

  test('can prepend a listener using prependListener', () => {
    const cb1 = () => {}
    const cb2 = () => {}

    emitter.on('event', cb1)
    emitter.prependListener('event', cb2)
    expect(emitter.listeners('event')).toStrictEqual([cb2, cb1])
  })

  test('should throw when passing not a function', () => {
    let cb: Function
    expect(() => emitter.addListener('event', cb)).toThrow()
  })
})

describe('remove listener', () => {
  test("doesn't throw when removing a non existent event", () => {
    expect(() => emitter.off('event', () => {})).not.toThrow()
    expect(() => emitter.off('event1 event2', () => {})).not.toThrow()
  })

  test('can remove a single event', () => {
    const cb = () => {}
    emitter.on('event', cb)
    emitter.off('event', cb)
    expect(emitter.listenerCount('event')).toBe(0)

    emitter.on('event', cb)
    emitter.on('event', () => {})
    emitter.off('event', cb)
    expect(emitter.listenerCount('event')).toBe(1)
  })

  test('should remove all occurrences of the same cb', () => {
    const cb = () => {}
    emitter.on('event', cb)
    emitter.on('event', cb)
    emitter.off('event', cb)
    expect(emitter.listenerCount('event')).toBe(0)
  })

  test('should remove the listener from all specified events', () => {
    const cb = () => {}
    emitter.on('event1', cb)
    emitter.on('event2', cb)
    expect(emitter.listenerCount('event1')).toBe(1)
    expect(emitter.listenerCount('event2')).toBe(1)

    emitter.off('event1 event2', cb)
    expect(emitter.listenerCount('event1')).toBe(0)
    expect(emitter.listenerCount('event2')).toBe(0)

    emitter.on('event1', cb)
    emitter.off('event1 event2', cb)
    expect(emitter.listenerCount('event1')).toBe(0)
    expect(emitter.listenerCount('event2')).toBe(0)
  })

  test('removing last listener deletes the event from the map', () => {
    const map: EventMap = (emitter as any)._eventMap
    const cb1 = () => {}
    const cb2 = () => {}

    emitter.on('event', cb1)
    emitter.on('event', cb2)
    expect(map.get('event')!.length).toBe(2)
    emitter.off('event', cb1)
    expect(map.get('event')!.length).toBe(1)
    emitter.off('event', cb2)
    // It's been deleted if we now no longer can get an array (undefined)
    expect(map.get('event')).toBe(undefined)
  })

  test('should throw when passing not a function', () => {
    let cb: Function
    expect(() => emitter.removeListener('event', cb)).toThrow()
  })
})

describe('emit', () => {
  test('should call callbacks', () => {
    const mockCb = jest.fn(() => {})
    emitter.on('event', mockCb)
    expect(mockCb.mock.calls.length).toBe(0)

    emitter.emit('event')
    expect(mockCb.mock.calls.length).toBe(1)
    emitter.emit('event')
    expect(mockCb.mock.calls.length).toBe(2)
  })

  test('should pass arguments to callback', () => {
    const mockCb = jest.fn((...args) => {
      expect(args.length).toBe(2)
      expect(args[0]).toBe('arg1')
      expect(args[1]).toBe('arg2')
    })

    emitter.on('event', mockCb)
    emitter.emit('event', 'arg1', 'arg2')
    expect(mockCb.mock.calls.length).toBe(1)
  })

  test('calls the callbacks in the correct order', () => {
    const order: number[] = []
    const cb1 = () => order.push(1)
    const cb2 = () => order.push(2)
    const cb3 = () => order.push(3)

    emitter.on('event', cb1)
    emitter.on('event', cb2)

    emitter.emit('event')
    expect(order).toStrictEqual([1, 2])

    // Reset the order
    order.length = 0

    emitter.prependListener('event', cb3)
    emitter.emit('event')
    expect(order).toStrictEqual([3, 1, 2])
  })
})

describe('once', () => {
  test('should only call the callback once', () => {
    const mockCb = jest.fn()
    emitter.once('event', mockCb)
    emitter.emit('event')
    emitter.emit('event')
    expect(mockCb.mock.calls.length).toBe(1)
  })

  test('can prepend a listener using prependOnce', () => {
    // Access the private event map property
    const map: EventMap = (emitter as any)._eventMap
    const mockCb = jest.fn()
    const cb = () => {}

    emitter.on('event', cb)
    emitter.prependOnce('event', mockCb)
    expect(map.get('event')!.length).toBe(2)
    expect(map.get('event')![1]).toStrictEqual(cb)
  })
})

describe('remove all listeners', () => {
  test('should not error when there are no events', () => {
    expect(() => emitter.removeAllListeners('event')).not.toThrow()
  })

  test('should remove all listeners', () => {
    // Access the private event map property
    const map: EventMap = (emitter as any)._eventMap
    emitter.on('event', () => {})
    emitter.on('event', () => {})
    emitter.on('event', () => {})

    expect(map.get('event')!.length).toBe(3)

    emitter.removeAllListeners('event')
    expect(map.get('event')).toBe(undefined)
  })
})

describe('event names', () => {
  test('should return empty array when there are no events', () => {
    expect(emitter.eventNames()).toStrictEqual([])
  })

  test('should return names', () => {
    emitter.on('event1', () => {})
    emitter.on('event2', () => {})
    expect(emitter.eventNames()).toStrictEqual(['event1', 'event2'])
  })
})
