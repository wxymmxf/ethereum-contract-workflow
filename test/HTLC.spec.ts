import assert from "assert";
import ganache from "ganache-cli";
import path from "path";
import Web3 from "web3";
import { Contract } from "web3-eth-contract";

// 1. 拿到 bytecode
const contractPath = path.resolve(__dirname, "../compiled/HashedTimelock.json");
const { abi, evm } = require(contractPath);

// 2. 配置 provider
const web3 = new Web3(ganache.provider());

let accounts: string[];
let contract: Contract;
let htlc: Contract;
const {
  bufToStr,
  getBalance,
  htlcArrayToObj,
  isSha256Hash,
  newSecretHashPair,
  nowSeconds,
  random32,
  txContractId,
  txGas,
  txLoggedArgs,
} = require('./helper/utils')
const hourSeconds = 3600
const timeLock1Hour = nowSeconds() + hourSeconds
const oneFinney = web3.utils.toWei(web3.utils.toBN(1), 'finney')
const hashPair = newSecretHashPair()

describe("contract", () => {
  // 3. 每次跑单测时需要部署全新的合约实例，起到隔离的作用
  beforeEach(async () => {
    // 1.1 拿到 ganache 本地测试网络的账号
    accounts = await web3.eth.getAccounts();

    htlc = await new web3.eth.Contract(abi)
      .deploy({ data: evm.bytecode.object })
      .send({ from: accounts[0], gas: 1000000 });
  });
  const sender = accounts[0]
  const receiver = accounts[1]
  it('newContract() should create new contract and store correct details', async () => {
    const hashPair = newSecretHashPair()
    const txReceipt = await htlc.methods.newContract(
      receiver,
      hashPair.hash,
      timeLock1Hour,
      {
        from: sender,
        value: oneFinney,
      }
    )
    const logArgs = txLoggedArgs(txReceipt)

    const contractId = logArgs.contractId
    assert(isSha256Hash(contractId))

    assert.equal(logArgs.sender, sender)
    assert.equal(logArgs.receiver, receiver)
    // assertEqualBN(logArgs.amount, oneFinney)
    assert.equal(logArgs.hashlock, hashPair.hash)
    assert.equal(logArgs.timelock, timeLock1Hour)

    const contractArr = await htlc.methods.getContract.call(contractId)
    const contract = htlcArrayToObj(contractArr)
    assert.equal(contract.sender, sender)
    assert.equal(contract.receiver, receiver)
    // assertEqualBN(contract.amount, oneFinney)
    assert.equal(contract.hashlock, hashPair.hash)
    assert.equal(contract.timelock.toNumber(), timeLock1Hour)
    assert.ok(contract.withdrawn)
    assert.ok(contract.refunded)
    assert.equal(
      contract.preimage,
      '0x0000000000000000000000000000000000000000000000000000000000000000'
    )
  })
});
