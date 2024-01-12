const logger = require('../base-utils/logger');
const globalConfig = require('../../../global-config/globalConfig');
const wait = require('../base-utils/wait');
const handleError = require('../base-utils/handleError');
const { 
  alertIfFnFreezes, 
  cancelAlertIfFnFreezes 
} = require('../base-utils/alertIfFnFreezes');
const selfSslHttpsAgent = require('../connections/selfSslHttpsAgent');
const config = require('../../config/config');
const axios = require('axios');

let lastUsedProxyIndex = 3;
let browser;

async function getOpenedPage(attempts = 1) {
  let timerId;

  try {
    timerId = alertIfFnFreezes('getOpenedPage in parseDexscreenerTrending');
    const { puppeteerRealBrowser } = await import('puppeteer-real-browser')

    const proxyIndex = lastUsedProxyIndex === 3 ? 4 : 3;

    const proxy = {
      host: globalConfig.standardProxies[proxyIndex].host,
      port: globalConfig.standardProxies[proxyIndex].port,
      username: globalConfig.standardProxies[proxyIndex].username,
      password: globalConfig.standardProxies[proxyIndex].password,
    };

    lastUsedProxyIndex = proxyIndex;

    const realBrowser = await puppeteerRealBrowser({ proxy });
    const page = realBrowser.page;
    browser = realBrowser.browser;

    await page.goto(
      'https://dexscreener.com/ethereum', { 
        waitUntil: 'domcontentloaded' 
      },
    );

    await wait(10000);

    await page.keyboard.press('Tab');
    await wait(2000);

    await page.keyboard.press('Space');
    await wait(8000);

    return page;

  } catch (error) {
    if (browser) {
      await browser.close();
    }
    
    if (attempts === 0) {
      handleError(
        'getOpenedPage',
        'Failed with both proxies',
        error,
      );

      return null;
    }

    await wait(15000);
    return await getOpenedPage(attempts - 1);

  } finally {
    cancelAlertIfFnFreezes(timerId);
  }
}

async function parseTrendingLoop(page) {
  try {
    await page.reload({ waitUntil: 'networkidle0' });
    const xpath = '//*[@id="root"]/div/main/div/div[2]/div[4]';

    await page.waitForXPath(xpath);

    const elements = await page.$x(xpath);
    const parentElement = elements[0];

    const hrefs = await page.evaluate(element => {
      let links = [];
      if (element) {
        const anchorElements = element.querySelectorAll('a');
        anchorElements.forEach(el => {
          if (el.href) {
            links.push(el.href);
          }
        });
      }
      return links;
    }, parentElement);

    const first15Urls = hrefs.slice(0, 15);
    const addresses = first15Urls.map(url => url.slice(-42));

    await axios({
      method: 'post',
      url: `${config.webParserProcessorUrl}/dexscreener-trending`,
      data: addresses,
      httpsAgent: selfSslHttpsAgent,
    });

    logger.info('Sent trending to web-parser-processor. Addresses in details log');
    logger.details(addresses);
    
    await wait(3000);
    await parseTrendingLoop(page)

  } catch(error) {
    throw new Error(`Error in parseTrendingLoop. Error: ${error}`);
  }
}

async function listenDexscreenerTrending() {
  let timerId;

  try {
    const page = await getOpenedPage();
    if (!page) {
      throw new Error('parseTrendingLoop failed. Will try again in 5 min')
    }

    const initialCookies = await page.cookies();
    await page.setCookie(...initialCookies);

    await parseTrendingLoop(page);

  } catch(error) {
    handleError(
      'listenDexscreenerTrending',
      'Failed. Will try again in 5 min',
      error,
    );

    await wait(300000); // 5 min
    
    timerId = alertIfFnFreezes(
      "Catch section in try/catch in listenDexscreenerTrending. Probably can't close browser"
    );

    if (browser) {
      await browser.close();
    }

    listenDexscreenerTrending();
    
  } finally {
    cancelAlertIfFnFreezes(timerId);
  }
}

module.exports = listenDexscreenerTrending;