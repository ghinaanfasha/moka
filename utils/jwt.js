const jsonWebToken = require("jsonwebtoken");
require("dotenv").config();

const generateAccessToken = (user) => {
    return jsonWebToken.sign(user, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "1800s",
    });
};

const generateRefreshToken = (user) => {
    return jsonWebToken.sign(user, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "86400s",
    });
};

const verifyRefreshToken = (token) => {
    try {
        return jsonWebToken.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
        return null;
    }
};

const parseJWT = (token) => {
    try {
        const base64Payload = token.split(".")[1]; // Extract the payload
        const payloadBuffer = Buffer.from(base64Payload, "base64");
        return JSON.parse(payloadBuffer.toString("utf8")); // Safely parse JSON
    } catch (error) {
        throw new Error("Invalid token format");
    }
};

module.exports = { generateAccessToken, generateRefreshToken, verifyRefreshToken, parseJWT };
