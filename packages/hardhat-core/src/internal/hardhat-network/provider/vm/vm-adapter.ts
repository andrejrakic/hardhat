import { Block } from "@nomicfoundation/ethereumjs-block";
import { Common } from "@nomicfoundation/ethereumjs-common";
import {
  EVMResult,
  InterpreterStep,
  Message,
} from "@nomicfoundation/ethereumjs-evm";
import { TypedTransaction } from "@nomicfoundation/ethereumjs-tx";
import { Account, Address } from "@nomicfoundation/ethereumjs-util";
import { RunTxResult } from "@nomicfoundation/ethereumjs-vm";
import { RpcDebugTracingConfig } from "../../../core/jsonrpc/types/input/debugTraceTransaction";
import { RpcDebugTraceOutput } from "../output";

export interface VMAdapter {
  dryRun(
    tx: TypedTransaction,
    blockContext: Block,
    forceBaseFeeZero?: boolean
  ): Promise<RunTxResult>;
  getCommon(): Common;
  getStateRoot(): Promise<Buffer>;
  getAccount(address: Address): Promise<Account>;
  getContractStorage(address: Address, key: Buffer): Promise<Buffer>;
  getContractCode(address: Address): Promise<Buffer>;
  putAccount(address: Address, account: Account): Promise<void>;
  putContractCode(address: Address, value: Buffer): Promise<void>;
  putContractStorage(
    address: Address,
    key: Buffer,
    value: Buffer
  ): Promise<void>;

  revertToStateRoot(stateRoot: Buffer): Promise<void>;
  restoreBlockContext(stateRoot: Buffer): Promise<void>;
  setBlockContext(
    block: Block,
    irregularStateOrUndefined: Buffer | undefined
  ): Promise<void>;

  startBlock(): Promise<void>;
  runTxInBlock(tx: TypedTransaction, block: Block): Promise<RunTxResult>;
  addBlockRewards(rewards: Array<[Address, bigint]>): Promise<void>;
  sealBlock(): Promise<void>;
  revertBlock(): Promise<void>;

  traceTransaction(
    hash: Buffer,
    block: Block,
    config: RpcDebugTracingConfig
  ): Promise<RpcDebugTraceOutput>;

  enableTracing(callbacks: {
    beforeMessage: (message: Message, next: any) => Promise<void>;
    step: (step: InterpreterStep, next: any) => Promise<void>;
    afterMessage: (result: EVMResult, next: any) => Promise<void>;
  }): void;

  disableTracing(): void;

  isEip1559Active(blockNumberOrPending?: bigint | "pending"): boolean;
}
