/* GET home page. */
import express from "express";

const router = express.Router();

router.get("/", function (_, res) {
    res.render("index");
});

export default router;
