const axios = require('axios');
const constants = require('./constants');
require('dotenv').config();
const { logger } = require('../strats/lib');

const baseUrl = constants.GECKO_TERMINAL_BASE_URL;

const geckoTerminalLib = {
    async getPrice(chain, tokenAddress) {
        try {
            const url = baseUrl + "/networks/" + chain + "/tokens/" + tokenAddress;
            const response = await axios.get(url);
            if (response.data && response.data.data.attributes && response.data.data.attributes.price_usd) {
                return parseFloat(response.data.data.attributes.price_usd);
            } else {
                logger.error("Price data is missing in the response");
            }
        } catch (error) {
            logger.error(`Failed to fetch price: ${error}`);
        }
    }
};

module.exports = geckoTerminalLib;