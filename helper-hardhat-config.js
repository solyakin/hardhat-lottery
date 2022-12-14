const { ethers } = require("hardhat");

const networkConfig = {
    // default: {
    //     name: "hardhat",
    //     interval: "30",
    // },
    5 : {
        name : "goerli",
        vrfCoordinatorV2 : '0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D',
        entranceFee : ethers.utils.parseEther("0.01"),
        gasLane : "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
        subscriptionId : "0",
        callBackGasLimit : "500000",
        interval : "30"
    },
    31337 : {
        name : "hardhat",
        subscriptionId: "588",
        entranceFee : ethers.utils.parseEther("0.01"),
        gasLane : "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
        callBackGasLimit : "500000",
        interval : "30"
    }
}

const developmentChain = ["hardhat", "localhost"];
const VERIFICATION_BLOCK_CONFIRMATIONS = 6

module.exports = {
    networkConfig,
    developmentChain,
    VERIFICATION_BLOCK_CONFIRMATIONS
}