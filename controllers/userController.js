const User = require('../models/userModel');

//@post method - add user
//@needs name, email, mobile
//@by specific user
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, mobile } = req.body;
    const user = new User({ name, email, mobile });
    await user.save();
    res.status(201).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

//@get method - fetch user details
//@params - userID of mongoDB
//@for specific user or admin
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};
