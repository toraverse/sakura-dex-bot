const GeckoMarketMaking = require("./gecko");

 require("./gecko");

const chain = "base"; //source chain    
const sourceTokenAddress = "0x4200000000000000000000000000000000000006"; // Uniswap market GeckoTerminal (source)
const marketSymbol = "WETH_USDC"; // Tegro market (target)

const maxQuoteBalanceUtilization = 1000; 
const maxBaseBalanceUtilization = 0.5; 
const refreshOrders = 15000;

const priceStepLevels = [0.5, 0.8, 1.2]; // Percentage steps for price levels (buy & sell)
const walletAllocation = [20, 30, 40]; // Percentage allocation of the wallet for each order
const refreshTime = 5000;

async function marketMake()
{
    const geckoMM = new GeckoMarketMaking(chain, marketSymbol, maxQuoteBalanceUtilization, maxBaseBalanceUtilization, priceStepLevels, walletAllocation);
    await geckoMM.initBot();
    await geckoMM.runMM();
}

marketMake();
