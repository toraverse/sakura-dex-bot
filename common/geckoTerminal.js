const axios = require('axios');
const constants = require('./constants');
require('dotenv').config();
const logger = require('../strats/lib');

const baseUrl = constants.GECKO_TERMINAL_BASE_URL;

const geckoTerminalLib = {
    async getPrice(chain, tokenAddress) {
        try {
            console.log("tokenAddress ", tokenAddress);
            console.log("chain ", chain);
                        const url =
                          baseUrl +
                          "/networks/" +
                          chain +
                          "/tokens/" +
                          tokenAddress;

            const response = await axios.get(url);
            if (response.data && response.data.data.attributes && response.data.data.attributes.price_usd) {
                return parseFloat(response.data.data.attributes.price_usd);
            } else {
                logger.error("Price data is missing in the response");
            }
        } catch (error) {
            logger.error(error);
        }
    }
};

module.exports = geckoTerminalLib;