import HDWalletProvider from "@truffle/hdwallet-provider";
import fs from "fs-extra";
import path from "path";
import Web3 from "web3";
import { memonic, rinkebyUrl } from "./config";

// 1. 拿到 bytecode
const contractPath = path.resolve(__dirname, "../compiled/ProjectList.json");
const { abi, evm } = require(contractPath);

// 2. 配置 provider
const provider = new HDWalletProvider(memonic, rinkebyUrl);

// 3. 初始化 web3 实例
const web3 = new Web3(provider);

(async () => {
  // 4. 获取钱包里面的账户
  const accounts = await web3.eth.getAccounts();
  console.log("合约部署账户:", accounts[0]);

  // 5. 创建合约实例并且部署
  console.time("合约部署耗时");
  const result = await new web3.eth.Contract(abi)
    .deploy({ data: evm.bytecode.object })
    .send({ from: accounts[0], gas: 5000000 });
  console.timeEnd("合约部署耗时");

  const contractAddress = result.options.address.toLowerCase();

  console.log("合约部署成功:", contractAddress);
  console.log("合约查看地址:", `https://rinkeby.etherscan.io/address/${contractAddress}`);

  // 6. 合约地址写入文件系统
  const addressFile = path.resolve(__dirname, "../address.json");
  fs.writeFileSync(addressFile, JSON.stringify(contractAddress));
  console.log("地址写入成功:", addressFile);

  process.exit();
})();
