const SYMBOLS = Object.freeze({ // Specify all coin pairs used (Here order is not maintained)
        AIUSDT: {
            qtyPrecision: 1,
            pricePrecision: 3,
            minNotional: 5,
            minQty: 0.1
        },
        AIBTC: {
            qtyPrecision: 1,
            pricePrecision: 8,
            minNotional: 0.0001,
            minQty: 0.1
        },
        MANABTC: {
            qtyPrecision: 0,
            pricePrecision: 8,
            minNotional: 0.0001,
            minQty: 1
        },
        MANAUSDT: {
            qtyPrecision: 0,
            pricePrecision: 4,
            minNotional: 5,
            minQty: 1
        }
    }),
    CONDITION_SETS = Object.freeze({
        "A": {
            inititialQty: 100,
            trades: [
                { symbol: "AIUSDT", side: "BUY" },
                { symbol: "AIBTC", side: "SELL" },
                { symbol: "MANABTC", side: "BUY" },
                { symbol: "MANAUSDT", side: "SELL" }
            ]
        },
        "B": {
            inititialQty: 200,
            trades: [
                { symbol: "AIUSDT", side: "SELL" },
                { symbol: "MANAUSDT", side: "BUY" },
                { symbol: "MANABTC", side: "SELL" },
                { symbol: "AIBTC", side: "BUY" }
            ]
        }
    }),
    PRICE_TYPE = Object.freeze({
        MARKET_PRICE: "price",
        ASK_PRICE: "askPrice",
        BID_PRICE: "bidPrice"
    }),
    TRANSACTION_ATTEMPTS = Object.freeze({ // User-specific
        TRANSACTION_1: 2,
        TRANSACTION_2: {
            MARKET: 1,
            ASK_BUY: 2
        }
    }),
    SIDE = Object.freeze({
        BUY: "BUY",
        SELL: "SELL"
    }),
    TYPE = Object.freeze({
        LIMIT: "LIMIT",
        MARKET: "MARKET"
    }),
    TIME_IN_FORCE = Object.freeze({
        GTC: "GTC",
        IOC: "IOC"
    }),
    SELECTED_PRICE = Object.freeze({
        SAME: "SAME",
        CHANGED: "CHANGED"
    }),
    TRANSACTION_STATUS = Object.freeze({
        COMPLETED: "COMPLETED",
        REVERSED: "REVERSED",
        UNDERVALUED: "UNDERVALUED",
        ERROR: "ERROR",
        REJECTED: "REJECTED"
    }),
    UNIDENTIFIED_PROCESS = "UNIDENTIFIED_PROCESS",
    ERROR_CODE = Object.freeze({
        INSUFFICIENT_QUANTITY: "INSUFFICIENT_QUANTITY"
    }),
    ORDER_STATUS = Object.freeze({
        FILLED: "FILLED",
        EXPIRED: "EXPIRED",
        PARTIALLY_FILLED: "PARTIALLY_FILLED",
        NEW: "NEW",
        CANCELED: "CANCELED"
    }),
    TRANSACTION_TEMPLATE = Object.freeze({
        set: "A", // Default Set - Do not change
        processId: null, // Frequency ID
        orderStatus: null, // COMPLETED || REVERSED || ERROR
        consumedTime: null,
        transactions: [
            { // Function 1
                orderId: null, // Unique ID generated by Binance for every transaction/order placed
                cummulativeQuoteQty: null, // Quantity of ticker 2
                executedQty: null, // Quantity of ticker 1
                executedPrice: null, // Average price of the fill orders
                marketPrice: null,
                bidPrice: null,
                askPrice: null
            },
            { // Function 2
                orderId: null,
                cummulativeQuoteQty: null,
                executedQty: null,
                executedPrice: null,
                marketPrice: null,
                bidPrice: null,
                askPrice: null
            },
            { // Function 3
                orderId: null,
                cummulativeQuoteQty: null,
                executedQty: null,
                executedPrice: null,
                marketPrice: null,
                bidPrice: null,
                askPrice: null
            },
            { // Function 4
                orderId: null,
                cummulativeQuoteQty: null,
                executedQty: null,
                executedPrice: null,
                marketPrice: null,
                bidPrice: null,
                askPrice: null
            },
            { // Reverse Function 5 is created automatically based on function 1's values (Same symbol but with opposite buy/sell)
                orderId: null,
                cummulativeQuoteQty: null,
                executedQty: null,
                executedPrice: null,
                marketPrice: null,
                bidPrice: null,
                askPrice: null
            }
        ]
    });

module.exports = {
    SYMBOLS,
    CONDITION_SETS,
    PRICE_TYPE,
    TRANSACTION_ATTEMPTS,
    SIDE,
    TYPE,
    TIME_IN_FORCE,
    SELECTED_PRICE,
    TRANSACTION_STATUS,
    UNIDENTIFIED_PROCESS,
    ERROR_CODE,
    ORDER_STATUS,
    TRANSACTION_TEMPLATE
};
