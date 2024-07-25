import axios from 'axios';
import { connect } from 'puppeteer-real-browser';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { Browser, Page } from 'puppeteer';
import { config } from '../../config';
import { globalConfig } from '../../../global-config/global-config';
import { alertIfFnFreezes, cancelAlertIfFnFreezes } from '../base-utils/alert-if-fn-freezes';
import { handleError } from '../base-utils/handle-error';
import { logger } from '../base-utils/logger';
import { selfSslHttpsAgent } from '../connections/self-ssl-https-agent';
import { wait } from '../base-utils/wait';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cloudflareBypassScriptPath = path.join(__dirname, 'cloudflare-bypass-script.ahk');

let lastUsedProxyIndex = 3;
let browser: Browser;
let isBrowserOpen = false;
let currentProxyIp: string;
let errorCount = 0;

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

// async function clickInCloudflareCheckbox(page: Page): Promise<void> {
//   try {
//     // const element = await page.waitForSelector('#turnstile-wrapper > div > div');
//     // if (!element) throw new Error('const element is empty');

//     // const box = await element.boundingBox();
//     // if (!box) throw new Error('const box is empty');

//     // const x = box.x * 1.1; // Manually curated adjustment coefficient
//     // const y = box.y * 1.7; // Manually curated adjustment coefficient
    
//     exec(`"${cloudflareBypassScriptPath}"`);
//   } catch (error) {
//     throw new Error(`Error in clickInCloudflareCheckbox. Error: ${error}`);
//   }
// }


async function getOpenedPage(attempts = 1): Promise<Page> {
  const timerId = alertIfFnFreezes('getOpenedPage in parseDexscreenerTrending');

  try {
    const proxyIndex = lastUsedProxyIndex === 3 ? 4 : 3;
    lastUsedProxyIndex = proxyIndex;

    const proxy = {
      host: globalConfig.standardProxies[proxyIndex].host,
      port: globalConfig.standardProxies[proxyIndex].port,
      username: globalConfig.standardProxies[proxyIndex].username,
      password: globalConfig.standardProxies[proxyIndex].password,
    };
    currentProxyIp = proxy.host;

    const realBrowserAndPage = await connect({
      headless: 'auto',
      args: ['--window-size=800,600'],
      fingerprint: false,
      turnstile: false,
      proxy,
    });

    const page = realBrowserAndPage.page;
    browser = realBrowserAndPage.browser;
    isBrowserOpen = true;

    await page.goto(
      'https://dexscreener.com/ethereum', 
      { waitUntil: 'domcontentloaded' },
    );
    await wait(10000);

    exec(`"${cloudflareBypassScriptPath}"`);

    // await clickInCloudflareCheckbox(page);
    await wait(5000);

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

async function parseTrendingLoop(page: Page, startTime: number) {
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

    const hrefs = await page.evaluate((element: Element) => {
      const links: string[] = [];
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
    const addresses = first15Urls.map((url: string) => url.slice(-42));

    await axios({
      method: 'post',
      url: `${config.webParserProcessorUrl}/dexscreener-trending`,
      data: addresses,
      httpsAgent: selfSslHttpsAgent,
    });

    logger.info('Sent trending to web-parser-processor. Addresses in details log');
    
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
        error as Error,
      );

      setTimeout(() => {
        errorCount = 0; // Reset errorCount to allow to send the error to telegram again
      }, 1500000); // 15 min
    }
    
    await closeBrowserIfOpenned();
    listenDexscreenerTrending();
  }
}

export async function listenDexscreenerTrending() {
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
      error as Error,
    );

    await wait(15000);
    listenDexscreenerTrending();
  }
}