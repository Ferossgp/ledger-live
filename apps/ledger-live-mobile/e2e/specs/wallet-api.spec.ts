import * as detox from "detox"; // this is because we need to use both the jest expect and the detox.expect version, which has some different assertions
import { loadConfig } from "../bridge/server";
import PortfolioPage from "../models/wallet/portfolioPage";
import { delay, isAndroid } from "../helpers";
import * as server from "../../../ledger-live-desktop/tests/utils/serve-dummy-app";
import DiscoveryPage from "../models/discover/discoverPage";
import { LiveApp } from "../models/discover/liveApp";

let portfolioPage: PortfolioPage;
let discoverPage: DiscoveryPage;
let liveApp: LiveApp;

let continueTest: boolean;

describe("Wallet API methods", () => {
  // {
  //   "id": "multibuy",
  //   "name": "Buy / Sell Preview App",
  //   "url": "https://buy-sell-live-app.vercel.app",
  //   "homepageUrl": "https://buy-sell-live-app.vercel.app",
  //   "icon": "",
  //   "platform": "all",
  //   "apiVersion": "0.0.1",
  //   "manifestVersion": "1",
  //   "branch": "stable",
  //   "categories": ["exchange", "buy"],
  //   "currencies": ["ethereum", "bitcoin"],
  //   "content": {
  //     "shortDescription": {
  //       "en": "Preview app for Buy/Sell"
  //     },
  //     "description": {
  //       "en": "Preview app for Buy/Sell"
  //     }
  //   },
  //   "permissions": [
  //     {
  //       "method": "account.request",
  //       "params": {
  //         "currencies": ["ethereum", "bitcoin"]
  //       }
  //     }
  //   ],
  //   "domains": ["https://*"]
  // }

  beforeAll(async () => {
    // Check that dummy app in tests/utils/dummy-app-build has been started successfully
    try {
      const port = await server.start(
        "../../../ledger-live-desktop/tests/utils/dummy-wallet-app/build",
        52619,
      );

      await detox.device.reverseTcpPort(52619); // To allow the android emulator to access the dummy app

      const url = `http://localhost:${port}`;
      const response = await fetch(url);
      if (response.ok) {
        continueTest = true;

        // eslint-disable-next-line no-console
        console.info(
          `========> Dummy Wallet API app successfully running on port ${port}! <=========`,
        );
      } else {
        throw new Error("Ping response != 200, got: " + response.status);
      }
    } catch (error) {
      console.warn(`========> Dummy test app not running! <=========`);
      console.error(error);

      continueTest = false;
    }

    // start navigation
    portfolioPage = new PortfolioPage();
    discoverPage = new DiscoveryPage();
    liveApp = new LiveApp();

    loadConfig("1AccountBTC1AccountETHReadOnlyFalse", true);
    // loadLocalManifest();
  });

  afterAll(() => {
    server.stop();
  });

  it("should load LLM", async () => {
    if (!continueTest || !isAndroid()) {
      return; // need to make this a proper ignore/jest warning
    }

    await portfolioPage.waitForPortfolioPageToLoad();
    await discoverPage.openViaDeeplink("dummy-live-app");

    const title = await detox.web.element(detox.by.web.id("image-container")).getTitle();
    expect(title).toBe("Dummy Wallet API App");

    const url = await detox.web.element(detox.by.web.id("param-container")).getCurrentUrl();
    expect(url).toBe("http://localhost:52619/?theme=light&lang=en&name=Dummy+Wallet+API+Live+App");

    liveApp.send({
      method: "account.request",
      params: {
        currencyIds: ["ethereum", "bitcoin"],
      },
    });

    // await delay(20000);
  });
});
