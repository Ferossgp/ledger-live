import { ethers } from "ethers";
import BigNumber from "bignumber.js";
import { log } from "@ledgerhq/logs";
import { getEnv } from "@ledgerhq/live-env";
import { delay } from "@ledgerhq/live-promise";
import axios, { AxiosRequestConfig } from "axios";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Batcher } from "@ledgerhq/coin-framework/batcher/types";
import { makeBatcher } from "@ledgerhq/coin-framework/batcher/index";
import { GasEstimationError, LedgerNodeUsedIncorrectly } from "../../errors";
import OptimismGasPriceOracleAbi from "../../abis/optimismGasPriceOracle.abi.json";
import { getSerializedTransaction } from "../../transaction";
import { LedgerExplorerOperation } from "../../types";
import { RpcApi, isLedgerNodeConfig } from "./types";
import { padHexString } from "../../logic";

export const LEDGER_TIMEOUT = 200; // 200ms between 2 calls
export const DEFAULT_RETRIES_API = 2;

export async function fetchWithRetries<T>(
  params: AxiosRequestConfig,
  retries = DEFAULT_RETRIES_API,
): Promise<T> {
  try {
    const { data } = await axios.request<T>({
      ...params,
      headers: {
        ...(params.headers || {}),
        "X-Ledger-Client-Version": getEnv("LEDGER_CLIENT_VERSION"),
      },
    });

    return data;
  } catch (e) {
    if (retries) {
      // wait the API timeout before trying again
      await delay(LEDGER_TIMEOUT);
      // decrement with prefix here or it won't work
      return fetchWithRetries<T>(params, --retries);
    }
    throw e;
  }
}

// Map of request batcher by Currency
const tokenBalancesBatchersMap = new Map<
  CryptoCurrency,
  Batcher<
    {
      address: string;
      contract: string;
    },
    BigNumber
  >
>();

/**
 * Get a transaction by hash
 */
export const getTransaction: RpcApi["getTransaction"] = async (currency, hash) => {
  const { node } = currency.ethereumLikeInfo || {};
  if (!isLedgerNodeConfig(node)) {
    throw new LedgerNodeUsedIncorrectly();
  }

  const ledgerTransaction = await fetchWithRetries<LedgerExplorerOperation>({
    method: "GET",
    url: `${getEnv("EXPLORER")}/blockchain/v4/${node.explorerId}/tx/${hash}`,
  });

  return {
    hash: ledgerTransaction.hash,
    blockHeight: ledgerTransaction.block.height,
    blockHash: ledgerTransaction.block.hash,
    nonce: ledgerTransaction.nonce_value,
  };
};

/**
 * Get the balance of an address
 */
export const getCoinBalance: RpcApi["getCoinBalance"] = async (currency, address) => {
  const { node } = currency.ethereumLikeInfo || {};
  if (!isLedgerNodeConfig(node)) {
    throw new LedgerNodeUsedIncorrectly();
  }

  const { balance } = await fetchWithRetries<{ address: string; balance: string }>({
    method: "GET",
    url: `${getEnv("EXPLORER")}/blockchain/v4/${node.explorerId}/address/${address}/balance`,
  });

  return new BigNumber(balance);
};

/**
 * Get the balance of multiples tokens for addresses
 */
export const getBatchTokenBalances = async (
  input: { address: string; contract: string }[],
  params: { currency: CryptoCurrency },
): Promise<BigNumber[]> => {
  const { currency } = params;
  const { node } = currency.ethereumLikeInfo || {};
  if (!isLedgerNodeConfig(node)) {
    throw new LedgerNodeUsedIncorrectly();
  }

  const balances = await fetchWithRetries<
    Array<{
      address: string;
      contract: string;
      balance: string;
    }>
  >({
    method: "POST",
    url: `${getEnv("EXPLORER")}/blockchain/v4/${node.explorerId}/erc20/balances`,
    data: input,
  });

  return balances.map(({ balance }) => new BigNumber(balance));
};

/**
 * Get the balance of an address for an ERC20 token
 */
export const getTokenBalance: RpcApi["getTokenBalance"] = async (
  currency,
  address,
  contractAddress,
) => {
  const { node } = currency.ethereumLikeInfo || {};
  if (!isLedgerNodeConfig(node)) {
    throw new LedgerNodeUsedIncorrectly();
  }

  if (!tokenBalancesBatchersMap.has(currency)) {
    const batcher = makeBatcher(getBatchTokenBalances, { currency });
    tokenBalancesBatchersMap.set(currency, batcher);
  }
  const requestBatcher = tokenBalancesBatchersMap.get(currency)!;

  return requestBatcher({ address, contract: contractAddress });
};

/**
 * Get account nonce
 */
export const getTransactionCount: RpcApi["getTransactionCount"] = async (currency, address) => {
  const { node } = currency.ethereumLikeInfo || {};
  if (!isLedgerNodeConfig(node)) {
    throw new LedgerNodeUsedIncorrectly();
  }

  const { nonce } = await fetchWithRetries<{
    address: string;
    nonce: number;
  }>({
    method: "GET",
    url: `${getEnv("EXPLORER")}/blockchain/v4/${node.explorerId}/address/${address}/nonce`,
  });

  return nonce;
};

/**
 * Get an estimated gas limit for a transaction
 */
