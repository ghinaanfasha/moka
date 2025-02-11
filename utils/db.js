// utils/db.js

import { Sequelize } from "sequelize";
import config from "../config/config.json" assert { type: "json" };

const env = process.env.NODE_ENV || "development";
const dbConfig = config[env];

const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
        ...dbConfig,
        logging: env === "development" ? console.log : false,
        dialectOptions: {
            ...dbConfig.dialectOptions,
            requestTimeout: 30000,
            encrypt: true,
            useUTC: false,
            dateString: true,
            connectTimeout: 60000,
            retry: {
                match: [/Deadlock/i, /ECONNRESET/, /ETIMEDOUT/],
                max: 3
            }
        },
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        timezone: "Asia/Jakarta",
        insecureAuth: true,
    }
);

// Test connection
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log("✅ Database connection established successfully.");
    } catch (error) {
        console.error("❌ Unable to connect to the database:", error);
    }
};

testConnection();

export default sequelize;
