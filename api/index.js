const { parse } = require('url')
const micro = require('micro')
const ms = require('ms')
const scrapper = require('./scrapper')

let _cache = null

const populateCache = async () => {
  const rp = await scrapper('raxo', 'pontevedra')
  const pr = await scrapper('pontevedra', 'raxo')

  console.log(rp)

  _cache = { rp, pr }
}

const setHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')

  return res
}

const server = micro(
  async (req, res) => {
    res = setHeaders(res)

    const { query } = parse(req.url, true)

    if (query.refreshCache != null || _cache === null) {
      await populateCache()
    }

    return _cache
  }
)

server.listen(3000)
