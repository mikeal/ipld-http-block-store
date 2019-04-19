const { writer, reader } = require('../')
const { Block } = require('@ipld/stack')
const { test } = require('tap')
const http = require('http')

const b32 = cid => cid.toBaseEncodedString('base32')

const qs = obj => Array.from(Object.entries(obj)).map(arr => arr.join('=')).join('&')

const success = JSON.stringify({user: 'mikeal', ok: true})

const serverTest = (expect, status, resp) => new Promise((resolve, reject) => {
  let _test = new Promise((_resolveTest, _rejectTest) => {
    let server = http.createServer(async (req, res) => {
      let close = () => new Promise(resolve => server.close(resolve))
      if (Buffer.isBuffer(expect)) {
        let buffers = []
        req.on('data', buffer => buffers.push(buffer))
        req.on('end', async () => {
          res.statusCode = status
          if (resp) res.end(resp)
          else res.end()
          let buffer = Buffer.concat(buffers)
          if (Buffer.compare(buffer, expect) === 0) {
            _resolveTest(close())
          } else {
            _rejectTest(new Error('Buffers responses do not match'))
          }
        })
      } else {
        res.statusCode = status
        if (resp) res.end(resp)
        else res.end()
        if (req.url === expect) {
          _resolveTest(close())
        } else {
          _rejectTest(new Error('URL does not match.'))
        }
      }
    })
    
    server.listen(8134, err => {
      if (err) return reject(err)
      resolve(() => _test)
    })
  })
})

test('writer', async t => {
  let block = Block.encoder({hello: 'world'}, 'dag-cbor')
  let write = writer('http://localhost:8134/')
  
  let buffer = await block.encode()
  let _test = await serverTest(buffer, 201, success)
  await write(block)
  await _test()

  let cid = b32(await block.cid())
  _test = await serverTest('/?cid=' + cid, 201, success)
  write = writer('http://localhost:8134')
  await write(block)
  await _test()
})
