'use strict'

const { test } = require('tap')
const { createStore } = require('../lib/cache')

test('cache read', async function (t) {
  const store = {}

  const staticStore = createStore(store)

  const path = '/foo'
  const value = Buffer.from('bar')

  store[path] = value
  t.same(staticStore.read(path), value)
})

test('cache stream', async function (t) {
  const store = {}

  const staticStore = createStore(store)

  const path = '/foo/bar'
  const value = Buffer.from('foo bar foobar', 'utf8')

  store[path] = value
  const stream = staticStore.createReadStream(path)

  const p = new Promise((resolve) => {
    let buf = Buffer.from('')
    stream.on('data', (chunk) => {
      buf = Buffer.concat([buf, chunk], buf.length + chunk.length)
    })
    stream.on('end', () => {
      resolve(buf)
    })
  })

  const streamValue = await p

  t.same(streamValue, value)
})

test('cache cleanup on read', async function (t) {
  let store

  {
    let data = {
      foo: Buffer.from('bar')
    }
    store = createStore(data)
    data = undefined
  }

  t.same(store.read('foo'), Buffer.from('bar'))

  global.gc()

  // wait for a few seconds for GC to complete and the above reference to be
  // cleaned
  await new Promise(resolve => setTimeout(() => resolve(), 10_000))

  // should be null not a falsey value
  t.same(store.read('foo'), null)
})

// FIXME: figure out why the creation of stream, keeps the reference alive
// test('cache cleanup on read only stream', async function (t) {
//   let store

//   {
//     let data = {
//       foo: Buffer.from('bar')
//     }
//     store = createStore(data)
//     data = undefined
//   }

//   global.gc()

//   // wait for a few seconds for GC to complete and the above reference to be
//   // cleaned
//   await new Promise(resolve => setTimeout(() => resolve(), 15_000))

//   const p = () => {
//     const stream = store.createReadStream('foo')
//     return new Promise((resolve) => {
//       let buf = Buffer.from('')
//       stream.on('data', (chunk) => {
//         buf = Buffer.concat([buf, chunk], buf.length + chunk.length)
//       })
//       stream.on('end', () => {
//         resolve(buf)
//       })
//     })
//   }

//   const streamValue = await p()
//   console.log({ streamValue,streamValueS:streamValue.toString() })
//   t.notOk(streamValue)
// })
