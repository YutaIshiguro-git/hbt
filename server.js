const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/iotAdmin', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Schema and Model
const plantSchema = new mongoose.Schema({
    UNIT_NAME: { type: String, required: true },
    MOISTURE_LEVEL: { type: Number, required: true },
    PIN_NUMBER: { type: Number, required: true },
    ADC_CHANNEL: { type: Number, required: true },
    PLANT_NAME: { type: String, default: '' },
    PLANT_DESCRIPTION: { type: String, default: '' }
});

const Plant = mongoose.model('Plant', plantSchema);

// Routes
app.post('/api/plants', async (req, res) => {
    try {
        const newPlant = new Plant(req.body);
        await newPlant.save();
        res.status(201).json({ message: 'Plant data saved successfully', data: newPlant });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error saving plant data', error: err.message });
    }
});

app.put('/api/plants/:unitName', async (req, res) => {
    const unitName = req.params.unitName;

    try {
        // データを検索して更新
        const updatedPlant = await Plant.findOneAndUpdate(
            { UNIT_NAME: unitName }, // 検索条件
            req.body, // 更新データ
            { new: true, upsert: false } // upsert: false で存在しない場合は作成しない
        );

        if (!updatedPlant) {
            return res.status(404).json({ message: 'Plant data not found for the given UNIT_NAME' });
        }

        res.status(200).json(updatedPlant);
    } catch (error) {
        console.error('Error updating plant data:', error);
        res.status(500).json({ message: 'Failed to update plant data', error: error.message });
    }
});


app.get('/api/plants', async (req, res) => {
    try {
        const plants = await Plant.find();
        res.status(200).json(plants);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching plant data', error: err.message });
    }
});

// 履歴記録用のスキーマを定義
const WateringLogSchema = new mongoose.Schema({
    TIME_STAMP: { type: Date, required: true, default: Date.now },
    UNIT_NAME: { type: String, required: true },
    EXPECTED_MOISTURE_LEVEL: { type: Number, required: true }, // /api/plantsに保管されている水分量の目標値
    MOISTURE_LEVEL: { type: Number, required: true },
    TEMPERATURE: { type: Number, required: true },
    HUMIDITY: { type: Number, required: true },
});

const WateringLog = mongoose.model('WateringLog', WateringLogSchema);

// 新しいデータを記録するエンドポイント
const axios = require('axios'); // 外部API呼び出し用

app.post('/api/watering-logs', async (req, res) => {
    try {
        const { UNIT_NAME, MOISTURE_LEVEL, TEMPERATURE, HUMIDITY } = req.body;

        // バリデーション
        if (!UNIT_NAME || MOISTURE_LEVEL == null || TEMPERATURE == null || HUMIDITY == null) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // /api/plants からデータを取得
        const plantsResponse = await axios.get('http://localhost:3000/api/plants');
        const plantsData = plantsResponse.data;

        // UNIT_NAME に一致する EXPECTED_MOISTURE_LEVEL を取得
        const matchingPlant = plantsData.find(plant => plant.UNIT_NAME === UNIT_NAME);
        if (!matchingPlant) {
            return res.status(404).json({ message: `No matching plant found for UNIT_NAME: ${UNIT_NAME}` });
        }

        const EXPECTED_MOISTURE_LEVEL = matchingPlant.MOISTURE_LEVEL;

        // 新しいログを作成
        const newLog = new WateringLog({
            UNIT_NAME,
            EXPECTED_MOISTURE_LEVEL, // 追加フィールドを保存
            MOISTURE_LEVEL,
            TEMPERATURE,
            HUMIDITY,
        });

        // データベースに保存
        await newLog.save();

        res.status(201).json({ message: 'Watering log saved successfully', log: newLog });
    } catch (error) {
        console.error('Error saving watering log:', error);
        res.status(500).json({ message: 'Failed to save watering log', error: error.message });
    }
});

// 水やりログを取得するエンドポイント
app.get('/api/watering-logs', async (req, res) => {
    try {
        const logs = await WateringLog.find().sort({ TIME_STAMP: -1 }); // 最新のデータから取得
        res.status(200).json(logs);
    } catch (error) {
        console.error('Error fetching watering logs:', error);
        res.status(500).json({ message: 'Failed to fetch watering logs', error: error.message });
    }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Fallback to serve index.html for unknown routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});

