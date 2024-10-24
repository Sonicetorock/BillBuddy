const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');

// COnnect to DB
const { DBConnection } = require('./config/db');

// Import routes and middleware
const userRoutes = require('./routes/userRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const errorHandler = require('./middlewares/errorHandler');

dotenv.config();

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Routes
app.use(userRoutes);
app.use(expenseRoutes);
app.use('/invoices', invoiceRoutes);

// Error handling middleware
app.use(errorHandler);


// server ignition
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server ignited on port ${PORT}`);
    DBConnection();
});