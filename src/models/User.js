const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "firstname is required"],
    trim: true,
    maxlength: [50, "first name field can be a maximum of 50 characters long"],
  },
  lastName: {
    type: String,
    required: [true, "firstname is required"],
    trim: true,
    maxlength: [50, "last name field can be a maximum of 50 characters long"],
  },
  email: {
    type: String,
    required: [true, "email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      "please enter a valid email",
    ],
  },

  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "password field can be a minimum 6 characters long."],
    select: false,
  },

  phone: {
    type: String,
    trim: true,
    match: [/^[\+]?[\d\s\-\(\)]+$/, "please enter a valid phone number"],
  },

  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  avatar: {
    type: String,
    default: null,
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
  },

  lastLogin: {
    type: Date,
    default: Date.now,
  },
  refreshTokens: [
    {
      token: String,
      createdAt: {
        type: Date,
        default: Date.now,
        expires: 2592000, //30 day
      },
    },
  ],
});
