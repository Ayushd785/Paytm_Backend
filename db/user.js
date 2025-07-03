const mongoose = require("mongoose");

mongoose.connect(
  "mongodb+srv://ayushd785:ayush%40ayush@cluster0.hptou9o.mongodb.net/PaytmProject"
);

const UserSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    minLength: 3,
    maxLength: 30,
  },
  password: {
    type: String,
    required: true,
    minLength: 6,
  },
  firstname: {
    type: String,
    required: true,
    trim: true,
    maxLength: 30,
  },
  lastname: {
    type: String,
    required: true,
    trim: true,
    maxLength: 30,
  },
});

const User = mongoose.model("User", UserSchema);

module.exports = User;
