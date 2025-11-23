const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Joi = require("joi");

const userSchema = new mongoose.Schema({
    fullName: String,
    email: String,
    password: String,
    height: Number,
    weight: Number,
    dateOfBirth: Date,
    difficulty:String,
    equipment:Array,
    frequency:String,
    goal:String,
    medical:Array,
    timePerDay:String,
    workouts:Array,
    role: {
        type: String, default: "user"
    },
    verificationCode: String,
    verification: {
        type: Boolean, default: false
    },
});

exports.UserModel = mongoose.model("users", userSchema);

exports.validUser = (_bodyData) => {

    let joiSchema = Joi.object({
        fullName: Joi.string().min(2).max(99).required(),
        email: Joi.string().min(5).max(99).email().required(),
        password: Joi.string().min(2).max(99).required(),
    });

    return joiSchema.validate(_bodyData);
};

exports.validDetails = (_bodyData) => {

    let joiSchema = Joi.object({
        height: Joi.number(),
        weight: Joi.number(),
        dateOfBirth: Joi.date(),
        difficulty: Joi.string(),
        equipment: Joi.array(),
        frequency: Joi.string(),
        goal: Joi.string(),
        medical: Joi.array(),
        timePerDay: Joi.string(),
        workouts: Joi.array(),
    });

    return joiSchema.validate(_bodyData);
};

exports.validateLogin = (_bodyReq) => {
    let joiSchema = Joi.object({
        email: Joi.string().min(2).max(150).email().required(),
        password: Joi.string().min(3).max(100).required(),
    })
    return joiSchema.validate(_bodyReq);
}

exports.genToken = (_userId, _role) => {
    let token = jwt.sign({ _id: _userId, role: _role }, process.env.JWT_SECRET, { expiresIn: "1440mins" });
    return token;
}