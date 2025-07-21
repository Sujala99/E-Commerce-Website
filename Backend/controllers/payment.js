const Payment = require("../models/payment");

exports.createPayment = async (req, res, next) => {
  const userId = req.userId;
  try {
    const {
      orderId,
      totalAmount,
      transactionCode,
      transactionUUID,
      productCode,
      status,
      signature,
      signedFieldNames,
    } = req.body;

    const newPayment = new Payment({
      userId: userId,
      totalAmount,
      transactionCode,
      transactionUUID,
      productCode,
      status,
      signature,
      signedFieldNames,
    });

    const payment = await newPayment.save();

    res.status(201).json({
      message: "Payment created successfully.",
      payment: payment,
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.fetchUserPayments = async (req, res, next) => {
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

    let totalItems = await Payment.find({
      userId: userId,
      ...filterOptions,
    }).countDocuments();

    const payments = await Payment.find({
      userId: userId,
      ...filterOptions,
    })
      .sort(sortOptions)
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    if (!payments || payments.length === 0) {
      const error = new Error("No payments found.");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      message: "Payments fetched successfully.",
      payments: payments,
      totalItems: totalItems,
    });
  } catch (e) {
    if (!e.statusCode) {
      e.statusCode = 500;
    }
    next(e);
  }
};
