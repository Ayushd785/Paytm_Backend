const express = require("express");
const { default: mongoose } = require("mongoose");
const Account = require("../db/account");
const userMiddleware = require("../middleware/userMiddleware");
const User = require("../db/user");
const router = express.Router();

// demo route
router.get("/", (req, res) => {
  res.status(200).json({
    msg: "accounts route is Running",
  });
});

// transaction routes

router.post("/transfer", userMiddleware, async (req, res) => {
  const session = await mongoose.startSession();

  session.startTransaction();
  const { amount, to } = req.body;

  console.log("req.userId =", req.userId);

  const account = await Account.findOne({ userId: req.userId }).session(
    session
  );
  console.log("Account:", account);

  //   if (!account) {
  //     console.log("Account not found for userId:", req.userId);
  //   }

  //   if (account) {
  //     console.log(
  //       "Balance type:",
  //       typeof account.balance,
  //       "Value:",
  //       account.balance
  //     );
  //   }

  //   if (account && account.balance < amount) {
  //     console.log("Balance is less than amount, failing transaction");
  //   }

  if (!account || account.balance < amount) {
    await session.abortTransaction();
    return res.status(403).json({
      msg: "Insufficient balance",
    });
  }

  const toAccount = await Account.findOne({ userId: to }).session(session);

  if (!toAccount) {
    await session.abortTransaction();
    return res.status(400).json({
      msg: "Invalid account",
    });
  }

  // perfrom the transfer
  await Account.updateOne(
    { userId: req.userId },
    { $inc: { balance: -amount } }
  ).session(session);
  await Account.updateOne(
    { userId: to },
    { $inc: { balance: amount } }
  ).session(session);

  // commit the transaction

  await session.commitTransaction();
  res.json({
    msg: "Transfer successfull",
  });
});

// get balance route
router.get("/balance", userMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    const account = await Account.findOne({ userId });

    if (!account) {
      return res.status(404).json({
        msg: "Account not found",
      });
    }

    return res.status(200).json({
      msg: "Balance fetched successfully",
      balance: account.balance,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      msg: "Internal server error",
      error: err.message,
    });
  }
});

module.exports = router;
