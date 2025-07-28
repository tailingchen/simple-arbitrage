// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.29;

import "forge-std/Script.sol";
import "../contracts/BundleExecutor.sol";

contract DeployBundleExecutor is Script {
    // WETH addresses
    address constant WETH_MAINNET = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address constant WETH_SEPOLIA = 0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9;

    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address executorAddress = vm.envOr("EXECUTOR_ADDRESS", vm.addr(deployerPrivateKey));
        uint256 initialWethAmount = vm.envOr("INITIAL_WETH_AMOUNT", uint256(0));

        // Determine WETH address based on chain ID
        address wethAddress = block.chainid == 1 ? WETH_MAINNET : 
                             block.chainid == 11155111 ? WETH_SEPOLIA : 
                             vm.envAddress("WETH_ADDRESS"); // Allow custom WETH for other chains

        console.log("=== Deployment Configuration ===");
        console.log("Deployer:", vm.addr(deployerPrivateKey));
        console.log("Executor:", executorAddress);
        console.log("WETH Address:", wethAddress);
        console.log("Initial ETH Amount:", initialWethAmount / 1e18, "ETH");
        console.log("Chain ID:", block.chainid);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy BundleExecutor
        FlashBotsMultiCall bundleExecutor = new FlashBotsMultiCall{value: initialWethAmount}(
            executorAddress,
            wethAddress
        );

        console.log("\n=== Deployment Successful ===");
        console.log("BundleExecutor deployed at:", address(bundleExecutor));
        console.log("Owner:", bundleExecutor.owner());
        console.log("Executor:", bundleExecutor.executor());
        console.log("WETH:", address(bundleExecutor.WETH()));

        if (initialWethAmount > 0) {
            console.log("Initial WETH deposited:", initialWethAmount / 1e18, "ETH");
        }

        vm.stopBroadcast();

        // Save deployment info
        _saveDeploymentInfo(address(bundleExecutor), wethAddress);
    }

    function _saveDeploymentInfo(address bundleExecutor, address wethAddress) internal {
        string memory chainName = block.chainid == 11155111 ? "sepolia" : 
                                  block.chainid == 1 ? "mainnet" : 
                                  vm.toString(block.chainid);
        
        string memory filename = string(abi.encodePacked("./deployments/", chainName, ".json"));
        
        string memory json = string(abi.encodePacked(
            '{\n',
            '  "bundleExecutorAddress": "', vm.toString(bundleExecutor), '",\n',
            '  "wethAddress": "', vm.toString(wethAddress), '",\n',
            '  "deploymentBlock": ', vm.toString(block.number), ',\n',
            '  "deploymentTimestamp": ', vm.toString(block.timestamp), ',\n',
            '  "deployer": "', vm.toString(msg.sender), '"\n',
            '}'
        ));
        
        vm.writeFile(filename, json);
        console.log("\nDeployment info saved to:", filename);
    }
}