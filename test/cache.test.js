'use strict'

const { test } = require('tap')
const { createStore } = require('../lib/cache')

test('cache', async function (t) {
  const { store, retrieve } = createStore()

  const path = '/random/path'
  const value = {
    d: '123'
  }
  store(path, value)
  t.same(retrieve(path), value)
})

test('cache cleanup', async function (t) {
  let cleaned = false
  const { store } = createStore((cache, key) => {
    if (!(cache.get(key)?.deref())) {
      cleaned = true
      cache.delete(key)
    }
  })

  const path = '/random/path'

  // remove value's reference to
  // clear the pointers to the above object
  {
    let value = {
      d: '123'
    }
    store(path, value)
    value = undefined
  }

  global.gc()

  // wait for a few seconds for GC to complete and the above reference to be
  // cleaned
  await new Promise(resolve => setTimeout(() => resolve(), 10_000))
  t.ok(cleaned)
  t.end()
})
