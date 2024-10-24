const express = require('express');
const { generateInvoice, generateOverallInvoice } = require('../controllers/invoiceController');

const router = express.Router();

router.post('/generate', generateInvoice);
router.get('/download-balance-sheet', generateOverallInvoice);

module.exports = router;
