import express from "express";
import jwt from "jsonwebtoken";

import User from "../models/User.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// signing up as a user
router.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Username or email already exists." });
    }

    const newUser = new User({ username, email, password });
    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, username: newUser.username },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.status(201).json({ success: true, message: "User created", token });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error creating user", error });
  }
});

// login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.status(200).json({ success: true, message: "Logged in", token });
  } catch (error) {
    res.status(500).json({ success: false, message: "Login error", error });
  }
});

export default router;
