const express = require("express");
const isAuth = require("../middlewares/is_auth");
const paymentController = require("../controllers/payment");

const router = express.Router();

router.post("/create-payment", isAuth, paymentController.createPayment);
router.get("/my-payments", isAuth, paymentController.fetchUserPayments);

module.exports = router;
