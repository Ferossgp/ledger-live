import {
  getElementByText,
  tapByText,
  tapByElement,
  getElementById,
  waitForElementByText,
  waitForElementById,
  tapById,
} from "../../helpers";
import * as bridge from "../../bridge/server";

export default class OnboardingSteps {
  getStartedButtonId = "onboarding-getStarted-button";
  devicePairedContinueButtonId = "onboarding-paired-continue";
  onboardingGetStartedButton = () => getElementById(this.getStartedButtonId);
  accessWalletButton = () =>
    getElementById("Onboarding PostWelcome - Selection|Access an existing wallet");
  noLedgerYetButton = () => getElementById("onboarding-noLedgerYet");
  exploreAppButton = () => getElementById("onboarding-noLedgerYetModal-explore");
  discoverLiveTitle = (index: number) => `onboarding-discoverLive-${index}-title`;
  exploreWithoutDeviceButton = () => getElementById("discoverLive-exploreWithoutADevice");
  connectLedgerButton = () => getElementById("Existing Wallet | Connect");
  continueButton = () => getElementById(this.devicePairedContinueButtonId);
  pairDeviceButton = () => getElementById("pair-device");
  pairNanoButton = () => getElementById("Onboarding-PairNewNano");
  nanoDeviceButton = (name = "") => getElementByText(`Nano X de ${name}`);
  maybeLaterButton = () => getElementById("notifications-prompt-later");

  async startOnboarding() {
    await waitForElementById(this.getStartedButtonId);
    await tapByElement(this.onboardingGetStartedButton());
  }

  async chooseToAccessYourWallet() {
    await tapByElement(this.accessWalletButton());
  }

  async chooseNoLedgerYet() {
    await tapByElement(this.noLedgerYetButton());
  }

  async chooseToExploreApp() {
    await tapByElement(this.exploreAppButton());
  }

  async chooseToExploreWithoutDevice() {
    await waitForElementById(this.discoverLiveTitle(3));
    await tapByElement(this.exploreWithoutDeviceButton());
  }

  async selectYourDevice(device: string) {
    await tapByText(device);
  }

  async chooseToConnectYourLedger() {
    await tapByElement(this.connectLedgerButton());
  }

  async chooseToPairMyNano() {
    await tapByElement(this.pairNanoButton());
  }

  async selectPairWithBluetooth() {
    await tapByElement(this.pairDeviceButton());
  }

  async addDeviceViaBluetooth(name = "David") {
    bridge.addDevices();
    await waitForElementByText(`Nano X de ${name}`);

    await tapByElement(this.nanoDeviceButton(name));

    bridge.setInstalledApps(); // tell LLM what apps the mock device has

    bridge.open(); // Mocked action open ledger manager on the Nano
  }

  async openLedgerLive() {
    await waitForElementById(this.devicePairedContinueButtonId);
    await tapByElement(this.continueButton());
  }

  async declineNotifications() {
    await tapByElement(this.maybeLaterButton());
  }
}
