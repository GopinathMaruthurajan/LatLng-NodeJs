// locationLoggerProject/routes/logRoute.js

const express = require("express");
const router = express.Router();
const Location = require("../models/Location");
const { Parser } = require("json2csv");
const XLSX = require("xlsx");

// POST /api/log-location
router.post("/log-location", async (req, res) => {
  try {
    const { lat, lng, networkType,date,time } = req.body;
    const location = new Location({ lat, lng, networkType,date,time });
    await location.save();
    res.status(201).json({ message: "Location logged successfully", location });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/locations
router.get("/locations", async (req, res) => {
  try {
    const locations = await Location.find().sort({ dateTime: -1 });
    res.json(locations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/locations-by-date?date=2025-06-18
router.get("/locations-by-date", async (req, res) => {
  try {
    const { date } = req.query;
    const start = new Date(date);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const locations = await Location.find({
      dateTime: { $gte: start, $lte: end }
    }).sort({ dateTime: -1 });

    res.json(locations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/export-csv
router.get("/export-csv", async (req, res) => {
  try {
    const locations = await Location.find().lean();
    const parser = new Parser({ fields: ["lat", "lng", "networkType", "dateTime"] });
    const csv = parser.parse(locations);

    res.header("Content-Type", "text/csv");
    res.attachment("locations.csv");
    return res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/export-xlsx
router.get("/export-xlsx", async (req, res) => {
  try {
    const locations = await Location.find().lean();

    // Map your data to worksheet format
    const worksheetData = locations.map(loc => ({
      Lat: loc.lat,
      Lng: loc.lng,
      NetworkType: loc.networkType,
      Date : loc.date,
      Time : loc.time
    //   dateTime: loc.dateTime || `${loc.date} ${loc.time}` // adjust as needed
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Locations");

    // Write workbook buffer
    const wbBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Disposition", "attachment; filename=locations.xlsx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(wbBuffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
