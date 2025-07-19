const express = require("express");
const User = require("../db/user");
const router = express.Router();
const zod = require("zod");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const userMiddleware = require("../middleware/userMiddleware");
const Account = require("../db/account");
const mongoose = require("mongoose");

// Test route
router.get("/test", (req, res) => {
  res.status(200).json({
    msg: "User router is running",
  });
});

// Zod validation schema with constraints
const signupSchema = zod.object({
  username: zod.string().min(3, "Username must be at least 3 characters"),
  password: zod.string().min(6, "Password must be at least 6 characters"),
  firstname: zod.string().min(1, "First name is required"),
  lastname: zod.string().min(1, "Last name is required"),
});

// Signup route
router.post("/signup", async (req, res) => {
  try {
    const body = req.body;
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return res.status(400).json({
        msg: "Invalid input data",
        errors: parsed.error.errors,
      });
    }

    const existingUser = await User.findOne({ username: body.username });
    if (existingUser) {
      return res.status(409).json({
        msg: "User already exists, please login",
      });
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const newUser = await User.create({
      username: body.username,
      password: hashedPassword,
      firstname: body.firstname,
      lastname: body.lastname,
    });
    const userId = newUser._id;

    await Account.create({
      userId,
      balance: 1 + Math.random() * 10000,
    });

    const token = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "1h",
      }
    );

    res.status(201).json({
      msg: "User created successfully",
      userId: newUser._id,
      token: token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      msg: "Internal server error",
    });
  }
});

// Signin route
router.post("/signin", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({
        msg: "Invalid username or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        msg: "Invalid username or password",
      });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "1h",
    });

    res.json({
      msg: "Login successful",
      token: token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      msg: "Internal server error",
    });
  }
});
const updateBodySchema = zod.object({
  firstName: zod.string().optional(),
  lastName: zod.string().optional(),
  password: zod.string().optional(),
});
// update body via put request
router.put("/", userMiddleware, async (req, res) => {
  const parsed = updateBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(404).json({
      msg: "error while updating the user information",
    });
  }
  await User.updateOne(
    { _id: req.userId }, // filter to find the user
    { $set: req.body } // what fields to update
  );

  res.json({
    msg: "User info update successfully",
  });
});

// search the user based on his firstname or lastname initials

router.get("/bulk", async (req, res) => {
  const filter = req.query.filter || "";

  const users = await User.find({
    $or: [
      {
        firstname: {
          $regex: filter,
        },
      },
      {
        lastname: {
          $regex: filter,
        },
      },
    ],
  });

  res.json({
    user: users.map((user) => ({
      username: user.username,
      firstname: user.firstname,
      lastname: user.lastname,
      _id: user._id,
    })),
  });
});

// to get my Basic information
router.get("/me", userMiddleware, async (req, res) => {
  const userId = req.userId;
  const user = await User.findById(userId);
  res.json({
    id: userId,
    firstname: user.firstname,
    lastname: user.lastname,
    username: user.username,
  });
});

module.exports = router;
