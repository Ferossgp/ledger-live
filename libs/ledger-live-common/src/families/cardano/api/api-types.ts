import { ProtocolParams } from "../types";

type APIToken = { assetName: string; policyId: string; value: string };

type APIMetadata = { label: string; value: string };

export enum HashType {
  ADDRESS = "ADDRESS",
  SCRIPT = "SCRIPT",
}

export type StakeCredential = {
  key: string;
  type: HashType;
};

export type StakeKeyRegistrationCertificate = {
  stakeCredential: StakeCredential;
};

export type StakeKeyDeRegistrationCertificate = {
  stakeCredential: StakeCredential;
};

export type StakeDelegationCertificate = {
  stakeCredential: StakeCredential & {
    poolKeyHash: string;
  };
};

export type TransactionCertificate =
  | StakeKeyRegistrationCertificate
  | StakeKeyDeRegistrationCertificate
  | StakeDelegationCertificate;

export type TransactionCertificates = {
  stakeRegistrations: Array<StakeKeyRegistrationCertificate>;
  stakeDeRegistrations: Array<StakeKeyDeRegistrationCertificate>;
  stakeDelegations: Array<StakeDelegationCertificate>;
};

export type APITransaction = {
  fees: string;
  hash: string;
  timestamp: string;
  blockHeight: number;
  inputs: Array<{
    txId: string;
    index: number;
    address: string;
    value: string;
    paymentKey: string;
    tokens: Array<APIToken>;
  }>;
  certificate: TransactionCertificates;
  outputs: Array<{
    address: string;
    value: string;
    paymentKey: string;
    tokens: Array<APIToken>;
  }>;
  metadata?: {
    data: Array<APIMetadata>;
  };
};

export type APINetworkInfo = {
  protocolParams: ProtocolParams;
};

export type APIDelegation = {
  status: boolean;
  stakeCredential: {
    key: string;
    type: string;
  };
  stake: string;
  rewardsAvailable: string;
  rewardsWithdrawn: string;
  poolInfo: {
    poolId: string;
    name: string;
    ticker: string;
  };
};

export type StakePool = {
  poolId: string;
  name: string | undefined;
  ticker: string | undefined;
  website: string | undefined;
  margin: string;
  cost: string;
  pledge: string;
  retiredEpoch: number | undefined;
  liveStake: string;
};

export type APIGetPoolList = {
  pageNo: number;
  limit: number;
  count: number;
  pools: Array<StakePool>;
};
