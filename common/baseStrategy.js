// strats/BaseStrategy.js
class BaseStrategy {
    constructor() {
        if (new.target === BaseStrategy) {
            throw new Error("Cannot instantiate the abstract class BaseStrategy.");
        }
    }

    async init() {
        throw new Error("Method 'initBot()' must be implemented.");
    }

    async run() {
        throw new Error("Method 'run()' must be implemented.");
    }
}

module.exports = BaseStrategy;