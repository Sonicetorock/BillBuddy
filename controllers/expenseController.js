const Expense = require('../models/expenseModel');
const User = require('../models/userModel');

// @post method - add expense
// @needs description, totalAmount, splitMethod, participants
// @by a specific user
// @param - participants - will be given by frontend like user will select the users those are registered in db along with the amount they owe
exports.addExpense = async (req, res, next) => {
  try {
    const { description, totalAmount, splitMethod, participants } = req.body;
    const expense = new Expense({ description, totalAmount, splitMethod, participants });
    await expense.save();
    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
};

// @get method - fetch expenses for a specific user
// @needs userID of mongoDB
// @for specific user
exports.getUserExpenses = async (req, res, next) => {
  try {
    const expenses = await Expense.find({ 'participants.user': req.params.userId });
    res.status(200).json({ success: true, data: expenses });
  } catch (error) {
    next(error);
  }
};

// @get method - Retrieve all expenses 
// @no params required
// @for admin
exports.getOverallExpenses = async (req, res, next) => {
  try {
    const expenses = await Expense.find();
    res.status(200).json({ success: true, data: expenses });
  } catch (error) {
    next(error);
  }
};
