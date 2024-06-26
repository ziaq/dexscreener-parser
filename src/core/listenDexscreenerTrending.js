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
let isBrowserOpen = false;
let currentProxyIp;
let errorCount;

async function closeBrowserIfOpenned() {
  if (isBrowserOpen) {
    try {
      await browser.close();
      isBrowserOpen = false;

    } catch(error) {
      logger.error(`Error in closeBrowserIfOpenned. Error: ${error}`);
    }
  }
}

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

    currentProxyIp = proxy.host;
    lastUsedProxyIndex = proxyIndex;

    const realBrowser = await puppeteerRealBrowser({ proxy });
    const page = realBrowser.page;
    browser = realBrowser.browser;
    isBrowserOpen = true;

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
    logger.error(`Error in getOpenedPage. Proxy ${currentProxyIp}. Error: ${error}`)
    await closeBrowserIfOpenned();
    
    if (attempts === 0) {
      throw new Error('Error in getOpenedPage. Failed with both proxies.');
    }

    await wait(15000);
    return await getOpenedPage(attempts - 1);

  } finally {
    cancelAlertIfFnFreezes(timerId);
  }
}

async function parseTrendingLoop(page, startTime) {
  try {
    const isHourHasPassed = Date.now() - startTime >= 3600000;

    if (isHourHasPassed) {
      await closeBrowserIfOpenned();
      listenDexscreenerTrending();
      return;
    }

    await page.reload({ waitUntil: 'load' });
    const xpath = 'xpath/.//*[@id="root"]/div/main/div/div[2]/div[4]';

    await page.waitForSelector(xpath);

    const elements = await page.$$(xpath);
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
    errorCount = 0;

    parseTrendingLoop(page, startTime);

  } catch(error) {
    logger.info(`parseTrendingLoop failed. Proxy ${currentProxyIp}. Will try again. Error:${error}`)
    errorCount++;

    if (errorCount === 15) {
      handleError(
        'parseTrendingLoop',
        'Failed 15 times in a row. Will try again.',
        error,
      );

      setTimeout(() => {
        errorCount = 0; // Reset errorCount to allow to send the error to telegram again
      }, 1500000); // 15 min
    }
    
    await closeBrowserIfOpenned();
    listenDexscreenerTrending();
  }
}

async function listenDexscreenerTrending() {
  try {
    const page = await getOpenedPage();
    const initialCookies = await page.cookies();
    await page.setCookie(...initialCookies);

    const startTime = Date.now();
    await parseTrendingLoop(page, startTime);

  } catch(error) {
    handleError(
      'listenDexscreenerTrending',
      `Failed. Will try Again. Error: ${error}`,
      error,
    );

    await wait(15000);
    listenDexscreenerTrending();
  }
}

module.exports = listenDexscreenerTrending;