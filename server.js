const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();

app.use(cors());
app.use(bodyParser.json());

// server ignition
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server ignited on port ${PORT}`);
});