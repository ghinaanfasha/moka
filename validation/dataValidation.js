const validator = require("validator");
const { isExists, sanitization } = require("./sanitization.js");

const dataValid = async (valid, dt) => {
    let pesan = [];
    let data = await sanitization(dt);
    
    const message = await new Promise((resolve, reject) => {
        const validationPromises = Object.entries(valid).map(async ([key, value]) => {
            const validate = valid[key].split(",");
            const msg = [];
            
            for (const v of validate) {
                switch (v) {
                    case "required":
                        if (!isExists(data[key]) || validator.isEmpty(data[key])) {
                            msg.push(`${key} is required`);
                        }
                        break;
                    case "isEmail":
                        if (isExists(data[key]) && !validator.isEmail(data[key])) {
                            msg.push(`${key} is invalid email`);
                        }
                        break;
                }
            }
            return msg;
        });

        Promise.all(validationPromises)
            .then(results => {
                pesan = results.flat().filter(msg => msg.length > 0);
                resolve(pesan);
            })
            .catch(reject);
    });

    return { message, data };
};

module.exports = { dataValid };
