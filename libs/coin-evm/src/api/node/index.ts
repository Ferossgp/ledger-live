import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { RpcApi } from "./types";
import rpcNodeApi from "./rpc";

export const getNodeApi = (currency: CryptoCurrency): RpcApi => {
  switch (currency.ethereumLikeInfo?.node?.type) {
    case "external":
      return rpcNodeApi;

    default:
      throw new Error();
  }
};
