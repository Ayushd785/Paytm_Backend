const express = require("express");
const router = express.Router();
const userRoute = require("./user");
const accountRoute = require("./account");

router.get("/", (req, res) => {
  res.status(200).json({
    msg: "Backend is running well",
  });
});

router.use("/user", userRoute);
router.use("/account", accountRoute);

module.exports = router;
