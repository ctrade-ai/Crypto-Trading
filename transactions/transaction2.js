const { executeOrder, fetchBidAskPrices, checkOrderStatus, cancelOrder, fetchMarketPrices } = require("../api/trading");
const { ORDER_STATUS, TRANSACTION_ATTEMPTS, TYPE, TIME_IN_FORCE, SIDE, CONDITION_SETS, PRICE_TYPE } = require("../config/constants");
const { updateAllPrices, getOrderInfo, updateTransactionDetail, handleSubProcessError, mapPriceResponseToOrder } = require("../utils/helpers");
const logger = require("../utils/logger");
const transaction3 = require("./transaction3");
const reverseTransaction1 = require("./reverseTransaction1");

const FUNCTION_INDEX = 1,
    ITERATION_TIME = 1000, // Time in ms
    DELAY_STATUS_CHECK = 0;

async function transaction2(
    transactionDetail,
    quantity,
    attempts = TRANSACTION_ATTEMPTS.TRANSACTION_2.MARKET,
    isMarketPrice = true
) {
    if (attempts <= 0) {
        if (isMarketPrice) {
            isMarketPrice = false;
            attempts = TRANSACTION_ATTEMPTS.TRANSACTION_2.ASK_BUY;
            logger.info(`${transactionDetail.processId} - Nothing filled at market order from function ${FUNCTION_INDEX + 1}; Now making an re-attempt at ask/bid price`);
        } else {
            logger.info(`${transactionDetail.processId} - Remaining quantity ${quantity} at function ${FUNCTION_INDEX + 1}: Partial`);
            return reverseTransaction1(transactionDetail, quantity); // Reverse order
        }
    }

    logger.info(`${transactionDetail.processId} - Attempts remaining - ${attempts} at function ${FUNCTION_INDEX + 1}`);

    const [ marketPrices, bidAskPrices ] = await Promise.all([
            fetchMarketPrices(),
            fetchBidAskPrices()
        ]),
        symbolArray = Object.keys(SYMBOLS),
        bidArray = mapPriceResponseToOrder(symbolArray, bidAskPrices, PRICE_TYPE.BID_PRICE),
        askArray = mapPriceResponseToOrder(symbolArray, bidAskPrices, PRICE_TYPE.ASK_PRICE),
        marketArray = mapPriceResponseToOrder(symbolArray, marketPrices, PRICE_TYPE.MARKET_PRICE),
        /* User-defined formulas */
        formula1 = transactionDetail.transactions[0].executedPrice + bidArray[0] * (marketArray[0] + askArray[0]) + bidArray[1] * (marketArray[1] + askArray[1]) + bidArray[2] / (marketArray[2] + askArray[2]) + bidArray[3] - marketArray[3] / askArray[3],
        formula2 = transactionDetail.transactions[1].marketPrice + bidArray[0] - marketArray[0] / askArray[0] + bidArray[1] * 2 + marketArray[1] - 1 / askArray[1] + bidArray[2] / (marketArray[2] + askArray[2]) + bidArray[3] - marketArray[3] / askArray[3];

    // Check condition
    if (formula1 < 2000 && 60 < formula2 < 1000) {
        /* Code will only run for this condition block */

        logger.info(`${transactionDetail.processId} - Function ${FUNCTION_INDEX + 1}: Conditions are met; Progressing`);

        const updatedTransactionDetail = updateAllPrices(transactionDetail, {
                // marketPrices: isMarketPrice? marketPrices : undefined,
                bidAskPrices: !isMarketPrice ? bidAskPrices : undefined
            }),
            orderInfo = getOrderInfo(updatedTransactionDetail, FUNCTION_INDEX, isMarketPrice); // Last parameter is used to check whether the trade is to be placed at market or at bid/ask price

        logger.info(`${transactionDetail.processId} - Function ${FUNCTION_INDEX + 1}: Price updated transaction detail - ${JSON.stringify(updatedTransactionDetail)}`);

        try {
            logger.info(`${transactionDetail.processId} - Placing limit order from function ${FUNCTION_INDEX + 1} at ${isMarketPrice? "market" : "ask/buy"} price with order info - ${JSON.stringify(orderInfo, null, 2)}`);

            const executionResponse = await executeOrder({
                    ...orderInfo,
                    type: TYPE.LIMIT,
                    timeInForce: TIME_IN_FORCE.GTC,
                    quantity: quantity
                }, true),
                updatedValues = {
                    orderId: executionResponse.orderId,
                    cummulativeQuoteQty: executionResponse.cummulativeQuoteQty,
                    executedQty: executionResponse.executedQty,
                    setPrice: executionResponse.price,
                    fills: executionResponse.fills
                },
                newTransactionDetail = updateTransactionDetail(updatedTransactionDetail, FUNCTION_INDEX, updatedValues);

            logger.info(`${transactionDetail.processId} - Execution response from function ${FUNCTION_INDEX + 1}: ${JSON.stringify(executionResponse, null, 2)})}`);

            if (executionResponse.status === ORDER_STATUS.FILLED) {
                logger.info(`${transactionDetail.processId} - Order ${executionResponse.status} at function ${FUNCTION_INDEX + 1}`);
                const passQty = executionResponse.side === SIDE.BUY? executionResponse.executedQty : executionResponse.cummulativeQuoteQty;

                return transaction3(newTransactionDetail, passQty);
            } else {
                await new Promise(resolve => setTimeout(resolve, DELAY_STATUS_CHECK)); // Wait and then check status
                return checkOrderStatusInLoop(newTransactionDetail, quantity, attempts, isMarketPrice, performance.now()); // Start timer
            }
        } catch(error) {
            handleSubProcessError(error, transactionDetail, FUNCTION_INDEX, quantity);
        }
    } else {
        logger.info(`${transactionDetail.processId} - Function ${FUNCTION_INDEX + 1}: Conditions are not met; Reversing order`);
        return reverseTransaction1(transactionDetail, quantity, true); // Reverse order
    }
}

