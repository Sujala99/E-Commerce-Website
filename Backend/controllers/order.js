const Order = require("../models/order");
const Product = require("../models/product");
const User = require("../models/user");

exports.createOrder = async (req, res, next) => {
  const userId = req.userId;
  try {
    if (req.status !== "user") {
      const error = new Error("Access denied.");
      error.statusCode = 403;
      throw error;
    }
    const {
      houseNumber,
      streetName,
      city,
      district,
      zone,
      contactNumber,
      paymentMethod,
      orderItems,
      totalPrice,
      totalItems,
    } = req.body;

    let products = [];
    orderItems.map((item) => {
      products.push({
        productId: item.productItem.id,
        quantity: item.count,
        price: item.price,
      });
    });
    const newOrder = new Order({
      userId,
      houseNumber,
      streetName,
      city,
      district,
      zone,
      contactNumber,
      paymentMethod,
      orderItems: products,
      totalPrice,
      totalItems,
      paid: false,
      status: 0,
    });

    const order = await newOrder.save();

    await Promise.all(
      order.orderItems.map(async (orderItem) => {
        const product = await Product.findById(orderItem.productId);
        const user = await User.findById(userId);

        if (!user) {
          const error = new Error("Failed to fetch user.");
          error.statusCode = 404;
          throw error;
        } else if (!product) {
          const error = new Error("Failed to fetch order product.");
          error.statusCode = 404;
          throw error;
        } else {
          if (product.quantityAvailable < orderItem.quantity) {
            if (product.quantityAvailable === 0) {
              const newError = new Error(
                `[ ${product.name} ]  has been sold out.`
              );
              newError.statusCode = 404;
              throw newError;
            }
            const error = new Error(
              `Only ${product.quantityAvailable} [ ${product.name} ] are left.`
            );
            error.statusCode = 404;
            throw error;
          }
          product.quantityAvailable =
            product.quantityAvailable - orderItem.quantity;
          const theProduct = await product.save();
          user.orderedItems.push({ productId: theProduct._id });
          await user.save();
        }
      })
    );

    res.status(201).json({
      message: "Order created successfully.",
      order: order,
    });
  } catch (e) {
    if (!e.statusCode) {
      e.statusCode = 500;
    }
    next(e);
  }
};

exports.fetchUserOrders = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 6;
  const { filterBy, date } = req.query;

  try {
    let sortOptions = {};
    let filterOptions = {};

    const sortOrder = filterBy || "asc";

    if (sortOrder !== "asc" && sortOrder !== "dsc") {
      const error = new Error("Invalid sortOrder value.");
      error.statusCode = 400;
      throw error;
    }

    switch (sortOrder) {
      case "asc":
        sortOptions.createdAt = 1;
        break;
      case "dsc":
        sortOptions.createdAt = -1;
        break;
      default:
        break;
    }

    if (date) {
      const theDate = new Date(date);

      const year = theDate.getFullYear();
      const month = (theDate.getMonth() + 1).toString().padStart(2, "0");
      const day = theDate.getDate().toString().padStart(2, "0");

      const formattedDate = `${year}-${month}-${day}`;
      console.log(formattedDate);

      filterOptions.createdAt = {
        $gte: new Date(`${formattedDate}T00:00:00.000Z`),
        $lt: new Date(`${formattedDate}T23:59:59.999Z`),
      };
    }

    const userId = req.userId;

    let totalItems = await Order.find({
      userId: userId,
      ...filterOptions,
    }).countDocuments();

    const orders = await Order.find({
      userId: userId,
      ...filterOptions,
    })
      .sort(sortOptions)
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    if (!orders || orders.length === 0) {
      const error = new Error("No orders found.");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      message: "Orders fetched successfully.",
      orders: orders,
      totalItems: totalItems,
    });
  } catch (e) {
    if (!e.statusCode) {
      e.statusCode = 500;
    }
    next(e);
  }
};

exports.fetchOrderHistory = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 6;
  const { filterBy, date } = req.query;

  try {
    let sortOptions = {};
    let filterOptions = {};

    const sortOrder = filterBy || "asc";

    if (sortOrder !== "asc" && sortOrder !== "dsc") {
      const error = new Error("Invalid sortOrder value.");
      error.statusCode = 400;
      throw error;
    }

    switch (sortOrder) {
      case "asc":
        sortOptions.createdAt = 1;
        break;
      case "dsc":
        sortOptions.createdAt = -1;
        break;
      default:
        break;
    }

    if (date) {
      const theDate = new Date(date);

      const year = theDate.getFullYear();
      const month = (theDate.getMonth() + 1).toString().padStart(2, "0");
      const day = theDate.getDate().toString().padStart(2, "0");

      const formattedDate = `${year}-${month}-${day}`;
      console.log(formattedDate);

      filterOptions.createdAt = {
        $gte: new Date(`${formattedDate}T00:00:00.000Z`),
        $lt: new Date(`${formattedDate}T23:59:59.999Z`),
      };
    }

    let totalItems = await Order.find({
      ...filterOptions,
    }).countDocuments();

    const orders = await Order.find({
      ...filterOptions,
    })
      .sort(sortOptions)
      .skip((currentPage - 1) * perPage)
      .limit(perPage)
      .populate("userId");

    if (!orders || orders.length === 0) {
      const error = new Error("No orders found.");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      message: "Orders fetched successfully.",
      orders: orders,
      totalItems: totalItems,
    });
  } catch (e) {
    if (!e.statusCode) {
      e.statusCode = 500;
    }
    next(e);
  }
};

exports.fetchOrderById = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;

    const order = await Order.findById(orderId).populate(
      "orderItems.productId"
    );

    if (!order) {
      const error = new Error("Order fetch failed.");
      error.statusCode = 404;
      throw error;
    }

    const user = await User.findById(order.userId);

    if (!user) {
      const error = new Error("Failed to fetch User.");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      message: "Order fetched successfully.",
      order: order,
      user: user,
    });
  } catch (e) {
    if (!e.statusCode) {
      e.statusCode = 500;
    }
    next(e);
  }
};

exports.makePayment = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.findById(orderId);
    if (!order) {
      const error = new Error("No order found.");
      error.statusCode = 404;
      throw error;
    }
    order.paid = true;
    order.status = 1;
    order.statusDetails.paymentMade.value = true;
    order.statusDetails.paymentMade.date = new Date();
    const updatedOrder = await order.save();
    res.status(200).json({
      message: "Payment made successfully.",
      order: updatedOrder,
    });

    res.status();
  } catch (e) {
    if (!e.statusCode) {
      e.statusCode = 500;
    }
    next(e);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    if (req.status !== "admin") {
      const error = new Error("Forbidden request.");
      error.statusCode = 403;
      throw error;
    }

    const orderId = req.params.orderId;
    const { status } = req.body;
    console.log(orderId, status);
    const order = await Order.findById(orderId);
    if (!order) {
      const error = new Error("No order found.");
      error.statusCode = 404;
      throw error;
    }

    switch (status) {
      case 2:
        order.statusDetails.processing.value = true;
        order.statusDetails.processing.date = new Date();
        break;
      case 3:
        order.statusDetails.shipped.value = true;
        order.statusDetails.shipped.date = new Date();
        break;
      case 4:
        order.statusDetails.delivered.value = true;
        order.statusDetails.delivered.date = new Date();
        break;
      default:
        break;
    }
    order.status = status;

    const updatedOrder = await order.save();
    res.status(200).json({
      message: "Order status updated successfully.",
      order: updatedOrder,
    });

    res.status();
  } catch (e) {
    if (!e.statusCode) {
      e.statusCode = 500;
    }
    next(e);
  }
};
