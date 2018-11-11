const puppeteer = require('puppeteer')
const cheerio = require('cheerio')

const url = 'http://www.monbus.es/es'

async function idas (origen, destino) {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto(url)
  await page.click('#paradaOrigenAC')
  await page.type('#paradaOrigenAC', origen)
  await page.waitForSelector('.ui-autocomplete.ui-menu#ui-id-3', { visible: true })
  await page.click('.ui-autocomplete.ui-menu#ui-id-3 > li:nth-child(1)')
  await page.click('#paradaDestinoAC')
  await page.type('#paradaDestinoAC', destino)
  await page.waitForSelector('.ui-autocomplete.ui-menu#ui-id-4', { visible: true })
  await page.click('.ui-autocomplete.ui-menu#ui-id-4 > li:nth-child(1)')
  await page.waitForSelector('.fecha-ida > img.ui-datepicker-trigger', { visible: true })
  await page.click('input#fechaIda')
  await page.waitForSelector('#ui-datepicker-div', { visible: true })
  await page.waitForSelector('td[data-handler="selectDay"]:nth-child(1)', { visible: true })
  await page.waitFor(300)
  await page.click('td.ui-datepicker-today[data-handler="selectDay"]')
  await page.waitFor(300)
  await page.click('#btBuscar')
  await page.waitForSelector('.departureTime', { visible: true })
  const html = await page.content()
  const $ = cheerio.load(html)

  let idas = []
  $('.departureTime').each((i, el) => idas.push(($(el).text())))
  idas = idas.reduce((acc, curr) => {
    if (acc.includes(curr)) {
      const index = acc.indexOf(curr)
      acc[index] = acc[index] + ' (x2)'
      return acc
    }
    acc.push(curr)
    return acc
  }, [])

  browser.close()

  return idas
}

module.exports = idas