async function checkAndProcessOrder(transactionDetail, error) {
    const statusResponse = await checkOrderStatus({
            symbol: transactionDetail.transactions[FUNCTION_INDEX].symbol,
            orderId: transactionDetail.transactions[FUNCTION_INDEX].orderId
        }),
        updatedValues = {
            orderId: statusResponse.orderId,
            cummulativeQuoteQty: statusResponse.cummulativeQuoteQty,
            executedQty: statusResponse.executedQty,
            setPrice: statusResponse.price
            // "fills" field is not returned by Binance
        },
        newTransactionDetail = updateTransactionDetail(transactionDetail, FUNCTION_INDEX, updatedValues);

    logger.info(`${transactionDetail.processId} - Status response from function ${FUNCTION_INDEX + 1}: ${JSON.stringify(statusResponse, null, 2)})}`);

    if (statusResponse.status === ORDER_STATUS.FILLED) {
        logger.info(`${transactionDetail.processId} - Order already filled at function ${FUNCTION_INDEX + 1}`);
        const passQty = statusResponse.side === SIDE.BUY? statusResponse.executedQty : statusResponse.cummulativeQuoteQty;

        return transaction3(newTransactionDetail, passQty);
    } else {
        // Something unusual
        logger.error(`${transactionDetail.processId} - [UNUSUAL CANCEL] Order ID: ${transactionDetail.transactions[FUNCTION_INDEX].orderId} at function ${FUNCTION_INDEX + 1} - ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`);
    }
}

