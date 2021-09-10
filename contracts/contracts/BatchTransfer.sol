//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract BatchTransfer {
    constructor() {}

    function batch(address _token, address[] calldata accounts, uint[] calldata amounts) external {
        require(accounts.length == amounts.length, "invalid");
        IERC20 token = IERC20(_token);
        for(uint256 i = 0; i < accounts.length; i++) {
            token.transferFrom(msg.sender, accounts[i], amounts[i]);
        }
    }
}