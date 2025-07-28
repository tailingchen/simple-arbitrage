// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.29;

import "forge-std/Script.sol";
import "../../contracts/UniswapFlashQuery.sol";

contract DeployUniswapFlashQuery is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        console.log("=== Deployment Configuration ===");
        console.log("Deployer:", vm.addr(deployerPrivateKey));
        console.log("Chain ID:", block.chainid);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy FlashBotsUniswapQuery
        FlashBotsUniswapQuery query = new FlashBotsUniswapQuery();

        console.log("\n=== Deployment Successful ===");
        console.log("FlashBotsUniswapQuery deployed at:", address(query));

        vm.stopBroadcast();

        // Save deployment info
        _saveDeploymentInfo(address(query));
    }

    function _saveDeploymentInfo(address queryAddress) internal {
        string memory chainName = block.chainid == 11155111 ? "sepolia" : 
                                  block.chainid == 1 ? "mainnet" : 
                                  vm.toString(block.chainid);
        
        string memory filename = string(abi.encodePacked("./deployments/", chainName, "-query.json"));
        
        string memory json = string(abi.encodePacked(
            '{\n',
            '  "flashBotsUniswapQueryAddress": "', vm.toString(queryAddress), '",\n',
            '  "deploymentBlock": ', vm.toString(block.number), ',\n',
            '  "deploymentTimestamp": ', vm.toString(block.timestamp), ',\n',
            '  "deployer": "', vm.toString(msg.sender), '"\n',
            '}'
        ));
        
        vm.writeFile(filename, json);
        console.log("\nDeployment info saved to:", filename);
    }
}