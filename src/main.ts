import {GeckoMarketMaking} from "./strats/gecko";

const chain = "base"; //source chain    
const sourceTokenAddress = "0x4200000000000000000000000000000000000006"; // Uniswap market GeckoTerminal (source)
const marketSymbol = "WETH_USDC"; // Tegro market (target)

const maxQuoteBalanceUtilization = 50; 
const maxBaseBalanceUtilization = 100; 

const priceStepLevels = [0.01, 0.1, 0.2]; // Percentage steps for price levels (buy & sell)
const walletAllocation = [20, 30, 40]; // Percentage allocation of the wallet for each order

async function main()
{
    const gecko = new GeckoMarketMaking(chain, marketSymbol, maxQuoteBalanceUtilization, maxBaseBalanceUtilization, priceStepLevels, walletAllocation);;
    await gecko.initBot();
    await gecko.runMM();
}

await main();