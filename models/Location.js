const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema({
    deviceSerialNumber: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    lat: {
        type: Number,
        required: true,
    },
    lng: {
        type: Number,
        required: true,
    },
    accuracy: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true
    },
    networkType: {
        type: String,
        required: true,
    },
    dateTime: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Location", locationSchema);
