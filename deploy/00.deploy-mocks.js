const { network } = require('hardhat');
// const { developmentChain } = require('../helper-hardhat-config');

const BASE_FEE = "250000000000000000";
const GAS_PRICE_LINK = 1e9;

module.exports = async function ({getNamedAccounts, deployments}){
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;

    if(chainId == 31337){
        log("Local network detected... deploying mocks");
        //deploy a moc vrf coordinator....

        await deploy("VRFCoordinatorV2Mock", {
            from : deployer,
            args : [BASE_FEE ,GAS_PRICE_LINK],
            log : true
        })

        log("Mock deployed!!")
        log("-----------------------------------------")
    }    
}

module.exports.tags = ['all', 'mocks']