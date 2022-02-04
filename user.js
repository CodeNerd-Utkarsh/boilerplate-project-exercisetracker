const mongoose = require("mongoose");

const UserSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    count: {
        type: Number,
        default: 0,
    },
    log: {
        type: [
            {
                description: String,
                duration: Number,
                date: String,
            },
        ],
    },
});

module.exports = mongoose.model("User", UserSchema);