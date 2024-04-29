const GeckoMarketMaking = require("./gecko");
const fs = require('fs');

// Read the strategy configurations from the JSON file
const strategyConfigs = JSON.parse(fs.readFileSync("./config/prod.json", "utf8"));

async function marketMake(config) {
    const geckoMM = new GeckoMarketMaking(
        config.chain,
        config.marketSymbol,
        config.maxQuoteBalanceUtilization,
        config.maxBaseBalanceUtilization,
        config.priceStepLevels,
        config.walletAllocation,
        config.refreshRate
    );
    await geckoMM.initBot();
    await geckoMM.runMM();
}

// Run each strategy configuration
strategyConfigs.forEach(config => {
    marketMake(config).catch(console.error);
});