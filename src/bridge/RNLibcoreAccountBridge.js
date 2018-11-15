// @flow
import invariant from "invariant";
import LRU from "lru-cache";
import { BigNumber } from "bignumber.js";
import { FeeNotLoaded } from "@ledgerhq/live-common/lib/errors";

import type { AccountBridge } from "./types";

import { getFeeItems } from "../api/FeesBitcoin";
import type { FeeItems } from "../api/FeesBitcoin";
import { syncAccount } from "../libcore/syncAccount";
import { isValidRecipient } from "../libcore/isValidRecipient";
import { getFeesForTransaction } from "../libcore/getFeesForTransaction";
import libcoreSignAndBroadcast from "../libcore/signAndBroadcast";

export type Transaction = {
  amount: BigNumber,
  recipient: string,
  feePerByte: ?BigNumber,
  networkInfo: ?{ feeItems: FeeItems },
};

const serializeTransaction = t => {
  // FIXME there is literally no need for serializeTransaction in mobile context
  const { feePerByte } = t;
  return {
    recipient: t.recipient,
    amount: t.amount.toString(),
    feePerByte: (feePerByte && feePerByte.toString()) || "0",
  };
};

const startSync = (initialAccount, _observation) => syncAccount(initialAccount);

const recipientValidLRU = LRU({ max: 100 });

const checkValidRecipient = (currency, recipient) => {
  const key = `${currency.id}_${recipient}`;
  let promise = recipientValidLRU.get(key);
  if (promise) return promise;
  if (!recipient) return Promise.resolve(null);
  promise = isValidRecipient({ currency, recipient });
  recipientValidLRU.set(key, promise);
  return promise;
};

const createTransaction = () => ({
  amount: BigNumber(0),
  recipient: "",
  feePerByte: undefined,
  networkInfo: null,
});

const fetchTransactionNetworkInfo = async ({ currency }) => {
  const feeItems = await getFeeItems(currency);

  return { feeItems };
};

const getTransactionNetworkInfo = (account, transaction) =>
  transaction.networkInfo;

const applyTransactionNetworkInfo = (account, transaction, networkInfo) => ({
  ...transaction,
  networkInfo,
  feePerByte: transaction.feePerByte || networkInfo.feeItems.defaultFeePerByte,
});

const editTransactionAmount = (account, t, amount) => ({
  ...t,
  amount,
});

const getTransactionAmount = (a, t) => t.amount;

const editTransactionRecipient = (account, t, recipient) => ({
  ...t,
  recipient,
});

const getTransactionRecipient = (a, t) => t.recipient;

const editTransactionExtra = (a, t, field, value) => {
  switch (field) {
    case "feePerByte":
      invariant(
        !value || BigNumber.isBigNumber(value),
        "editTransactionExtra(a,t,'feePerByte',value): BigNumber value expected",
      );
      return { ...t, feePerByte: value };

    default:
      return t;
  }
};

const getTransactionExtra = (a, t, field) => {
  switch (field) {
    case "feePerByte":
      return t.feePerByte;

    default:
      return undefined;
  }
};

const signAndBroadcast = (account, transaction, deviceId) =>
  libcoreSignAndBroadcast({
    accountId: account.id,
    blockHeight: account.blockHeight,
    currencyId: account.currency.id,
    derivationMode: account.derivationMode,
    seedIdentifier: account.seedIdentifier,
    xpub: account.xpub || "",
    index: account.index,
    transaction,
    deviceId,
  });

const addPendingOperation = (account, optimisticOperation) => ({
  ...account,
  pendingOperations: [...account.pendingOperations, optimisticOperation],
});

const feesLRU = LRU({ max: 100 });

const getFeesKey = (a, t) =>
  `${a.id}_${a.blockHeight || 0}_${t.amount.toString()}_${t.recipient}_${
    t.feePerByte ? t.feePerByte.toString() : ""
  }`;

const getFees = async (a, t) => {
  await checkValidRecipient(a.currency, t.recipient);

  const key = getFeesKey(a, t);
  let promise = feesLRU.get(key);
  if (promise) return promise;

  promise = getFeesForTransaction({
    account: a,
    transaction: serializeTransaction(t),
  });
  feesLRU.set(key, promise);
  return promise;
};

const checkValidTransaction = async (a, t) =>
  // $FlowFixMe
  !t.feePerByte
    ? Promise.reject(new FeeNotLoaded())
    : !t.amount
      ? Promise.resolve(null)
      : getFees(a, t).then(() => null);

const getTotalSpent = async (a, t) =>
  t.amount.isZero()
    ? Promise.resolve(BigNumber(0))
    : getFees(a, t)
        .then(totalFees => t.amount.plus(totalFees || 0))
        .catch(() => BigNumber(0));

const getMaxAmount = async (a, t) =>
  getFees(a, t)
    .catch(() => BigNumber(0))
    .then(totalFees => a.balance.minus(totalFees || 0));

const bridge: AccountBridge<Transaction> = {
  startSync,
  checkValidRecipient,
  createTransaction,
  fetchTransactionNetworkInfo,
  getTransactionNetworkInfo,
  applyTransactionNetworkInfo,
  editTransactionAmount,
  getTransactionAmount,
  editTransactionRecipient,
  getTransactionRecipient,
  editTransactionExtra,
  getTransactionExtra,
  checkValidTransaction,
  getTotalSpent,
  getMaxAmount,
  signAndBroadcast,
  addPendingOperation,
};

export default bridge;
