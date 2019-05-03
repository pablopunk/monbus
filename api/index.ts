import * as Koa from 'koa'
import * as cache from 'koa-incache'
import { Context } from 'koa'
import * as got from 'got'
import * as cheerio from 'cheerio'

const app = new Koa()

const cacheLife = 1 * 60 * 1000 // 1 minute

const buildUrl = (from: number, to: number, date: Date) => {
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

async function idas(from: number, to: number, date: Date) {
  const {body} = await got(buildUrl(from, to, date), {headers});

  const $ = cheerio.load(body);

  let idas = [];
  $('.departureTime').each((_i, el) => idas.push($(el).text()));
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

const validateDate = (dateArr: Array<number>) => {
  if (dateArr.length !== 3) { // date needs to have 3 numbers
    return false
  }

  return (
    (dateArr[0] >= 2018 && dateArr[0] <= 2020) &&
    (dateArr[1] >= 1 && dateArr[1] <= 12) &&
    (dateArr[2] >= 1 && dateArr[2] <= 31)
  )
}

const getDateFromUrl = (url: string) => {
  if (url === '/' || typeof url !== 'string' || !url) {
    return null
  }

  let urlSplits = url
    .split('/')
    .filter(_ => !!_)
  urlSplits = urlSplits.slice(urlSplits.length-3, urlSplits.length) // take only last 3

  if (!validateDate(urlSplits.map(_ => parseInt(_)))) {
    return null
  }

  try {
    const date = new Date(parseInt(urlSplits[0]), parseInt(urlSplits[1]) - 1, parseInt(urlSplits[2]))

    return date
  } catch (err) {

    console.log('Invalid date', url)
    return null
  }
}

const PONTEVEDRA = 10530
const RAXO = 10556

// Cache
app.use(cache({
  maxAge: cacheLife
}))

// Headers
app.use(async (ctx: Context, next: Function) => {
  ctx.set('Access-Control-Allow-Origin', '*')
  await next()
})

// 404
app.use(async (ctx: Context, next: Function) => {
  if (ctx.path.includes('favicon')) {
    ctx.throw(404)
  } else {
    await next()
  }
})

// Main
app.use(async (ctx: Context) => {
  const date = getDateFromUrl(ctx.path) || new Date

  const prPromise = idas(PONTEVEDRA, RAXO, date)
  const rpPromise = idas(RAXO, PONTEVEDRA, date)

  const [pr, rp] = await Promise.all([prPromise, rpPromise])
  const responseObject = { pr, rp }

  ctx.cached(responseObject)
  ctx.body = responseObject
})

if (process.env.NODE_ENV === 'development') {
  const port = 3001
  app.listen(port)
  console.log('Listening on', port)
}

export default app.callback()