export const getGasEstimation: RpcApi["getGasEstimation"] = async (account, transaction) => {
  const { currency } = account;
  const { node } = currency.ethereumLikeInfo || {};
  if (!isLedgerNodeConfig(node)) {
    throw new LedgerNodeUsedIncorrectly();
  }

  const { recipient: to, amount: value, data } = transaction;

  try {
    const { estimated_gas_limit: gasEstimation } = await fetchWithRetries<{
      to: string;
      estimated_gas_limit: string;
    }>({
      method: "POST",
      url: `${getEnv("EXPLORER")}/blockchain/v4/${node.explorerId}/tx/estimate-gas-limit`,
      data: {
        from: account.freshAddress, // should be necessary for some estimations
        to,
        value: "0x" + (padHexString(value.toString(16)) || "00"),
        data: data ? `0x${padHexString(data.toString("hex"))}` : "0x",
      },
    });

    return new BigNumber(gasEstimation);
  } catch (e) {
    log("error", "EVM Family: Gas Estimation Error", e);
    throw new GasEstimationError();
  }
};

/**
 * Get an estimation of fees on the network
 */
// Waiting for proxies
export const getFeesEstimation: RpcApi["getFeesEstimation"] = async currency => {
  const { node } = currency.ethereumLikeInfo || {};
  if (!isLedgerNodeConfig(node)) {
    throw new LedgerNodeUsedIncorrectly();
  }

  return {
    maxFeePerGas: null,
    maxPriorityFeePerGas: null,
    gasPrice: null,
  };
};

/**
 * Broadcast a serialized transaction and returns its hash
 */
export const broadcastTransaction: RpcApi["broadcastTransaction"] = async (
  currency,
  signedTxHex,
) => {
  const { node } = currency.ethereumLikeInfo || {};
  if (!isLedgerNodeConfig(node)) {
    throw new LedgerNodeUsedIncorrectly();
  }

  const { result: hash } = await fetchWithRetries<{
    result: string;
  }>({
    method: "POST",
    url: `${getEnv("EXPLORER")}/blockchain/v4/${node.explorerId}/tx/send`,
    data: { tx: signedTxHex },
  });

  return hash;
};

/**
 * Get the informations about a block by block height
 */
export const getBlockByHeight: RpcApi["getBlockByHeight"] = async (
  currency,
  blockHeight = "latest",
) => {
  const { node } = currency.ethereumLikeInfo || {};
  if (!isLedgerNodeConfig(node)) {
    throw new LedgerNodeUsedIncorrectly();
  }

  const { hash, height, time } = await fetchWithRetries<{
    hash: string;
    height: number;
    time: string;
    txs: string[];
  }>({
    method: "GET",
    url:
      blockHeight === "latest"
        ? `${getEnv("EXPLORER")}/blockchain/v4/${node.explorerId}/block/current`
        : `${getEnv("EXPLORER")}/blockchain/v4/${node.explorerId}/block/${blockHeight}`,
  });

  return {
    hash,
    height,
    timestamp: new Date(time).getTime(),
  };
};

/**
 * ⚠️ Blockchain specific
 *
 * For a layer 2 like Optimism, additional fees are needed in order to
 * take into account layer 1 settlement estimated cost.
 * This gas price is served through a smart contract oracle.
 *
 * @see https://help.optimism.io/hc/en-us/articles/4411895794715-How-do-transaction-fees-on-Optimism-work-
 */
//
export const getOptimismAdditionalFees: RpcApi["getOptimismAdditionalFees"] = async (
  currency,
  transaction,
) => {
  const { node } = currency.ethereumLikeInfo || {};
  if (!isLedgerNodeConfig(node)) {
    throw new LedgerNodeUsedIncorrectly();
  }

  if (!["optimism", "optimism_goerli"].includes(currency.id)) {
    return new BigNumber(0);
  }

  // Fake signature is added to get the best approximation possible for the gas on L1
  const serializedTransaction = (() => {
    try {
      return getSerializedTransaction(transaction, {
        r: "0xffffffffffffffffffffffffffffffffffffffff",
        s: "0xffffffffffffffffffffffffffffffffffffffff",
        v: 0,
      });
    } catch (e) {
      return null;
    }
  })();
  if (!serializedTransaction) {
    return new BigNumber(0);
  }

  const optimismGasOracle = new ethers.utils.Interface(OptimismGasPriceOracleAbi);
  const data = optimismGasOracle.encodeFunctionData("getL1Fee(bytes)", [serializedTransaction]);

  const [result] = await fetchWithRetries<
    Array<{
      info: {
        contract: string;
        data: string;
        blockNumber: number | null;
      };
      response: string;
    }>
  >({
    method: "POST",
    url: `${getEnv("EXPLORER")}/blockchain/v4/${node.explorerId}/contract/read`,
    data: [
      {
        // @see https://community.optimism.io/docs/developers/build/transaction-fees/#displaying-fees-to-users
        contract: "0x420000000000000000000000000000000000000F",
        data,
      },
    ],
  });

  return new BigNumber(result.response);
};

const rpcApi: RpcApi = {
  getBlockByHeight,
  getCoinBalance,
  getTokenBalance,
  getTransactionCount,
  getTransaction,
  getGasEstimation,
  getFeesEstimation,
  broadcastTransaction,
  getOptimismAdditionalFees,
};

export default rpcApi;
