import CosmosBase from "./cosmosBase";

class Persistence extends CosmosBase {
  stakingDocUrl: string;
  unbondingPeriod: number;
  validatorPrefix: string;
  lcd!: string;
  ledgerValidator!: string;
  prefix: string;

  constructor() {
    super();
    this.stakingDocUrl =
      "https://support.ledger.com/hc/en-us/articles/9604540043421?support=true";
    this.unbondingPeriod = 28;
    this.prefix = "persistence";
    this.validatorPrefix = `${this.prefix}valoper`;
    this.minGasprice = 0.025;
  }
}

export default Persistence;
