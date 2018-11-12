const ms = require('ms')
const { send } = require('micro')
const scrapper = require('./scrapper')

let cache

const populateCache = async () => {
  const rp = await scrapper('raxo', 'pontevedra')
  const pr = await scrapper('pontevedra', 'raxo')

  cache = { rp, pr }
}

setInterval(populateCache, ms('1 hour'))

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')

  if (!cache) {
    await populateCache()
  }

  send(res, 200, cache)
}
