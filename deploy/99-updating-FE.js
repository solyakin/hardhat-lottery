const { ethers, network } = require("hardhat");
const fs  = require('fs');

module.exports = async function (){
    if(process.env.UPDATING_FRONTEND){
        console.log("updating frontend");
        updateContractAddress()
        updateContractAbi()
    }
}   

const frontendAddressFile = "../nextjs-smartcontract-lottery/constants/contractAddress.json"
const frontendABIFile = "../nextjs-smartcontract-lottery/constants/abi.json"

const updateContractAbi = async () => {
    const raffle = await ethers.getContract('Raffle');
    fs.writeFileSync(frontendABIFile, raffle.interface.format(ethers.utils.FormatTypes.json))
}

const updateContractAddress = async () => {
    const raffle = await ethers.getContract("Raffle")
    const chainId = network.config.chainId.toString();
    const currentAddress = JSON.parse(fs.readFileSync(frontendAddressFile, "utf8"));
    
    if(chainId in currentAddress){
        if(!currentAddress[chainId].includes(raffle.address)){
            currentAddress[chainId].push( raffle.address);
        }
    }else {
        currentAddress[chainId]  = [raffle.address]
    }
    fs.writeFileSync(frontendAddressFile, JSON.stringify(currentAddress))
}

module.exports.tags = ['all', 'frontend']