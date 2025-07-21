const express = require("express");
const isAuth = require("../middlewares/is_auth");
const orderController = require("../controllers/order");

const router = express.Router();

router.post("/create-order", isAuth, orderController.createOrder);
router.get("/my-orders", isAuth, orderController.fetchUserOrders);
router.get("/order-history", isAuth, orderController.fetchOrderHistory);
router.get("/:orderId", isAuth, orderController.fetchOrderById);
router.put("/make-payment/:orderId", isAuth, orderController.makePayment);
router.put(
  "/update-order-status/:orderId",
  isAuth,
  orderController.updateOrderStatus
);

module.exports = router;