async function cancelOpenOrder(transactionDetail, quantity, attempts, isMarketPrice) {
    try {
        const cancelResponse = await cancelOrder({
                symbol: transactionDetail.transactions[FUNCTION_INDEX].symbol,
                orderId: transactionDetail.transactions[FUNCTION_INDEX].orderId
            }),
            updatedValues = {
                orderId: cancelResponse.orderId,
                cummulativeQuoteQty: cancelResponse.cummulativeQuoteQty,
                executedQty: cancelResponse.executedQty,
                setPrice: cancelResponse.price
                // "fills" field is not returned by Binance
            },
            newTransactionDetail = updateTransactionDetail(transactionDetail, FUNCTION_INDEX, updatedValues);

        logger.info(`${transactionDetail.processId} - Cancel response from function ${FUNCTION_INDEX + 1}: ${JSON.stringify(cancelResponse, null, 2)})}`);

        if (cancelResponse.status === ORDER_STATUS.CANCELED) { // Partial or nothing case
            logger.info(`${transactionDetail.processId} - Order successfully canceled at function ${FUNCTION_INDEX + 1}`);

            if (parseFloat(cancelResponse.executedQty)) { // Partial case
                let passQty, repeatQty;

                if (cancelResponse.side === SIDE.BUY) {
                    passQty = cancelResponse.executedQty;
                    repeatQty = cancelResponse.cummulativeQuoteQty;
                } else {
                    passQty = cancelResponse.cummulativeQuoteQty;
                    repeatQty = cancelResponse.executedQty;
                }

                // AIBTC

                const remainingAssetQty = (parseFloat(quantity) - parseFloat(repeatQty)).toString();

                 // Run both transactions in parallel and return their results
                return Promise.allSettled([
                    transaction2(newTransactionDetail, remainingAssetQty, attempts - 1, isMarketPrice).catch(error => handleSubProcessError(error, newTransactionDetail, FUNCTION_INDEX, remainingAssetQty)),
                    transaction3(newTransactionDetail, passQty).catch(error => handleSubProcessError(error, newTransactionDetail, FUNCTION_INDEX, passQty))
                ]);
            } else { // Nothing got filled
                return transaction2(newTransactionDetail, quantity, attempts - 1, isMarketPrice);
            }
        } else {
            logger.info(`${transactionDetail.processId} - Order failed to cancel (based on status) at function ${FUNCTION_INDEX + 1}: No open orders`);
            // Check if the order was already executed
            return checkAndProcessOrder(transactionDetail);
        }
    } catch(error) {
        logger.info(`${transactionDetail.processId} - Order failed to cancel (based on error) at function ${FUNCTION_INDEX + 1}: No open orders`);
        // Check if the order was already executed
        return checkAndProcessOrder(transactionDetail, error);
    }
}

async function checkOrderStatusInLoop(transactionDetail, quantity, attempts, isMarketPrice, start) {
    const statusResponse = await checkOrderStatus({
            symbol: transactionDetail.transactions[FUNCTION_INDEX].symbol,
            orderId: transactionDetail.transactions[FUNCTION_INDEX].orderId
        }),
        updatedValues = {
            orderId: statusResponse.orderId,
            cummulativeQuoteQty: statusResponse.cummulativeQuoteQty,
            executedQty: statusResponse.executedQty,
            setPrice: statusResponse.price
            // "fills" field is not returned by Binance
        },
        newTransactionDetail = updateTransactionDetail(transactionDetail, FUNCTION_INDEX, updatedValues);

    logger.info(`${transactionDetail.processId} - Status response from function ${FUNCTION_INDEX + 1}: ${JSON.stringify(statusResponse, null, 2)})}`);

    if (statusResponse.status === ORDER_STATUS.FILLED) {
        logger.info(`${transactionDetail.processId} - Order fully executed at function ${FUNCTION_INDEX + 1}`);
        const passQty = statusResponse.side === SIDE.BUY? statusResponse.executedQty : statusResponse.cummulativeQuoteQty;

        return transaction3(newTransactionDetail, passQty);
    } else { // Partial or empty case
        const end = performance.now(); // End timer

        logger.info(`${transactionDetail.processId} - Order not fully executed at function ${FUNCTION_INDEX + 1} yet`);

        if (end - start < ITERATION_TIME) { // Time is remaining
            logger.info(`${transactionDetail.processId} - Re-checking order status at function ${FUNCTION_INDEX + 1}`);
            await new Promise(resolve => setTimeout(resolve, DELAY_STATUS_CHECK)); // Wait and then check status
            return checkOrderStatusInLoop(newTransactionDetail, quantity, attempts, isMarketPrice, start);
        }

        // No time is remaining, cancel the current order and make a reattempt (if remaining) when the order gets canceled
        return cancelOpenOrder(newTransactionDetail, quantity, attempts, isMarketPrice);
    }
}

module.exports = transaction2;
