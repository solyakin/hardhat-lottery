// SPDX-License-Identifier: MIT

pragma solidity 0.8.17;

import '@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol';
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";
// import "@chainlink/contracts/src/v0.8/interfaces/AutomationCompatibleInterface.sol";

error Raffle__NotEnoughETHEntered();
error Raffel__TransactionFailed();
error Raffle__NotOpen();
error Raffle__UpKeepNotNeeded(uint256 currentBalance, uint256 numplayers, uint256 raffleState);


/**@title A sample Raffle Contract
 * @author Patrick Collins
 * @notice This contract is for creating a sample raffle contract
 * @dev This implements the Chainlink VRF Version 2
 */

contract Raffle is VRFConsumerBaseV2, KeeperCompatibleInterface {

    /* 
    * we made use of enum instead of boolean when we have different states e.g open, close, pending, completed
    * If we have just two state we can use a bool -
    * bool private i_isOpen
    **/

    //Lottery state
    enum RaffleState {
        OPEN,
        CALCULATING
    } //OPEN = 0 && CALCULATING = 1

    uint256 private immutable ENTRANCE_FEE;
    address payable[] private s_players; //address is payable because we will pay one of the address that win the lottery
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_gasLane;
    uint64 private immutable i_subscriptionId;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATION = 3;
    uint32 private constant NUM_WORD = 1;


    //Lottery variables
    address private s_recentWinner;
    RaffleState private s_raffleState;
    uint256 private s_lasttimestamp;
    uint256 private immutable i_interval;

    event RaffleEnter(address indexed s_player);
    event RequestedRaffleWinner(uint256 indexed requestId);
    event WinnerPicked(address indexed winner);

    constructor(
        address vrfCoordinatorV2, 
        uint256 entranceFee, 
        bytes32 gasLane, 
        uint64 subscriptionId, 
        uint32 callbackGasLimit, 
        uint256 interval
        ) VRFConsumerBaseV2(vrfCoordinatorV2){
        ENTRANCE_FEE = entranceFee;
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2); 
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        s_raffleState = RaffleState.OPEN;
        s_lasttimestamp = block.timestamp;
        i_interval = interval;
    }

    function enterRaffle() public payable{
        if(msg.value < ENTRANCE_FEE) {
            revert Raffle__NotEnoughETHEntered();
        }

        //ensure that user can only enter raffle when rafflestate is OPEN
        if(s_raffleState != RaffleState.OPEN){
            revert Raffle__NotOpen();
        }
        s_players.push(payable(msg.sender));
        emit RaffleEnter(msg.sender); 
    }

    /*
     * @dev This is the function that the Chainlink Keeper nodes call
     * they look for `upkeepNeeded` to return True.
     * the following should be true for this to return true:
     * 1. The time interval has passed between raffle runs.
     * 2. The lottery is open.
     * 3. The contract has ETH and atleast 1 player.
     * 4. Implicity, your subscription is funded with LINK.
    * */
    // only when checkupKeep is true, then chain will run performUpKeep (requestRandomWinner) to get a winner

    function checkUpkeep(
        bytes memory /* checkData */
    )
        public
        view
        override
        returns (
            bool upkeepNeeded,
            bytes memory /* performData */
        )
    {
        bool isOpen = RaffleState.OPEN == s_raffleState;
        bool timePassed = ((block.timestamp - s_lasttimestamp) > i_interval);
        bool hasPlayers = s_players.length > 0;
        bool hasBalance = address(this).balance > 0;
        upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers);
        return (upkeepNeeded, "0x0"); // can we comment this out?
    }

    function performUpkeep(bytes calldata/*performData*/) external override {

        (bool upKeepNeeded, ) = checkUpkeep("");
        if(!upKeepNeeded){
            revert Raffle__UpKeepNotNeeded(address(this).balance, s_players.length, uint256(s_raffleState));
        }

        s_raffleState = RaffleState.CALCULATING;

        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATION,
            i_callbackGasLimit,
            NUM_WORD
        );
        emit RequestedRaffleWinner(requestId);
    }

    function fulfillRandomWords(uint256 /*requestId*/, uint256[] memory randomWords) internal override {
        uint256 indexOfWinner = randomWords[0] % s_players.length;
        address payable recentWinner = s_players[indexOfWinner];
        s_recentWinner = recentWinner;
        s_raffleState = RaffleState.OPEN;
        //after picking a winner, we need to reset the players array
        s_players = new address payable[](0);
        s_lasttimestamp = block.timestamp;
        (bool success, ) = recentWinner.call{ value : address(this).balance }("");

        if(!success){
            revert Raffel__TransactionFailed();
        }
        emit WinnerPicked(recentWinner);
    }

    function getEntranceFee() public view returns (uint256){
        return ENTRANCE_FEE;
    }

    function getPlayer(uint256 index) public view returns (address){
        return s_players[index];
    }

    function getRecentWinner() public view returns (address) {
        return s_recentWinner;
    }

    function getNumwords() public pure returns(uint256){
        return NUM_WORD;
    }
    function getNumOfPlayers() public view returns(uint256){
        return s_players.length;
    }
    function getRaffleState() public view returns(RaffleState){
        return s_raffleState;
    }
    function getInterval() public view returns(uint256){
        return i_interval;
    }
}