const validator = require("validator");

const sanitization = async (data) => {
    const obj = {};
    return new Promise((resolve) => {
        Object.entries(data).forEach(([key, initialValue]) => {
            let value = initialValue;

            if (typeof value !== "string") {
                value = value !== undefined && value !== null ? String(value) : "";
            }

            if (key === "password") {
                obj[key] = validator.trim(value);
            } else {
                obj[key] = validator.escape(validator.trim(value));
            }
        });
        resolve(obj);
    });
};

const isExists = (variable) => {
    return variable !== undefined && variable !== null;
};

module.exports = { sanitization, isExists };
