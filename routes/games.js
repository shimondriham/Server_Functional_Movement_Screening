const express = require("express");
const { gameModel } = require("../models/gameModel");
const { auth } = require("../middlewares/auth");
const router = express.Router();

/* GET home page. */
router.get("/", (req, res, next) => {
  res.json({ msg: "Work from games.js" });
});

router.get("/allgames",auth, async (req, res, next) => {
  try {
    let games = await gameModel.find();
    console.log(games);
    res.json(games);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Error", error: err });
  }
});


router.post("/", auth, async (req, res) => {
  const token_id = req.tokenData._id;
  try {
    let game = new gameModel();
    game.idUser = token_id;
    game.level = req.body.level;
    game[req.body.name] = req.body.game;
    let newgame = await game.save();
    console.log(newgame);
    res.json(newgame);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Error", error: err });
  }
});



router.patch("/updateGame", async (req, res) => {
  const thisgame = req.body;
  try {
    let data = await gameModel.updateOne(
      { _id: thisgame._id },
      { [thisgame.name]: thisgame.game }
    );
    console.log(data)
    res.json(data);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Error", error: err });
  }
});

module.exports = router;