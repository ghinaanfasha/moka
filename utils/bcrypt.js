const bcrypt = require("bcrypt");

const saltRounds = 10;

const encrypt = (password) => {
    return bcrypt.hashSync(password, saltRounds);
};

const comparePassword = (password, hash) => {
    return bcrypt.compareSync(password, hash);
};

module.exports = { encrypt, comparePassword };
