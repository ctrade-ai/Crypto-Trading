module.exports = {
    apps: [{
      name: "app",
      script: "./app.js", // Replace with your entry file
      env: {
        NODE_ENV: "stage",
        BASE_URL: "https://testnet.binance.vision",
        API_KEY: "BsqzqZH5xaWHuxaTFR7O5sQxXhrnyO26ThGgcdrTHWiK0m9upREB9JuiJZSqDE3K",
        API_SECRET: "kYbAPQRNmOkDFTGgmkRKzkkM9RvGxJwPniI9EKGaKbWeBeoklSkuAtdLQq1xjG72",
        MARKET_PRICES_PATH: "/api/v3/ticker/price",
        BID_ASK_PRICES_PATH: "/api/v3/ticker/bookTicker",
        ORDER_PATH: "/api/v3/order"
      },
      env_prod: {
        NODE_ENV: "prod",
        BASE_URL: "https://api.binance.com",
        API_KEY: "your-api-key", // Replace with your actual API key
        API_SECRET: "your-api-secret", // Replace with your actual API secret
        MARKET_PRICES_PATH: "/api/v3/ticker/price",
        BID_ASK_PRICES_PATH: "/api/v3/ticker/bookTicker",
        ORDER_PATH: "/api/v3/order"
      }
    }]
};
