const process = require('node:process');
/** @type import('hardhat/config').HardhatUserConfig */
require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-network-helpers");
require("hardhat-tracer");

process.loadEnvFile();

module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 56,
            gasPrice: 0,
            initialBaseFeePerGas: 0,
            allowBlocksWithSameTimestamp: true,
            forking: {
                blockNumber: 38255921,
                url: process.env.ARCHIVE_NODE_URI
            },
        },
    },
    solidity: {
        compilers: [
            {
                version: "0.8.27",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 100_000,
                    },
                    evmVersion: "cancun",
                },
            },
        ],
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts"
    },
    mocha: {
        timeout: 2000000,
    },
};