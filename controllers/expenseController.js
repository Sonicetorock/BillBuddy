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

// @put method - Mark a specific participant as paid for paticular expense
// @param expenseId - id of the expense, userId - id of the user
// @for specic user to split he belongs to
exports.markAsPaid = async (req, res) => {
  const { expenseId, userId } = req.body;

  try {
    const expense = await Expense.findById(expenseId);
    console.log("Expsense :", expense)
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    // chk if the user is a participant in the expense
    const participant = expense.participants.find(p => p.user.toString() === userId);

    // if not send that you are not a participant
    if (!participant) {
      return res.status(404).json({ success: false, message: 'Participant not found in this split' });
    }
    console.log("isPaid Already :", participant.status)
    //chk if already paid
    if(participant.status === "paid") {
      return res.status(400).json({ success: false, message: 'Participant already paid / marked as paid' });
    }

    // set status to paid
    participant.status = "paid";
    participant.paidOn = new Date();
    
    //every participant is paid
    if (expense.participants.every(p => p.status === 'paid')) {
        expense.isPaid = true;
        expense.paidOn = new Date();
    }
    await expense.save();

    res.status(200).json({ success: true, message: 'Payment status updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error (Expense doesnt exist!)' });
  }
};

