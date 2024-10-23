const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  splitMethod: {
    type: String,
    enum: ['equal', 'exact', 'percentage'],
    required: [true, 'Split method is required']
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amountOwed: {
      type: Number,
      required: true,
      min: [0, 'Amount owed cannot be negative']
    },
    status: {
      type: String,
      enum: ['pending', 'paid'], // status field for each participant for the split
      default: 'pending'
    },
    paidOn: {
      type: Date,
      required: function() {
        return this.isPaid;  // only require this field if isPaid is true
      }
    }
  }],
  isPaid: {
    type: Boolean,
    default: false
  },
},{timestamps: true});

// Indexing
expenseSchema.index({ isPaid: 1 });

module.exports = mongoose.model('Expense', expenseSchema);