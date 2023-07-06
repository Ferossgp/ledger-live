import { expect } from "detox";
import OnboardingSteps from "../models/onboarding/onboardingSteps";
import PortfolioPage from "../models/wallet/portfolioPage";

let onboardingSteps: OnboardingSteps;
let portfolioPage: PortfolioPage;

describe("Onboarding - Read Only", () => {
  beforeAll(() => {
    onboardingSteps = new OnboardingSteps();
    portfolioPage = new PortfolioPage();
  });

  it("starts Onboarding", async () => {
    await onboardingSteps.startOnboarding();
  });

  it("selects I don't have a Ledger Yet", async () => {
    await onboardingSteps.chooseNoLedgerYet();
  });

  it("chooses to explore the app", async () => {
    await onboardingSteps.chooseToExploreApp();
  });

  it("skips dicover carousel and choses explore app", async () => {
    await onboardingSteps.chooseToExploreWithoutDevice();
  });

  it("opens Ledger Live", async () => {
    await portfolioPage.waitForPortfolioPageToLoad();
    await expect(portfolioPage.portfolioSettingsButton()).toBeVisible();
  });

  it("should see an empty portfolio page", async () => {
    await portfolioPage.waitForPortfolioReadOnly();
  });
});
