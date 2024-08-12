const SYMBOLS = Object.freeze({
    "AIUSDT": {
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
});

const CONDITION_SETS = Object.freeze({
    A: [
        { symbol: "AIUSDT", side: "BUY" },
        { symbol: "AIBTC", side: "SELL" },
        { symbol: "MANABTC", side: "BUY" },
        { symbol: "MANAUSDT", side: "SELL" }
    ],
    B: [
        { symbol: "AIUSDT", side: "SELL" },
        { symbol: "MANAUSDT", side: "BUY" },
        { symbol: "MANABTC", side: "SELL" },
        { symbol: "AIBTC", side: "BUY" }
    ]
});

const TRANSACTION_TEMPLATE = Object.freeze({
    processId: null,
    orderStatus: null,
    consumedTime: null,
    transactions: [
        { orderId: null, cummulativeQuoteQty: null, executedQty: null, executedPrice: null, marketPrice: null, bidPrice: null, askPrice: null },
        { orderId: null, cummulativeQuoteQty: null, executedQty: null, executedPrice: null, marketPrice: null, bidPrice: null, askPrice: null },
        { orderId: null, cummulativeQuoteQty: null, executedQty: null, executedPrice: null, marketPrice: null, bidPrice: null, askPrice: null },
        { orderId: null, cummulativeQuoteQty: null, executedQty: null, executedPrice: null, marketPrice: null, bidPrice: null, askPrice: null },
        { orderId: null, cummulativeQuoteQty: null, executedQty: null, executedPrice: null, marketPrice: null, bidPrice: null, askPrice: null }
    ]
});

function createTransactionDetail(condition) {
    // Get the condition set based on the provided condition
    const conditionSet = CONDITION_SETS[condition];

    // Create a deep copy of the transaction template
    const transactionDetail = JSON.parse(JSON.stringify(TRANSACTION_TEMPLATE));

    // Fill in the transaction details based on the condition set
    conditionSet.forEach((condition, index) => {
        const symbolDetails = SYMBOLS[condition.symbol];

        transactionDetail.transactions[index] = {
            ...transactionDetail.transactions[index],
            symbol: condition.symbol,
            side: condition.side,
            qtyPrecision: symbolDetails.qtyPrecision,
            pricePrecision: symbolDetails.pricePrecision,
            minNotional: symbolDetails.minNotional,
            minQty: symbolDetails.minQty
        };
    });

    // Create the reverse function (5th transaction)
    const firstTransaction = transactionDetail.transactions[0];
    transactionDetail.transactions[4] = {
        ...transactionDetail.transactions[4],
        symbol: firstTransaction.symbol,
        side: firstTransaction.side === "BUY" ? "SELL" : "BUY",
        qtyPrecision: firstTransaction.qtyPrecision,
        pricePrecision: firstTransaction.pricePrecision,
        minNotional: firstTransaction.minNotional,
        minQty: firstTransaction.minQty
    };

    return transactionDetail;
}

console.log(CONDITION_SETS["A"].map(item => item.symbol));

// Example usage
const transactionDetailA = createTransactionDetail("A");
const transactionDetailB = createTransactionDetail("B");

console.log("Transaction Detail for Condition A:", transactionDetailA);
console.log("Transaction Detail for Condition B:", transactionDetailB);
