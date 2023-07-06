import { by, device, element, waitFor } from "detox";
import { Direction } from "react-native-modal";

const DEFAULT_TIMEOUT = 60000;
const BASE_DEEPLINK = "ledgerlive://";
export const currencyParam = "?currency=";
export const recipientParam = "&recipient=";
export const amountParam = "&amount=";
export const accountIdParam = "?accountId=";

export function waitForElementById(id: string | RegExp, timeout: number = DEFAULT_TIMEOUT) {
  return waitFor(getElementById(id)).toBeVisible().withTimeout(timeout);
}

export function waitForElementByText(text: string | RegExp, timeout: number = DEFAULT_TIMEOUT) {
  return waitFor(getElementByText(text)).toBeVisible().withTimeout(timeout);
}

export function getElementById(id: string | RegExp, index: number = 0) {
  return element(by.id(id)).atIndex(index);
}

export function getElementByText(text: string | RegExp, index: number = 0) {
  return element(by.text(text)).atIndex(index);
}

export function tapById(id: string | RegExp) {
  return getElementById(id).tap();
}

export function tapByText(text: string | RegExp) {
  return getElementByText(text).tap();
}

export function tapByElement(elem: Detox.NativeElement) {
  return elem.tap();
}

export async function typeTextById(id: string | RegExp, text: string, focus = true) {
  if (focus) {
    await tapById(id);
  }
  return getElementById(id).typeText(text);
}

export async function typeTextByElement(elem: Detox.NativeElement, text: string, focus = true) {
  if (focus) {
    await tapByElement(elem);
  }

  await elem.typeText(text);
}

export async function clearTextByElement(elem: Detox.NativeElement) {
  return elem.clearText();
}

export async function scrollToText(
  text: string | RegExp,
  index = 0,
  scrollViewId: string | RegExp,
  pixels = 100,
  direction: Direction = "down",
) {
  await waitFor(getElementByText(text, index))
    .toBeVisible()
    .whileElement(by.id(scrollViewId))
    .scroll(pixels, direction);
}

export async function scrollToId(
  id: string | RegExp,
  index: number = 0,
  scrollViewId: string | RegExp,
  pixels = 100,
  direction: Direction = "down",
) {
  await waitFor(getElementById(id, index))
    .toBeVisible()
    .whileElement(by.id(scrollViewId))
    .scroll(pixels, direction, NaN, 0.8);
}

export async function getTextOfElement(id: string | RegExp, index: number = 0) {
  let attributes = await getElementById(id, index).getAttributes();
  return !("elements" in attributes) ? attributes.text : attributes.elements[index].text;
}

/**
 * Waits for a specified amount of time
 * /!\ Do not use it to wait for a specific element, use waitFor instead.
 * @param {number} ms
 */
export async function delay(ms: number) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve("delay complete");
    }, ms);
  });
}

export async function openDeeplink(link?: string) {
  await device.openURL({ url: BASE_DEEPLINK + link });
}

export async function isAndroid() {
  return device.getPlatform() === "android";
}
