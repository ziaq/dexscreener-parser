declare module 'puppeteer-real-browser' {
  import { Browser, Page } from 'puppeteer';

  interface ConnectOptions {
    headless?: boolean | 'new' | 'auto';
    args?: string[];
    customConfig?: object;
    skipTarget?: any[];
    fingerprint?: boolean;
    turnstile?: boolean;
    connectOption?: object;
    fpconfig?: object;
    proxy?: {
      host: string;
      port: string;
      username: string;
      password: string;
    };
  }

  interface RealBrowserAndPage {
    browser: Browser;
    page: Page;
  }

  export function connect(options: ConnectOptions): Promise<RealBrowserAndPage>;
}