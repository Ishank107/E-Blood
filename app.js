const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_university_key';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eblood_db';
const LOG_FILE_PATH = path.join(process.cwd(), 'donor_logs.txt');

let connectionPromise = global.__ebloodMongoPromise || null;

const donorSchema = new mongoose.Schema({
    fullName: String,
    bloodGroup: String,
    email: { type: String, unique: true },
    phone: String,
    city: String
});

const emergencySchema = new mongoose.Schema({
    hospitalName: String,
    requiredGroup: String,
    urgency: String,
    location: String,
    createdAt: { type: Date, default: Date.now }
});

const Donor = mongoose.models.Donor || mongoose.model('Donor', donorSchema);
const Emergency = mongoose.models.Emergency || mongoose.model('Emergency', emergencySchema);

async function connectToDatabase() {
    if (mongoose.connection.readyState === 1) return;
    if (!connectionPromise) {
        connectionPromise = mongoose.connect(MONGODB_URI).then(() => mongoose);
        global.__ebloodMongoPromise = connectionPromise;
    }
    await connectionPromise;
}

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone) => /^\d{10}$/.test(String(phone).replace(/\s|-/g, ''));
const isValidText = (value) => /^[A-Za-z][A-Za-z\s'.-]{1,}$/.test(value);
const isValidPlaceText = (value) => /^[A-Za-z0-9][A-Za-z0-9\s'&.,\/-]{1,}$/.test(value);

const sendValidationError = (res, field, message) => {
    res.status(400).json({ error: { field, message } });
};

const appendWebsiteLog = (type, payload) => {
    let logEntry = '';
    const nowStr = new Date().toString();
    if (type === 'DONOR') {
        const name = payload.fullName || payload.name || 'Unknown';
        const group = payload.bloodGroup || payload.requiredGroup || 'N/A';
        logEntry = `New Donor: ${name} (${group}) at ${nowStr}\n`;
    } else if (type === 'EMERGENCY') {
        const hosp = payload.hospitalName || 'Unknown Hospital';
        const grp = payload.requiredGroup || 'N/A';
        const urg = payload.urgency || '';
        const loc = payload.location ? ` location: ${payload.location}` : '';
        logEntry = `Emergency: ${hosp} (${grp}) at ${nowStr} ${urg}${loc}\n`;
    } else {
        logEntry = `[${new Date().toISOString()}] ${type}: ${JSON.stringify(payload)}\n`;
    }

    fs.appendFile(LOG_FILE_PATH, logEntry, () => {});
};

const validateDonorPayload = (payload) => {
    if (!payload.fullName) return { field: 'fullName', message: 'Full name is required.' };
    if (!payload.bloodGroup) return { field: 'bloodGroup', message: 'Blood group is required.' };
    if (!payload.email) return { field: 'email', message: 'Email address is required.' };
    if (!payload.phone) return { field: 'phone', message: 'Phone number is required.' };
    if (!payload.city) return { field: 'city', message: 'City is required.' };

    if (!isValidText(payload.fullName)) return { field: 'fullName', message: 'Full name should contain only letters and standard name characters.' };
    if (!isValidEmail(payload.email)) return { field: 'email', message: 'Email should be in correct format.' };

    const normalizedPhone = String(payload.phone).replace(/\s|-/g, '');
    if (!isValidPhone(normalizedPhone)) {
        if (!/^\d+$/.test(normalizedPhone)) return { field: 'phone', message: 'Phone number should contain only digits.' };
        return { field: 'phone', message: 'Phone number should be exactly 10 digits.' };
    }

    if (!isValidText(payload.city)) return { field: 'city', message: 'City should contain only letters and standard name characters.' };

    return null;
};

const validateEmergencyPayload = (payload) => {
    if (!payload.hospitalName) return { field: 'hospitalName', message: 'Hospital name is required.' };
    if (!payload.requiredGroup) return { field: 'requiredGroup', message: 'Blood group needed is required.' };
    if (!payload.urgency) return { field: 'urgency', message: 'Urgency is required.' };
    if (!payload.location) return { field: 'location', message: 'Location is required.' };

    if (!isValidPlaceText(payload.hospitalName)) return { field: 'hospitalName', message: 'Hospital name should contain valid characters only.' };
    if (!isValidPlaceText(payload.location)) return { field: 'location', message: 'Location should contain valid characters only.' };

    return null;
};

function createApp({ onEmergencyBroadcast = () => {} } = {}) {
    const app = express();

    app.use(express.json());
    app.use(cors());
    app.use(express.static(path.join(process.cwd())));

    app.get('/', (req, res) => {
        res.sendFile(path.join(process.cwd(), 'index.html'));
    });

    app.post('/api/login', (req, res) => {
        const token = jwt.sign({ id: 1, role: 'admin' }, JWT_SECRET, { expiresIn: 86400 });
        res.status(200).json({ auth: true, token });
    });

    app.post('/api/register', async (req, res) => {
        try {
            await connectToDatabase();

            const validationError = validateDonorPayload(req.body);
            if (validationError) return sendValidationError(res, validationError.field, validationError.message);

            const newDonor = new Donor(req.body);
            await newDonor.save();
            appendWebsiteLog('DONOR', req.body);

            res.status(201).json({ message: 'Registered successfully!' });
        } catch (error) {
            res.status(400).json({ error: 'Registration failed. Email might exist.' });
        }
    });

    app.post('/api/emergencies', async (req, res) => {
        try {
            await connectToDatabase();

            const validationError = validateEmergencyPayload(req.body);
            if (validationError) return sendValidationError(res, validationError.field, validationError.message);

            const newEmergency = new Emergency(req.body);
            await newEmergency.save();
            appendWebsiteLog('EMERGENCY', req.body);
            onEmergencyBroadcast(newEmergency);

            res.status(201).json({ message: 'Broadcasted successfully!' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to create emergency.' });
        }
    });

    app.get('/api/donors', async (req, res) => {
        try {
            await connectToDatabase();

            const donors = await Donor.find().sort({ _id: -1 });
            res.status(200).json(donors);
        } catch (error) {
            res.status(500).json({ error: 'Could not fetch data.' });
        }
    });

    app.get('/api/seed', async (req, res) => {
        const dummyDonors = [
            { fullName: 'Arjun Sharma', bloodGroup: 'O+', email: 'arjun@example.com', phone: '+91 98765 11111', city: 'Amritsar' },
            { fullName: 'Priya Patel', bloodGroup: 'A-', email: 'priya@example.com', phone: '+91 98765 22222', city: 'Ludhiana' },
            { fullName: 'Rahul Verma', bloodGroup: 'B+', email: 'rahul.v@example.com', phone: '+91 98765 33333', city: 'Jalandhar' },
            { fullName: 'Ananya Singh', bloodGroup: 'AB+', email: 'ananya.s@example.com', phone: '+91 98765 44444', city: 'Chandigarh' },
            { fullName: 'Vikram Malhotra', bloodGroup: 'O-', email: 'vikram.m@example.com', phone: '+91 98765 55555', city: 'Amritsar' },
            { fullName: 'Neha Gupta', bloodGroup: 'A+', email: 'neha.g@example.com', phone: '+91 98765 66666', city: 'Patiala' }
        ];

        try {
            await connectToDatabase();
            await Donor.deleteMany({});
            await Donor.insertMany(dummyDonors);
            res.send('<h2 style="color: green; font-family: sans-serif;">✅ Dummy data injected! You can now view the portal.</h2>');
        } catch (error) {
            res.status(500).send('❌ Error adding dummy data.');
        }
    });

    return app;
}

module.exports = {
    createApp,
    connectToDatabase
};