const express = require('express');
const { addExpense, getUserExpenses, getOverallExpenses, markAsPaid } = require('../controllers/expenseController');
const { validatePercentageSplit } = require('../middlewares/validateSplit');

const router = express.Router();

router.post('/expenses', validatePercentageSplit, addExpense);
router.get('/expenses/user/:userId', getUserExpenses);
router.get('/expenses', getOverallExpenses);
router.put('/expenses/pay', markAsPaid);

module.exports = router;