const express = require("express");
const { UserModel, validUser, validateLogin, validDetails, genToken } = require("../models/userModel");
const bcrypt = require("bcrypt")
const mongoose = require('mongoose');
const router = express.Router();
const sendMail = require("../middlewares/sendMail");
const { auth, authAdmin } = require("../middlewares/auth");
const jwt = require("jsonwebtoken");

/* GET users list. */
router.get("/", authAdmin, async (req, res) => {
  let data = await UserModel.find({});
  res.json(data);
});

/* GET single user by id */
router.get("/single/:userId", async (req, res) => {
  try {
    let userId = req.params.userId;
    let data = await UserModel.findOne({ _id: userId });
    res.json(data);
  } catch (error) {
    console.log(error);
    return res.status(400).json(error);
  }
});

/* GET single user by token */
router.get("/myInfo", auth, async (req, res) => {
  let token = req.header("x-api-key");
  let decodeToken = jwt.verify(token, process.env.JWT_SECRET);
  let token_id = decodeToken._id;
  try {
    let data = await UserModel.findOne({ _id: token_id }, { password: 0 })
    res.json(data);
  }
  catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
})

// check if the user have a good token 
router.get("/checkToken", auth, async (req, res) => {
  res.json(true)
})

// Checks if the user Token is an admin
router.get("/checkTokenAdmin", authAdmin, async (req, res) => {
  res.json(true)
})

/* Users signup. */
router.post("/", async (req, res) => {
  let validBody = validUser(req.body);
  if (validBody.error) {
    return res.status(400).json(validBody.error.details);
  }
  try {
    let user = new UserModel(req.body);
    user.verificationCode = (Math.floor(Math.random() * (99999 - 10000)) + 10000).toString();
    let emailExists = await UserModel.findOne({ email: user.email });
    if (emailExists) {
      return res.json({ error: "The email already exists" });
    }
    await sendMail(user.email, "code", user.verificationCode);
    await user.save();
    // user.password = "****";
    // user.verificationCode = "****";
    return res.status(201).json(user);
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
});

// login
router.post("/login", async (req, res) => {
  let validBody = validateLogin(req.body);
  if (validBody.error) {
    return res.status(400).json(validBody.error.details);
  }
  try {
    let user = await UserModel.findOne({ email: req.body.email })
    if (!user) {
      return res.status(401).json({ error: "Email not found!" });
    }
    if (!user.verification) {
      return res.status(401).json({ error: "Email not verified!" });
    }
    if (req.body.password != user.password) {
      return res.status(401).json({ error: "Email or password is wrong" });
    }
    res.json({ token: genToken(user._id, user.role) });
  }
  catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
})

// verification code
router.patch("/verification", async (req, res) => {
  try {
    let thisEmail = req.body.email;
    let thisVerificationCode = req.body.verificationCode;
    let user = await UserModel.findOne({ email: thisEmail });
    if (!user) {
      return res.status(401).json({ error: "Email not found!" });
    }
    if (user.verificationCode != thisVerificationCode) {
      return res.json("Incorrect code");
    }
    user.verification = true;
    user.verificationCode = (Math.floor(Math.random() * (99999 - 10000)) + 10000).toString();
    let data = await UserModel.updateOne({ _id: user._id }, user);
    res.status(200).json(data);
  }
  catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
})


// Update for {weight, height, dateOfBirth}
router.put("/edit", auth, async (req, res) => {
  try {
    const token_id = req.tokenData._id;
    const details = Array.isArray(req.body) ? Object.fromEntries(req.body) : req.body || {};

    const valid = validDetails(details);
    if (valid.error) {
      console.log(valid.error);
      return res.status(400).json(valid.error.details);
    }

    const allowed = ["weight", "height", "dateOfBirth", "difficulty", "equipment", "frequency", "goal", "medical", "timePerDay", "workouts"];
    const updateObj = {};

    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(details, key) && details[key] !== undefined) {
        updateObj[key] = key === "dateOfBirth" ? new Date(details[key]) : details[key];
      }
    }

    if (Object.keys(updateObj).length === 0) {
      return res.status(200).json({ message: "No changes detected" });
    }

    const updated = await UserModel.findByIdAndUpdate(
      token_id,
      { $set: updateObj },
      { new: true, projection: { password: 0, verificationCode: 0 } }
    );

    if (!updated) return res.status(404).json({ error: "User not found" });

    return res.status(200).json(updated);
  } catch (error) {
    console.log(error);
    return res.status(400).send(error);
  }
});


//Delete user
router.delete('/:id', auth, async (req, res) => {
  let userId = req.params.id;
  try {
    let user = await UserModel.findByIdAndDelete(userId);
    if (user) {
      res.status(200).json({ message: `User deleted successfully` });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error });
  }
});


module.exports = router;