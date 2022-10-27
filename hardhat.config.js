require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("dotenv").config()

/** @type import('hardhat/config').HardhatUserConfig */
const GOERL_RPC_URL = process.env.GOERL_RPC_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

module.exports = {
  solidity: "0.8.17",
  defaultNetwork : "hardhat",
  networks : {
    hardhat : {
      chainId : 31337,
      blockConfirmations : 1
    },
    goerli : {
      chainId : 5,
      blockConfirmations : 6,
      url : GOERL_RPC_URL,
      accounts : [PRIVATE_KEY]
    }
  },
  gasReporter : {
    enabled : false,
    currency : "USD",
    outputFile : "gas-report.txt",
    noColors : true,
  },
  namedAccounts : {
    deployer : {
      default : 0,
    },
    player : {
      default : 1,
    }
  }
};
