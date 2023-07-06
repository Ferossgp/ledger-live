import type { AccountBridge } from "@ledgerhq/types-live";
import { patchOperationWithHash } from "@ledgerhq/coin-framework/operation";
import { Transaction as EvmTransaction } from "./types";
import { getNodeApi } from "./api/node/index";

/**
 * Broadcast a transaction and update the operation linked
 */
export const broadcast: AccountBridge<EvmTransaction>["broadcast"] = async ({
  account,
  signedOperation: { signature, operation },
}) => {
  const rpcApi = getNodeApi(account.currency);
  const hash = await rpcApi.broadcastTransaction(account.currency, signature);
  return patchOperationWithHash(operation, hash);
};

export default broadcast;
