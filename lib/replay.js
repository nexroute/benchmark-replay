const readline = require("node:readline/promises");
const { stdin, stdout } = require("node:process");
const fs = require("node:fs/promises");
const process = require("node:process");
const hre = require("hardhat");
const { reset, mine, impersonateAccount } = require("@nomicfoundation/hardhat-network-helpers");
const { setTokenBalance } = require("./util");

const pancakePermit2 = "0x31c2F6fcFf4F8759b3Bd5Bf0e1084A055615c768";
const account = "0x000000000631cb11679942eaE370e689000494BF";

describe("⏪ nexroute Benchmark Replay", function () {
    it("replay aggregator route", async () => {
        if (!process.env.ARCHIVE_NODE_URI) {
            throw new Error("ARCHIVE_NODE_URI environment variable is not set");
        }

        let rl = readline.createInterface({ input: stdin, output: stdout });
        const filePath = await rl.question("\nEnter the benchmark result file path (.jsonl):");
        rl.close();

        const content = await fs.readFile(filePath, "utf8");
        const testCase = JSON.parse(content.trim());

        const aggregators = testCase.response.results.map((result) => result.solver);

        rl = readline.createInterface({ input: stdin, output: stdout });
        const aggregator = await rl.question(`Choose an aggregator (${aggregators.join(", ")}):`);
        rl.close();

        const result = testCase.response.results.find((result) => result.solver === aggregator);

        console.log("\nTest Case", {
            tokenIn : testCase.response.tokenIn,
            tokenInEthPrice: testCase.response.tokenInEthPrice,
            tokenInUsdPrice: testCase.response.tokenInUsdPrice,
            tokenOut : testCase.response.tokenOut,
            tokenOutEthPrice: testCase.response.tokenOutEthPrice,
            tokenOutUsdPrice: testCase.response.tokenOutUsdPrice,
            amountIn : BigInt(testCase.response.amountIn),
            blockNumber: result.requestBlock,
            gasPriceGwei: testCase.gasPriceGwei,
        }, "\n");

        console.log("Benchmark Result", {
            advertisedAmountOut:  BigInt(result.advertisedAmountOut),
            actualAmountOut:  BigInt(result.actualAmountOut),
            actualGas: result.actualGas,
        }, "\n");

        console.log("Replaying test case...\n");

        await reset(process.env.ARCHIVE_NODE_URI, result.requestBlock);
        await mine();

        await impersonateAccount(account);
        const user = await hre.ethers.getSigner(account);

        const tokenIn = testCase.response.tokenIn;
        const tokenOut = testCase.response.tokenOut;
        const amountIn = BigInt(testCase.response.amountIn);
        const contract = result.contract;
        const calldata = result.calldata;
        const approval = result.approval;

        await setTokenBalance(tokenIn, amountIn, user.address);

        const tokenInContract = await hre.ethers.getContractAt("IERC20", tokenIn);
        const tokenOutContract = await hre.ethers.getContractAt("IERC20", tokenOut);

        await tokenInContract.connect(user).approve(approval, amountIn);

        if (approval === pancakePermit2) {
            // skip signature generation, call approve on permit2 directly
            await user.sendTransaction({
                to: pancakePermit2,
                from: user.address,
                data: "0x87517c45" +
                    tokenIn.slice(2).padStart(64, "0") +
                    contract.slice(2).padStart(64, "0") +
                    amountIn.toString(16).padStart(64, "0") +
                    "ffffffffffff".padStart(64, "0"),
                value: "0",
                gasPrice: "0"
            });
        }

        const tokenOutBalanceBefore = await tokenOutContract.balanceOf(user.address);

        await user.sendTransaction({
            to: contract,
            from: user.address,
            data: calldata,
            value: "0",
            gasPrice: "0"
        });

        const tokenoutBalanceAfter = await tokenOutContract.balanceOf(user.address);

        const amountOut = tokenoutBalanceAfter - tokenOutBalanceBefore;
        const amountOutFloat = Number(amountOut) / (10 ** testCase.response.tokenOutDecimals);
        const amountOutUsd = amountOutFloat * testCase.response.tokenOutUsdPrice;

        const gasPriceGwei = parseFloat(testCase.gasPriceGwei);
        // hardhat EVM does not match BSC EVM gas calculation, use BSC value
        const gasUsed = parseInt(result.actualGas);
        const ethPrice = testCase.response.meanEthPrice;
        const gasCostUsd = gasUsed * gasPriceGwei * 1e-9 * ethPrice;

        console.log("\n", "Replay Result", {
            amountOut: tokenoutBalanceAfter - tokenOutBalanceBefore,
            netUsdAmountOut: amountOutUsd - gasCostUsd,
        }, "\n");
    });
});



