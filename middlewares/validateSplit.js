exports.validatePercentageSplit = (req, res, next) => {
    const { splitMethod, participants, totalAmount } = req.body;
  
    // Check if splitMethod is valid
    if (!splitMethod || !['equal', 'exact', 'percentage'].includes(splitMethod)) {
      return res.status(400).json({ success: false, message: 'Invalid or missing split method' });
    }
  
   // Check if participants are provided
    if (!participants || participants.length === 0) {
      return res.status(400).json({ success: false, message: 'Participants are required' });
    }
  
   // Check if total amount is provided and +ve
    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Total amount must be greater than 0' });
    }
  
   // Check if splitMethod is 'percentage' and sums to 100
    if (splitMethod === 'percentage') {
      const totalPercentage = participants.reduce((acc, participant) => acc + participant.amountOwed, 0);
        // if not send error
      if (totalPercentage !== 100) {
        return res.status(400).json({ success: false, message: 'Percentages must add up to 100' });
      }
    }
  
    // Check if splitMethod is 'exact' and sums to totalAmount
    // For equla case, we will split up, so no need to chk for that
    if (splitMethod === 'exact') {
      const totalOwed = participants.reduce((acc, participant) => acc + participant.amountOwed, 0);
        // if not send error
      if (totalOwed !== totalAmount) {
        return res.status(400).json({ success: false, message: 'The exact amounts must add up to the total amount' });
      }
    }
    // if all checks pass, call next
    next();
  };
  