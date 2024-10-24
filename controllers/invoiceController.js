const  path  = require('path');
const Expense = require('../models/expenseModel');
const { createInvoice } = require('../utils/createInvoice');
const {createOverallInvoice} = require('../utils/createOverallInvoice')

//API endpoint : 'https://localhost:3000/invoices/generate'
//@POST method - needs expenseID of required expense and userId who is downloading

// generate balance sheet for a specific expense
exports.generateInvoice = async (req, res) => {
    const { expenseId, userId } = req.body; // Assuming you're sending expenseId in the body
    const expense = await Expense.findById(expenseId).populate('participants.user');

    if (!expense) {
        return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    const invoicePath = `./invoices/invoice_${expenseId}.pdf`;
    createInvoice(expense, invoicePath, userId);
    
    res.status(200).json({ success: true, message: 'Invoice generated', invoicePath });
};

//API endpoint : 'https://localhost:3000/invoices/download-balance-sheet'
//@GET Method

// Generates the overall expense balance sheet
exports.generateOverallInvoice  = async (req, res) => {
    try {
        const filePath = path.join(__dirname, '../invoices/overall_balance_sheet.pdf');
        await createOverallInvoice(filePath);

        res.download(filePath, 'Overall_Balance_Sheet.pdf', (err) => {
            if (err) {
                console.log("Error downloading file:", err);
                res.status(500).send("Error generating balance sheet");
            }
        });
    } catch (error) {
        console.error("Error generating balance sheet:", error);
        res.status(500).send("Server error");
    }
};

