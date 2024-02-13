const Stream = require('node:stream')

// TODO: figure out what to do with the FinalizationRegistry, since the
// cleanup and usage is now internal
function StaticStore (data) {
  this._ref = new WeakRef(data)
}

StaticStore.prototype.read = function read (path) {
  const cache = this._ref.deref()
  return cache ? cache[path] : null
}

StaticStore.prototype.createReadStream = function createReadStream (path) {
  let read = 0
  const buffer = this._ref.deref()
  const cache = buffer ? buffer[path] : null
  const reader = new Stream.Readable({
    read (size) {
      if (!cache) {
        return this.push(null)
      }
      const slice = cache.slice(read, size)
      if (slice.length > 0) {
        read += size
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
