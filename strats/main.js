const GeckoMarketMaking = require("./geckoMarketMaking");
const VolumeTrade = require("./volumeTrade");

const logger = require("./lib");

const fs = require('fs');

// Read the strategy configurations from the JSON file
const strategyConfigs = JSON.parse(fs.readFileSync("./config/prod.json", "utf8"));
let strategies = [];


async function main() {
    try {
        await loadStrats();
        await initStrats();
        await runStrats();
    } catch (error) {
        logger.error("Error in main execution flow : ", JSON.stringify(error));
    }
}


async function loadStrats() {
    strategyConfigs.forEach(config => {
        if (!config.active) {
            logger.info(`Skipping inactive strategy : ${config.type} ${config.marketSymbol}`);
            return;  // Skip this iteration, do not load the strategy
        }
        try {
            logger.info(`Loading strategy : ${config.type} ${config.marketSymbol}`);
            const strategy = createStrategy(config);
            strategies.push(strategy);
        } catch (error) {
            logger.error(`Error initializing strategy for + ${config.type} ${config.marketSymbol} : `, JSON.stringify(error));
        }
    });
}


function createStrategy(config) {
    switch (config.type) {
        case 'GeckoMM':
            logger.info("Loading strategy " + config.type + "with config", config);
            return new GeckoMarketMaking(config);
        case 'VolumeTrade':
            logger.info(
              "Loading strategy " + config.type + "with config",
              config
            );
            return new VolumeTrade(config);
        default:
            logger.error("Unknown strategy type: " + config.type);
            throw new Error(`Unknown strategy type: ${config.type}`);
    }
}

async function initStrats() {
    for (const strategy of strategies) {
        try {
            logger.info(`Initializing strategy ${strategy.type} for market ${strategy.marketSymbol}`);
            await strategy.init();
        } catch (error) {
            logger.error("Error initializing strategy : ", JSON.stringify(error));
        }
    }
}

async function runStrats() {
    for (const strategy of strategies) {
        try {
            logger.info(`Running strategy ${strategy.type} for market ${strategy.marketSymbol}`);
            await strategy.run();
        } catch (error) {
            logger.error("Error initializing strategy : ", JSON.stringify(error));
        }
    }
}

main();