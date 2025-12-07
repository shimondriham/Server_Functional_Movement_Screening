const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Joi = require("joi");

const gameSchema = new mongoose.Schema({
    dateCreated:{type: Date, default: Date.now()}, 
     level: String,
     game1: Array,
     game2: Array,
     idUser: String,
});

exports.gameModel = mongoose.model("games", gameSchema);



// exports.validGames = (_bodyData) => {
//     let joiSchema = Joi.object({
      
//     });
//     return joiSchema.validate(_bodyData);
// };

