require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// ================== CONFIG ==================
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

// ================== MONGODB CONNECTION ==================
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB Connected"))
.catch((err) => console.log("❌ DB Error:", err));

// ================== SCHEMAS ==================

// 🔹 User Schema
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

const User = mongoose.model("User", userSchema);

// 🔹 Expense Schema
const expenseSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    title: String,
    amount: Number,
    category: String,
    date: {
        type: Date,
        default: Date.now
    }
});

const Expense = mongoose.model("Expense", expenseSchema);

// ================== AUTH MIDDLEWARE ==================
const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization;

        if (!token) {
            return res.status(401).json({ message: "No token provided" });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        req.user = decoded; // attach user info

        next();
    } catch (error) {
        res.status(401).json({ message: "Invalid Token" });
    }
};

// ================== ROUTES ==================

// 🔹 REGISTER API
app.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // check existing user
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            email,
            password: hashedPassword
        });

        await newUser.save();

        res.json({ message: "User Registered Successfully" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔹 LOGIN API
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // generate token
        const token = jwt.sign(
            { id: user._id, email: user.email },
            JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({
            message: "Login Successful",
            token
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔹 ADD EXPENSE (Protected)
app.post("/expense", authMiddleware, async (req, res) => {
    try {
        const { title, amount, category, date } = req.body;

        const expense = new Expense({
            userId: req.user.id,
            title,
            amount,
            category,
            date
        });

        await expense.save();

        res.json({
            message: "Expense Added",
            data: expense
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔹 GET ALL EXPENSES (Protected)
app.get("/expenses", authMiddleware, async (req, res) => {
    try {
        const expenses = await Expense.find({ userId: req.user.id });

        res.json(expenses);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================== SERVER ==================
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});