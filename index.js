const bent = require('bent')

const get = bent('buffer')
const put = bent('PUT', 'json', 201)

const b32 = cid => cid.toBaseEncodedString('base32')

const qs = obj => Array.from(Object.entries(obj)).map(arr => arr.join('=')).join('&')

const writer = (baseurl, params = {}) => {
  let c = cid => Object.assign({ cid }, params)
  return async block => {
    let based = b32(await block.cid())
    let url = baseurl + '?' + qs(c(based))
    await put(url, await block.encode())
    return true
  }
}

const reader = baseurl => {
  if (!baseurl.endsWith('/')) baseurl =+ '/'
  return async cid => Block.decoder(await get(b32(cid)), cid)
}

exports.writer = writer
exports.reader = reader
