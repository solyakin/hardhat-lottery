const { assert, expect } = require("chai");
const { network, getNamedAccounts, deployments, ethers } = require("hardhat");
const { developmentChain, networkConfig } = require("../../helper-hardhat-config");

!developmentChain.includes(network.name) ? 
describe.skip : 
describe("Raffle Unit Test", () => {

    let raffle, vrfCoordinatorV2Mock, entranceFee, deployer, interval;
    const chainId = network.config.chainId;

    beforeEach(async () => {
        
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"]);
        raffle = await ethers.getContract("Raffle", deployer)
        console.log(raffle.address)
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer);
        entranceFee = await raffle.getEntranceFee();
    })

    describe('constructor', () => { 
        it("Initializes the raffle correctly", async () => {
            const raffleState = await raffle.getRaffleState();
            interval = await raffle.getInterval();
            assert.equal(raffleState.toString(), "0");
            assert.equal(interval.toString(), networkConfig[chainId]['interval']);
        })
    })

    describe("not enough ETH", () => {
        it("reverts when you don't pay enough", async () => {
            await expect(raffle.enterRaffle()).to.be.revertedWith('Raffle__NotEnoughETHEntered');
        })
        it("record players when they enter", async () => {
            await raffle.enterRaffle({ value : entranceFee});
            const playerFromContract = await raffle.getPlayer(0);
            assert.equal(playerFromContract, deployer);
        })
        it("should emit an event", async () => {
            await expect(raffle.enterRaffle({ value : entranceFee })).to.emit(raffle, 'RaffleEnter')
        })
        it("doesn't allow entrance when raffle is calculating", async() => {
            await raffle.enterRaffle({ value : entranceFee});
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
            await network.provider.send("evm_mine", [])

            //we pretend to be the chainlink keepers
            await raffle.performUpkeep([]);
            await expect(raffle.enterRaffle({ value : entranceFee})).to.be.revertedWith('Raffle__NotOpen')
        })
    })
    describe("checkUpkeep", function () {
        it("returns false if people haven't sent any ETH", async () => {
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
            await network.provider.request({ method: "evm_mine", params: [] })
            const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x") // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
            assert(!upkeepNeeded)
        })
        it("returns false if raffle isn't open", async () => {
            await raffle.enterRaffle({ value: entranceFee })
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
            await network.provider.request({ method: "evm_mine", params: [] })
            await raffle.performUpkeep([]) // changes the state to calculating
            const raffleState = await raffle.getRaffleState() // stores the new state
            const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x") // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
            assert.equal(raffleState.toString() == "1", upkeepNeeded == false)
        })
        it("returns false if enough time hasn't passed", async () => {
            await raffle.enterRaffle({ value: entranceFee })
            await network.provider.send("evm_increaseTime", [interval.toNumber() - 5]) // use a higher number here if this test fails
            await network.provider.request({ method: "evm_mine", params: [] })
            const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x") // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
            assert(!upkeepNeeded)
        })
        it("returns true if enough time has passed, has players, eth, and is open", async () => {
            await raffle.enterRaffle({ value: entranceFee })
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
            await network.provider.request({ method: "evm_mine", params: [] })
            const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x") // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
            assert(upkeepNeeded)
        })
    })
})