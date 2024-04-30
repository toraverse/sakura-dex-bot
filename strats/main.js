const GeckoMarketMaking = require("./geckoMarketMaking");
const VolumeTrade = require("./volumeTrade");

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
        console.error("Error in main execution flow:", error);
    }
}


async function loadStrats() {
    strategyConfigs.forEach(config => {
        try {
            const strategy = createStrategy(config);
            strategies.push(strategy);
        } catch (error) {
            console.error("Error initializing strategy:", error);
        }
    });
}

function createStrategy(config) {
    switch (config.type) {
        case 'GeckoMM':
            console.log("Loading strategy " + config.type + "with config", config);
            return new GeckoMarketMaking(config);
        case 'VolumeTrade':
            console.log("Loading strategy " + config.type + "with config", config);
            return new VolumeTrade(config);
        default:
            throw new Error(`Unknown strategy type: ${config.type}`);
    }
}

async function initStrats() {
    for (const strategy of strategies) {
        try {
            await strategy.init();
        } catch (error) {
            console.error("Error initializing strategy:", error);
        }
    }
}

async function runStrats() {
    for (const strategy of strategies) {
        try {
            await strategy.run();
        } catch (error) {
            console.error("Error initializing strategy:", error);
        }
    }
}

main();