const Stream = require('node:stream')

// Internal re-referenced cache
const _cache = new Map()

const cacheRegistry = new FinalizationRegistry((cacheKey) => {
  _cache.delete(cacheKey)
})

function StaticStore (data) {
  Object.keys(data).forEach(k => {
    const wRef = new WeakRef(data[k])
    _cache.set(k, wRef)
    cacheRegistry.register(data[k], k)
  })
}

StaticStore.prototype.read = function read (path) {
  const cacheRef = _cache.get(path)
  const buff = cacheRef?.deref() ?? null
  return buff
}

StaticStore.prototype.createReadStream = function createReadStream (path) {
  let readSize = 0
  const cachedBuffer = this.read(path)
  const reader = new Stream.Readable({
    read (size) {
      if (!cachedBuffer) {
        return this.push(null)
      }
      const slice = cachedBuffer.slice(readSize, size)
      if (slice.length > 0) {
        readSize += size
        this.push(slice)
      } else {
        this.push(null)
      }
    }
  })

  return reader
}

function createStore (data) {
  return new StaticStore(data)
}

module.exports = {
  createStore
}
