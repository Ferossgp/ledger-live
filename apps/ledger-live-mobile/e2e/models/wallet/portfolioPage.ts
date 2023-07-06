import {
  getElementById,
  getElementByText,
  getTextOfElement,
  openDeeplink,
  scrollToId,
  tapByElement,
  waitForElementById,
  waitForElementByText,
} from "../../helpers";

const baseLink = "portfolio";
export default class PortfolioPage {
  zeroBalance = "$0.00";
  graphCardBalanceId = "graphCard-balance";
  assetBalanceRegex = /asset-balance-[A-Z]+/i;
  readOnlyPortfolioId = "PortfolioReadOnlyList";
  emptyPortfolioComponent = () => getElementById("PortfolioEmptyAccount");
  portfolioSettingsButton = () => getElementById("settings-icon");
  transferButton = () => getElementById("transfer-button");
  swapTransferMenuButton = () => getElementById("swap-transfer-button");

  async navigateToSettings() {
    await tapByElement(this.portfolioSettingsButton());
  }

  async openTransferMenu() {
    await tapByElement(this.transferButton());
  }

  async navigateToSwapFromTransferMenu() {
    await tapByElement(this.swapTransferMenuButton());
  }

  async waitForPortfolioPageToLoad() {
    await waitForElementById("settings-icon");
  }

  async waitForPortfolioReadOnly() {
    await waitForElementById(this.readOnlyPortfolioId);
    expect(await getTextOfElement(this.graphCardBalanceId)).toBe(this.zeroBalance);
    await scrollToId(this.assetBalanceRegex, 4, this.readOnlyPortfolioId);
    for (var index = 0; index < 4; index++)
      expect(await getTextOfElement(this.assetBalanceRegex, index)).toBe(this.zeroBalance);
  }

  async openViaDeeplink() {
    await openDeeplink(baseLink);
  }
}
