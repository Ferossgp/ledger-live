import { ethers } from "ethers";
import {
  Transaction as EvmTransaction,
  EvmTransactionEIP1559,
  EvmTransactionLegacy,
} from "../types";

/**
 * Adapter to convert a Ledger Live transaction to an Ethers transaction
 */
export const transactionToEthersTransaction = (tx: EvmTransaction): ethers.Transaction => {
  const ethersTx = {
    to: tx.recipient,
    value: ethers.BigNumber.from(tx.amount.toFixed()),
    data: tx.data ? `0x${tx.data.toString("hex")}` : undefined,
    gasLimit: ethers.BigNumber.from(tx.gasLimit.toFixed()),
    nonce: tx.nonce,
    chainId: tx.chainId,
    type: tx.type,
  } as Partial<ethers.Transaction>;

  // is EIP-1559 transaction (type 2)
  if (tx.type === 2) {
    ethersTx.maxFeePerGas = ethers.BigNumber.from(
      (tx as EvmTransactionEIP1559).maxFeePerGas.toFixed(),
    );
    ethersTx.maxPriorityFeePerGas = ethers.BigNumber.from(
      (tx as EvmTransactionEIP1559).maxPriorityFeePerGas.toFixed(),
    );
  } else {
    // is Legacy transaction (type 0)
    ethersTx.gasPrice = ethers.BigNumber.from((tx as EvmTransactionLegacy).gasPrice.toFixed());
  }

  return ethersTx as ethers.Transaction;
};
