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

const buildUrl = (from, to, date = null) => {
  const baseUrl = 'http://www.monbus.es/';
  if (!date) {
    date = new Date // now
  }
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

const PONTEVEDRA = 10530
const RAXO = 10556

module.exports = async (req, res) => {
  const now = new Date

  try {
    const pr = await idas(PONTEVEDRA, RAXO, now)
    const rp = await idas(RAXO, PONTEVEDRA, now)

    const responseObject = { pr, rp }

    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(responseObject))
  } catch (e) {
    res.statusCode = 500
    res.end('error')
    console.log(e.message)
  }
}
