const { parse: urlParse } = require('url')
const got = require('got');
const cheerio = require('cheerio');

// 1 => 01
// 11 => 11
const padDate = n => {
  if (n.toString().length < 2) {
    return '0' + n;
  }

  return n;
};

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
    console.log('Invalid date', url)

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

module.exports = async (req, res) => {
  const { pathname = '/' } = urlParse(req.url, true)
  if (pathname.includes('favicon')) {
    res.statusCode = 404
    res.end()
    return
  }
  const date = getDateFromUrl(pathname) || new Date

  try {
    const pr = await idas(PONTEVEDRA, RAXO, date)
    const rp = await idas(RAXO, PONTEVEDRA, date)

    const responseObject = { pr, rp }

    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.end(JSON.stringify(responseObject))
  } catch (e) {
    res.statusCode = 500
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.end('error')
    console.log(e.message)
  }
}
