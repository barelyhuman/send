function noop () {}

function createStore (onCleanup = noop) {
  const cacheMap = new Map()

  const cleanUpRegistry = new FinalizationRegistry((value) => onCleanup(cacheMap, value))

  function store (path, value) {
    const ref = new WeakRef(value)
    cacheMap.set(path, ref)
    cleanUpRegistry.register(value, path)
  }

  function retrieve (path) {
    const ref = cacheMap.get(path)
    return ref?.deref()
  }

  return { store, retrieve }
}

module.exports = {
  createStore
}
