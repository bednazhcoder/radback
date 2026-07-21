const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: "https://radioactivityinaustria.netlify.app"
}));
app.use(bodyParser.json());
app.use(express.static("public"));

const DATA_FILE = "data.json";
const HAUS_FILE = "haus_messungen.json";
const ADMIN_USER = "admin";
const ADMIN_PASS = "1234";

function loadData() {
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify([]));
    }
    let data = JSON.parse(fs.readFileSync(DATA_FILE));
    // Ältere Einträge ohne id bekommen automatisch eine zugewiesen
    let changed = false;
    data = data.map(m => {
        if (!m.id) { m.id = Date.now().toString() + Math.random().toString(36).slice(2); changed = true; }
        return m;
    });
    if (changed) fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return data;
}

function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function loadHaus() {
    if (!fs.existsSync(HAUS_FILE)) {
        fs.writeFileSync(HAUS_FILE, JSON.stringify([]));
    }
    return JSON.parse(fs.readFileSync(HAUS_FILE));
}

function saveHaus(data) {
    fs.writeFileSync(HAUS_FILE, JSON.stringify(data, null, 2));
}

// LOGIN
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USER && password === ADMIN_PASS) {
        return res.json({ success: true });
    }
    res.json({ success: false });
});

// GET
app.get("/measurements", (req, res) => {
    res.json(loadData());
});

// ADD
app.post("/measurements", (req, res) => {
    const data = loadData();
    const newMeasurement = {
        id: Date.now().toString(),
        location: req.body.location,
        date: req.body.date,
        altitude: req.body.altitude,
        value: req.body.value,
        lat: req.body.lat,
        lon: req.body.lon
    };
    data.push(newMeasurement);
    saveData(data);
    res.json({ success: true });
});

// DELETE
app.delete("/measurements/:id", (req, res) => {
    let data = loadData();
    const idToDelete = req.params.id;
    data = data.filter(m => m.id !== idToDelete);
    saveData(data);
    res.json({ success: true });
});

// UPDATE
app.put("/measurements/:id", (req, res) => {
    let data = loadData();
    const idToUpdate = req.params.id;
    data = data.map(m => {
        if (m.id === idToUpdate) {
            return {
                ...m,
                location: req.body.location,
                date: req.body.date,
                altitude: req.body.altitude,
                value: req.body.value,
                lat: req.body.lat,
                lon: req.body.lon
            };
        }
        return m;
    });
    saveData(data);
    res.json({ success: true });
});

// HAUS-MESSUNGEN: GET
app.get("/haus-measurements", (req, res) => {
    res.json(loadHaus());
});

// HAUS-MESSUNGEN: ADD
app.post("/haus-measurements", (req, res) => {
    const { date, value } = req.body;
    if (!date || isNaN(value) || value <= 0) {
        return res.status(400).json({ error: "Ungültige Daten" });
    }
    let daten = loadHaus().filter(d => d.date !== date); // Duplikate entfernen
    daten.push({ date, value: Number(value) });
    daten.sort((a, b) => a.date.localeCompare(b.date));
    saveHaus(daten);
    res.json({ success: true });
});

// HAUS-MESSUNGEN: DELETE
app.delete("/haus-measurements/:date", (req, res) => {
    const date = req.params.date;
    const daten = loadHaus().filter(d => d.date !== date);
    saveHaus(daten);
    res.json({ success: true });
});

app.listen(3000, () => {
    console.log("Server läuft auf http://localhost:3000");
});
