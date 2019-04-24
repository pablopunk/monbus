const { parse: urlParse } = require('url')
const micro = require('micro')
const got = require('got');
const cheerio = require('cheerio');
const Cache = require('cache')

const cache = new Cache(30 * 60 * 1000) // 30 minutes cache

const buildUrl = (from, to, date) => {
  const baseUrl = 'http://www.monbus.es/';
  const params = {
    route: '/src/net/monbus/horarios/trigger/results.php',
    'data[captcha]': 0,
    'data[searchType]': 1,
    'data[paradaOrigen]': from,
    'data[paradaDestino]': to,
    'data[nViajeros]': 1,
    'data[tipoBillete]': 1,
    'data[fechaIda]': `${date.getDate()}/${date.getMonth()+1}/${date.getFullYear()}`,
  };
  const paramsString = Object.keys(params).reduce((acc, curr) => {
    const str = `${curr}=${params[curr]}`;
    if (acc === '') {
      return str;
    }

    return `${acc}&${str}`;
  }, '');

  return `${baseUrl}?${paramsString}`;
};

const headers = {
  accept: '*/*',
  'accept-language': 'es-ES,es;q=0.9,en;q=0.8,gl;q=0.7',
  'x-requested-with': 'XMLHttpRequest',
};

async function idas(from, to, date) {
  const {body} = await got(buildUrl(from, to, date), {
    credentials: 'include',
    headers,
    referrer: 'http://www.monbus.es/es',
    referrerPolicy: 'no-referrer-when-downgrade',
    body: null,
    method: 'GET',
    mode: 'cors',
  });

  const $ = cheerio.load(body);

  let idas = [];
  $('.departureTime').each((i, el) => idas.push($(el).text()));
  idas = idas.reduce((acc, curr) => {
    if (acc.includes(curr)) {
      const index = acc.indexOf(curr);
      acc[index] = acc[index] + ' (x2)';
      return acc;
    }
    acc.push(curr);
    return acc;
  }, []);

  return idas;
}

const validateDate = (dateArr) => {
  if (dateArr.length !== 3) { // date needs to have 3 numbers
    return false
  }

  return (
    (dateArr[0] >= 2018 && dateArr[0] <= 2020) &&
    (dateArr[1] >= 1 && dateArr[1] <= 12) &&
    (dateArr[2] >= 1 && dateArr[2] <= 31)
  )
}

const getDateFromUrl = (url) => {
  if (url === '/' || typeof url !== 'string' || !url) {
    return null
  }

  let urlSplits = url
    .split('/')
    .filter(_ => !!_)
  urlSplits = urlSplits.slice(urlSplits.length-3, urlSplits.length) // take only last 3

  if (!validateDate(urlSplits)) {

    return null
  }

  try {
    const date = new Date(urlSplits[0], urlSplits[1] - 1, urlSplits[2])

    return date
  } catch (err) {

    console.log('Invalid date', url)
    return null
  }
}

const PONTEVEDRA = 10530
const RAXO = 10556

const server = micro(async (req, res) => {
  const { pathname = '/' } = urlParse(req.url, true)
  res.setHeader('Access-Control-Allow-Origin', '*')

  if (pathname.includes('favicon')) {
    res.statusCode = 404
    res.end()
    return
  }
  const fromCache = cache.get(pathname)
  if (fromCache) {
    return micro.send(res, 200, fromCache)
  }

  const date = getDateFromUrl(pathname) || new Date

  try {
    const prPromise = idas(PONTEVEDRA, RAXO, date)
    const rpPromise = idas(RAXO, PONTEVEDRA, date)

    const [pr, rp] = await Promise.all([prPromise, rpPromise])
    const responseObject = { pr, rp }

    cache.put(pathname, responseObject)
    micro.send(res, 200, responseObject)
  } catch (e) {
    res.statusCode = 500
    res.end('error')
    console.log(e.message)
  }
})

server.listen(3000)
