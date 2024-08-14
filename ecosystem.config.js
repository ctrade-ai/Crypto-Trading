module.exports = {
    apps: [{
      name: "app",
      script: "./app.js",
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
        API_KEY: "", // Replace with your actual API key
        API_SECRET: "", // Replace with your actual API secret
        MARKET_PRICES_PATH: "/api/v3/ticker/price",
        BID_ASK_PRICES_PATH: "/api/v3/ticker/bookTicker",
        ORDER_PATH: "/api/v3/order"
      },
      autorestart: false,  // Prevents PM2 from restarting the app
      watch: false,        // Ensure watch mode is off to prevent restarts on file changes
      max_restarts: 0
    }]
};
