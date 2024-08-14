const { v4: uuidv4 } = require("uuid");
const { performance } = require("perf_hooks");

const { TRANSACTION_DETAIL, SIDE } = require("./config/constants");
const transaction1 = require("./transactions/transaction1");
const logger = require("./utils/logger");

function getTransactionDetail() {
    const transactionDetail = JSON.parse(JSON.stringify(TRANSACTION_DETAIL));

    transactionDetail["processId"] = uuidv4(); // Unique ID of each tree
    transactionDetail["consumedTime"] = new Date();

    // Create a copy of the 0th transaction and modify necessary fields for reverse transaction
    const reverseTransaction = {
        ...transactionDetail.transactions[0],
        function: "reverseTransaction1",
        side: transactionDetail.transactions[0].side === SIDE.BUY? SIDE.SELL : SIDE.BUY
    };

    // Append the new transaction to the transactions array
    return {
        ...transactionDetail,
        transactions: [...transactionDetail.transactions, reverseTransaction]
    };
}

// Infinite loop to keep running indefinitely
async function mainLoop() {
    const transactionDetail = JSON.parse(JSON.stringify(TRANSACTION_DETAIL));

    while (true) {
        const processId = uuidv4(); // Unique ID of each tree

        transactionDetail["processId"] = processId;
        transactionDetail["consumedTime"] = new Date();

        const start = performance.now(); // Start timer

        try {
            await transaction1(transactionDetail);
            logger.info(`${processId} processId cycle complete`);
        } catch (error) {
            logger.error(`${processId} processId cycle failed: ${error}`);
        } finally {
            const end = performance.now(), // End timer
                timeTaken = ((end - start) / 1000).toFixed(2);

            logger.info(`Time taken by ${processId}: ${timeTaken}s`);
            // return;
        }
    }
}

mainLoop().catch(error => logger.error(`Code crashed: ${error}`));
