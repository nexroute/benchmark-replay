const hre = require("hardhat");
const { setStorageAt } = require("@nomicfoundation/hardhat-network-helpers");

const setTokenBalance = async (addr, amount, account) => {
    const token = await hre.ethers.getContractAt("IERC20", addr);

    const trace = await hre.network.provider.send("debug_traceCall", [
        {
            to: addr,
            data: token.interface.encodeFunctionData("balanceOf", [account]),
        },
        await hre.network.provider.send("eth_blockNumber"),
        {
            disableStack: false,
            disableStorage: true,
            disableMemory: true,
        },
    ]);

    const accessedSlots = trace.structLogs
        .filter(log => log.op === "SLOAD")
        .map(log => `0x${log.stack[log.stack.length - 1].padStart(64, "0")}`);

    const balanceSlot = accessedSlots[0];

    await setStorageAt(addr, balanceSlot, amount);

    const balance = await token.balanceOf(account);
    if (balance !== amount) {
        throw new Error(`Failed to set balance for ${account} on token ${addr}`);
    }
}

module.exports = {
    setTokenBalance,
}