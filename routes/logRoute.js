const express = require("express");
const router = express.Router();
const axios = require("axios");
const Location = require("../models/Location");
const { Parser } = require("json2csv");
const XLSX = require("xlsx");

router.get("/ping", (req, res) => {
  res.send("✅ Server is alive!");
});

// POST /api/log-location
router.post("/log-location", async (req, res) => {
  try {
    const { deviceSerialNumber, lat, lng, accuracy, networkType, date, time } = req.body;

    // Call Nominatim API to reverse geocode
    let address = "Unknown Address";
    try {
      const geoRes = await axios.get("https://nominatim.openstreetmap.org/reverse", {
        params: {
          format: "jsonv2",
          lat,
          lon: lng
        },
        headers: {
          'User-Agent': 'latlngNodejs/1.0 (gopi.dev@example.com)'
        }
      });

      address = geoRes.data.display_name || "Unknown Address";
    } catch (geoErr) {
      console.warn("Geocoding failed:", geoErr.message);
    }

    const location = new Location({
      deviceSerialNumber,
      lat,
      lng,
      accuracy,
      address,
      networkType,
      date,
      time
    });

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

// GET /api/locations-by-device?deviceSerialNumber=POS123
router.get("/locations-by-device", async (req, res) => {
  try {
    const { deviceSerialNumber } = req.query;
    if (!deviceSerialNumber) {
      return res.status(400).json({ error: "deviceSerialNumber is required" });
    }

    const locations = await Location.find({ deviceSerialNumber }).sort({ createdAt: -1 });
    res.json(locations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/locations-by-device-and-date?deviceSerialNumber=POS123&date=2025-06-18
router.get("/locations-by-device-and-date", async (req, res) => {
  try {
    const { deviceSerialNumber, date } = req.query;

    if (!deviceSerialNumber || !date) {
      return res.status(400).json({ error: "deviceSerialNumber and date are required" });
    }

    const start = new Date(date);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const locations = await Location.find({
      deviceSerialNumber,
      createdAt: { $gte: start, $lte: end }
    }).sort({ createdAt: -1 });

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
      DeviceSerialNumber : loc.deviceSerialNumber,
      Lat: loc.lat,
      Lng: loc.lng,
      Accuracy : loc.accuracy,
      Address : loc.address,
      NetworkType: loc.networkType,
      Date: loc.date,
      Time: loc.time
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