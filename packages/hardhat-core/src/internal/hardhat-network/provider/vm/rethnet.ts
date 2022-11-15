import { BlockchainInterface } from "@nomicfoundation/ethereumjs-blockchain";
import { Block } from "@nomicfoundation/ethereumjs-block";
import { Common } from "@nomicfoundation/ethereumjs-common";
import { Message } from "@nomicfoundation/ethereumjs-evm";
import { StateManager } from "@nomicfoundation/ethereumjs-statemanager";
import {
  Account,
  Address,
  bufferToBigInt,
} from "@nomicfoundation/ethereumjs-util";
import { TypedTransaction } from "@nomicfoundation/ethereumjs-tx";
import { RunTxResult } from "@nomicfoundation/ethereumjs-vm";
import { Rethnet } from "rethnet-evm";

import { NodeConfig } from "../node-types";
import {
  createRethnetFromHardhatDB,
  ethereumjsTransactionToRethnet,
  HardhatDB,
  rethnetResultToRunTxResult,
} from "../utils/convertToRethnet";
import { hardforkGte, HardforkName } from "../../../util/hardforks";
import { RpcDebugTraceOutput } from "../output";

import { VMAdapter } from "./vm-adapter";

/* eslint-disable @nomiclabs/hardhat-internal-rules/only-hardhat-error */
/* eslint-disable @typescript-eslint/no-unused-vars */

export class RethnetAdapter implements VMAdapter {
  constructor(
    private _rethnet: Rethnet,
    private readonly _selectHardfork: (blockNumber: bigint) => string
  ) {}

  public static async create(
    stateManager: StateManager,
    blockchain: BlockchainInterface,
    config: NodeConfig,
    selectHardfork: (blockNumber: bigint) => string
  ): Promise<RethnetAdapter> {
    const hardhatDB = new HardhatDB(stateManager, blockchain);

    const limitContractCodeSize =
      config.allowUnlimitedContractSize === true ? 2n ** 64n - 1n : undefined;

    const rethnet = createRethnetFromHardhatDB(
      {
        chainId: BigInt(config.chainId),
        limitContractCodeSize,
        disableBlockGasLimit: true,
        disableEip3607: true,
      },
      hardhatDB
    );

    return new RethnetAdapter(rethnet, selectHardfork);
  }

  public async dryRun(
    tx: TypedTransaction,
    blockContext: Block,
    forceBaseFeeZero?: boolean
  ): Promise<RunTxResult> {
    const rethnetTx = ethereumjsTransactionToRethnet(tx);

    const difficulty = this._getBlockEnvDifficulty(
      blockContext.header.number,
      blockContext.header.difficulty,
      bufferToBigInt(blockContext.header.mixHash)
    );

    await this._rethnet.guaranteeTransaction(rethnetTx);
    const rethnetResult = await this._rethnet.dryRun(rethnetTx, {
      number: blockContext.header.number,
      coinbase: blockContext.header.coinbase.buf,
      timestamp: blockContext.header.timestamp,
      basefee:
        forceBaseFeeZero === true ? 0n : blockContext.header.baseFeePerGas,
      gasLimit: blockContext.header.gasLimit,
      difficulty,
    });

    return rethnetResultToRunTxResult(rethnetResult.execResult);
  }

  public getCommon(): Common {
    throw new Error("not implemented");
  }

  public async getStateRoot(): Promise<Buffer> {
    throw new Error("not implemented");
  }

  public async getAccount(address: Address): Promise<Account> {
    throw new Error("not implemented");
  }
  public async getContractStorage(
    address: Address,
    key: Buffer
  ): Promise<Buffer> {
    throw new Error("not implemented");
  }
  public async getContractCode(address: Address): Promise<Buffer> {
    throw new Error("not implemented");
  }
  public async putAccount(address: Address, account: Account): Promise<void> {
    throw new Error("not implemented");
  }
  public async putContractCode(address: Address, value: Buffer): Promise<void> {
    throw new Error("not implemented");
  }
  public async putContractStorage(
    address: Address,
    key: Buffer,
    value: Buffer
  ): Promise<void> {
    throw new Error("not implemented");
  }

  public async revertToStateRoot(): Promise<void> {
    throw new Error("not implemented");
  }

  public async restoreBlockContext(stateRoot: Buffer): Promise<void> {
    throw new Error("not implemented");
  }

  public enableTracing(callbacks: {
    beforeMessage: (message: Message, next: any) => Promise<void>;
    step: () => Promise<void>;
    afterMessage: () => Promise<void>;
  }): void {
    throw new Error("not implemented");
  }

  public disableTracing(): void {
    throw new Error("not implemented");
  }

  public async traceTransaction(): Promise<RpcDebugTraceOutput> {
    throw new Error("not implemented");
  }

  public async setBlockContext(): Promise<void> {
    throw new Error("not implemented");
  }

  public isEip1559Active(): boolean {
    throw new Error("not implemented");
  }

  public async startBlock(): Promise<void> {
    throw new Error("not implemented");
  }

  public async runTxInBlock(
    tx: TypedTransaction,
    block: Block
  ): Promise<RunTxResult> {
    throw new Error("not implemented");
  }

  public async addBlockRewards(
    rewards: Array<[Address, bigint]>
  ): Promise<void> {
    throw new Error("not implemented");
  }

  public async sealBlock(): Promise<void> {
    throw new Error("not implemented");
  }

  public async revertBlock(): Promise<void> {
    throw new Error("not implemented");
  }

  private _getBlockEnvDifficulty(
    blockNumber: bigint,
    difficulty: bigint | undefined,
    mixHash: bigint | undefined
  ): bigint | undefined {
    const hardfork = this._selectHardfork(blockNumber);
    const isPostMergeHardfork = hardforkGte(
      hardfork as HardforkName,
      HardforkName.MERGE
    );

    if (isPostMergeHardfork) {
      return mixHash;
    }

    return difficulty;
  }
}
