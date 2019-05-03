import * as Koa from 'koa'
import * as cache from 'koa-incache'
import { Context } from 'koa'
import * as cors from '@koa/cors'
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

async function getTrip(from: number, to: number, date: Date) {
  const {body} = await got(buildUrl(from, to, date), {headers});

  const $ = cheerio.load(body);

  let trip = [];
  $('.departureTime').each((_i, el) => trip.push($(el).text()));
  trip = trip.reduce((acc, curr) => {
    if (acc.includes(curr)) {
      const index = acc.indexOf(curr);
      acc[index] = acc[index] + ' (x2)';
      return acc;
    }
    acc.push(curr);
    return acc;
  }, []);

  return trip;
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

const getDataFromUrl = (url: string) : { from: number, to: number, date: Date } => {
  const splits = url.split('/').filter(_ => !!_)

  if (splits.length === 2) {
    return { from: parseInt(splits[0]), to: parseInt(splits[1]), date: new Date }
  }

  if (splits.length === 5) {
    const dateArray = splits.splice(2, 3).map(_ => parseInt(_))
    if (!validateDate(dateArray)) {
      throw new Error('Wrong url format')
    }
    const date = new Date(dateArray[0], dateArray[1] - 1, dateArray[2])
    return { from: parseInt(splits[0]), to: parseInt(splits[1]), date }
  }

  throw new Error('Wrong url format')
}

// Cache
app.use(cache({maxAge: cacheLife}))

// CORS
app.use(cors({ origin() { return '*' } }))

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
  try {
    var { from, to, date } = getDataFromUrl(ctx.path.replace('/api', ''))
  } catch (err) {
    ctx.throw(404)
  }

  const result = await getTrip(from, to, date)

  ctx.cached(result)
  ctx.body = result
})

if (process.env.NODE_ENV === 'development') {
  const port = 3001
  app.listen(port)
  console.log('Listening on', port)
}

export default app.callback()
