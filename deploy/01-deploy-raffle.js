const { network, ethers } = require("hardhat");
const { networkConfig, developmentChain, VERIFICATION_BLOCK_CONFIRMATIONS } = require("../helper-hardhat-config");
const { verify } = require('../utils/verify')

const FUND_AMOUNT = ethers.utils.parseEther("1");

module.exports = async function ({ getNamedAccounts, deployments }){

    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;

    let vrfCoordinatorV2Address, vrfCoordinatorV2Mock;
    let subscriptionId;

    // console.log(network.name)

    if(chainId == 31337){
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;

        //getting the subscription
        const transationResponse = await vrfCoordinatorV2Mock.createSubscription();
        const transactionReciept = await transationResponse.wait(1);
        subscriptionId = transactionReciept.events[0].args.subId

        //funding the subscription
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, FUND_AMOUNT)

    }else{
        vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"];
        subscriptionId = networkConfig[chainId]["subscriptionId"];
    }

    // console.log(subscriptionId.toString());

    const entranceFee = networkConfig[chainId]["entranceFee"];
    const gasLane = networkConfig[chainId]["gasLane"];
    const callBackGasLimit = networkConfig[chainId]['callBackGasLimit'];
    const interval = networkConfig[chainId]['interval'];

    const args = [vrfCoordinatorV2Address, entranceFee, gasLane, subscriptionId, callBackGasLimit, interval ]

    // const gasLane = networkConfig[chainId]["gasLane"]
    // const enteranceFee = networkConfig[chainId]["raffleEntranceFee"]
    // const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"]
    // const interval = networkConfig[chainId]["interval"]

    const arguments = [
        vrfCoordinatorV2Address,
        networkConfig[chainId]["entranceFee"],
        networkConfig[chainId]["gasLane"],
        subscriptionId,
        networkConfig[chainId]["callbackGasLimit"],
        networkConfig[chainId]["interval"],
    ]

    const waitBlockConfirmations = developmentChain.includes(network.name)
        ? 1
        : VERIFICATION_BLOCK_CONFIRMATIONS

    const raffle = await deploy("Raffle", {
        from : deployer,
        args : args,
        log : true,
        waitConfirmation : waitBlockConfirmations
    })

    //verify the deployment
    if(!developmentChain.includes(network.name) && process.env.ETHERSCAN_API_KEY){
        log('verifying .....')
        await verify(raffle.address, args);
    }

    log("Enter lottery with command:")
    const networkName = network.name == "hardhat" ? "localhost" : network.name
    log(`yarn hardhat run scripts/enterRaffle.js --network ${networkName}`)
    log("----------------------------------------------------")
}

module.exports.tag = ["all", "raffle"]