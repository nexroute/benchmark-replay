# nexroute Benchmark Replay

Replay and verify benchmark results from [nexroute](https://benchmark.nexroute.io) swap aggregator tests. This tool allows you to reproduce the exact on-chain execution of benchmark test cases using Hardhat's fork feature.

## Overview

This repository provides tooling to:
- Replay benchmark test cases from nexroute against historical blockchain state
- Verify swap amounts for different aggregators
- Debug and trace swap execution with detailed EVM logs

## Prerequisites

- Node.js
- Access to a BSC archive node (required for replaying historical blocks)

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file in the root directory by copying the example:

```bash
cp .env.example .env
```

Edit `.env` and set your archive node URI:

```env
ARCHIVE_NODE_URI=https://your-archive-node-provider.com/bsc/your-api-key
```

> **Important**: You must use an **archive node** to replay historical blockchain states. Regular RPC nodes will not work.

## Usage

### Basic Replay

Run the replay script to reproduce a benchmark result:

```bash
npm run replay
```

You will be prompted to:
1. Enter the path to a benchmark result file (`.jsonl` format)
2. Choose which aggregator result to replay

The script will:
- Fork the blockchain at the exact block when the benchmark was run
- Execute the swap transaction with the recorded calldata
- Compare results with the original benchmark

### Trace Mode

For detailed EVM execution tracing:

```bash
npm run trace
```

This provides step-by-step logs of all contract calls, useful for debugging discrepancies or understanding routing logic.

## Benchmark Data Format

Benchmark files are in JSONL (JSON Lines) format. Each line represents a complete test case containing:

```json
{
  ...,
  "response": {
    "tokenIn": "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    "tokenInDecimals": 18,
    "tokenInEthPrice": 1,
    "tokenInUsdPrice": 890.7795989357012,
    "tokenOut": "0x55d398326f99059fF775485246999027B3197955",
    "tokenOutDecimals": 18,
    "tokenOutEthPrice": 0.0011226126022497278,
    "tokenOutUsdPrice": 1.0000004035921763,
    "meanEthPrice": 890.7795989357012,
    "amountIn": "1000000000000000000",
    "results": [
      ...,
      {
        "solver": "nexroute",
        "requestTime": "1769089109834",
        "requestBlock": 76764917,
        "responseTime": "1769089110261",
        "responseBlock": 76764917,
        "quoteError": "",
        "advertisedAmountOut": "890294492231252694402",
        "advertisedGas": 413766,
        "contract": "0x365193e7e200CC2Ce82eb67DB0Fed117F8C7c660",
        "calldata": "0x...",
        "approval": "0x365193e7e200CC2Ce82eb67DB0Fed117F8C7c660",
        "simulationError": "",
        "actualAmountOut": "890294492231252694402",
        "actualGas": 396172
      },
      ...
    ]
  },
  "gasPriceGwei": 0.05
}
```

A sample benchmark file is provided in the `sample/` directory.

## Architecture

- **`lib/replay.js`**: Main replay logic using Hardhat Network
- **`lib/util.js`**: Helper utilities for token balance manipulation
- **`sample/data.jsonl`**: Sample benchmark data
- **`hardhat.config.js`**: Hardhat configuration for BSC mainnet forking

## Notes

- Gas estimates may vary slightly between BSC and Hardhat EVMs
- The tool uses the actual gas values from the benchmark for USD calculations
- All swaps are simulated at gas price 0

## License

MIT
