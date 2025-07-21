const express = require("express");
const app = express();

const productsRoutes = require("./products");
const authRoutes = require("./auth");
const orderRoutes = require("./order");
const paymentRoutes = require("./payment");
const reviewRoutes = require("./reviews");

app.use("/auth", authRoutes);
app.use("/products", productsRoutes);
app.use("/orders", orderRoutes);
app.use("/payments", paymentRoutes);
app.use("/reviews", reviewRoutes);

module.exports = app;
