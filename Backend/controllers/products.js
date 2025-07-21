const path = require("path");
const fs = require("fs");
const User = require("../models/user");
const beautyProductValidationSchema = require("../validators/product_validator");
const BeautyProduct = require("../models/product");

exports.getProductsByCategory = async (req, res, next) => {
  const category = req.params.category;
  const currentPage = req.query.page || 1;
  const perPage = 12;
  try {
    let sortOptions = {};

    // Get sorting criteria from query parameters
    const sortOrder = req.query.filterBy || "dsc";

    if (
      sortOrder !== "asc" &&
      sortOrder !== "dsc" &&
      sortOrder !== "price-asc" &&
      sortOrder !== "price-dsc"
    ) {
      const error = new Error("Invalid sortOrder value.");
      error.statusCode = 400;
      throw error;
    }

    // Determine sorting options based on sortOrder
    switch (sortOrder) {
      case "asc":
        sortOptions.createdAt = 1;
        break;
      case "dsc":
        sortOptions.createdAt = -1;
        break;
      case "price-asc":
        sortOptions.price = 1;
        break;
      case "price-dsc":
        sortOptions.price = -1;
        break;
      default:
        break;
    }

    const minPrice = req.query.minPrice ? parseInt(req.query.minPrice) : 0;
    const maxPrice = req.query.maxPrice ? parseInt(req.query.maxPrice) : 25000;

    const priceRangeCondition = {};
    priceRangeCondition.$gte = minPrice;
    priceRangeCondition.$lte = maxPrice;

    let filterCondition = { category: category };

    const instockFilter = req.query.instockFilter || "all";
    switch (instockFilter) {
      case "instock":
        filterCondition.quantityAvailable = { $gt: 0 };
        break;
      case "outofstock":
        filterCondition.quantityAvailable = 0;
        break;
      default:
        break;
    }

    let totalItems = await BeautyProduct.find({
      ...filterCondition,
      ...(Object.keys(priceRangeCondition).length > 0 && {
        price: priceRangeCondition,
      }),
    })
      .sort(sortOptions)
      .countDocuments();

    const products = await BeautyProduct.find({
      ...filterCondition,
      ...(Object.keys(priceRangeCondition).length > 0 && {
        price: priceRangeCondition,
      }),
    })
      .sort(sortOptions)
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    if (!products || totalItems === 0) {
      const error = new Error("No products found.");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      message: "Products fetched successfully.",
      products: products,
      totalItems: totalItems,
    });
  } catch (e) {
    if (!e.statusCode) {
      e.statusCode = 500;
    }
    next(e);
  }
};

exports.getAdminProducts = async (req, res, next) => {
  try {
    let sortOrder = req.query.filterBy || "dsc";
    let productName = req.params.productName;
    console.log(productName);

    if (sortOrder !== "asc" && sortOrder !== "dsc") {
      const error = new Error("Invalid sortOrder value.");
      error.statusCode = 400;
      throw error;
    }

    const sortOptions = {};
    if (sortOrder === "asc") {
      sortOptions.createdAt = 1;
    } else {
      sortOptions.createdAt = -1;
    }

    let totalCount = await BeautyProduct.find({
      name: { $regex: productName, $options: "i" },
    }).countDocuments();

    let products = await BeautyProduct.find({
      name: { $regex: productName, $options: "i" },
    }).sort(sortOptions);

    if (!products || products.length === 0) {
      const error = new Error("No products found.");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      message: "Products fetched successfully.",
      products: products,
      totalCount: totalCount,
    });
  } catch (e) {
    if (!e.statusCode) {
      e.statusCode = 500;
    }
    next(e);
  }
};

exports.getProducts = async (req, res, next) => {
  try {
    let sortOrder = req.query.filterBy || "dsc";

    if (sortOrder !== "asc" && sortOrder !== "dsc") {
      const error = new Error("Invalid sortOrder value.");
      error.statusCode = 400;
      throw error;
    }

    let limit = req.query.limit || null;

    const sortOptions = {};
    if (sortOrder === "asc") {
      sortOptions.createdAt = 1;
    } else {
      sortOptions.createdAt = -1;
    }
    let products;
    if (limit === null) {
      products = await BeautyProduct.find().sort(sortOptions);
    } else {
      products = await BeautyProduct.find().sort(sortOptions).limit(limit);
    }

    if (!products || products.length === 0) {
      const error = new Error("No products found.");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      message: "Products fetched successfully.",
      products: products,
    });
  } catch (e) {
    if (!e.statusCode) {
      e.statusCode = 500;
    }
    next(e);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    if (req.status !== "admin") {
      const error = new Error("Forbidden request.");
      error.statusCode = 403;
      throw error;
    }
    if (!req.files) {
      const error = new Error("No images found.");
      error.statusCode = 422;
      throw error;
    }
    let images = [];
    req.files.map((image) => {
      images.push(path.basename(image.filename));
    });

    const { error } = beautyProductValidationSchema.validate({
      ...req.body,
      images: images,
    });

    if (error) {
      const theError = new Error("Validation failed.");
      theError.statusCode = 422;
      theError.data = error.details;
      throw theError;
    }

    const newProduct = new BeautyProduct({
      name: req.body.name,
      brand: req.body.brand,
      category: req.body.category,
      description: req.body.description,
      price: req.body.price,
      quantityAvailable: req.body.quantityAvailable,
      rating: req.body.rating || 0,
      images: images || [],
    });

    const createdProduct = await newProduct.save();

    res.status(201).json({
      message: "Product created successfully.",
      product: createdProduct,
    });
  } catch (e) {
    if (!e.statusCode) {
      e.statusCode = 500;
    }
    next(e);
  }
};

exports.getProduct = async (req, res, next) => {
  try {
    const productId = req.params.productId;

    const product = await BeautyProduct.findById(productId);

    if (!product) {
      const error = new Error("No product found.");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      message: "Product fetched successfully.",
      product: product,
    });
  } catch (e) {
    if (!e.statusCode) {
      e.statusCode = 500;
    }
    next(e);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    if (req.status !== "admin") {
      const error = new Error("Forbidden request.");
      error.statusCode = 403;
      throw error;
    }

    const productId = req.params.productId;
    const product = await BeautyProduct.findById(productId);
    if (!product) {
      const error = new Error("No product found.");
      error.statusCode = 404;
      throw error;
    }
    let images = [];
    images = product.images;

    if (req.files) {
      let newImages = [];
      req.files.map((image) => {
        newImages.push(path.basename(image.filename));
      });
      images = newImages;
    }

    const { error } = beautyProductValidationSchema.validate({
      ...req.body,
      rating: product.rating,
      quantityAvailable: product.quantityAvailable,
      images: images,
    });

    if (error) {
      const theError = new Error("Validation failed.");
      theError.statusCode = 422;
      theError.data = error.details;
      throw theError;
    }

    product.name = req.body.name;
    product.brand = req.body.brand;
    product.category = req.body.category;
    product.price = req.body.price;
    product.images = images;
    product.quantityAvailable = req.body.quantityAvailable;

    const updatedProduct = await product.save();

    res.status(200).json({
      message: "Product updated successfully.",
      product: updatedProduct,
    });
  } catch (e) {
    if (!e.statusCode) {
      e.statusCode = 500;
    }
    next(e);
  }
};

exports.searchProduct = async (req, res, next) => {
  console.log();
  try {
    const productName = req.query.name;
    const currentPage = req.query.page || 1;
    const perPage = 12;

    let sortOptions = {};

    const sortOrder = req.query.filterBy || "dsc";

    if (
      sortOrder !== "asc" &&
      sortOrder !== "dsc" &&
      sortOrder !== "price-asc" &&
      sortOrder !== "price-dsc"
    ) {
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
      case "price-asc":
        sortOptions.price = 1;
        break;
      case "price-dsc":
        sortOptions.price = -1;
        break;
      default:
        break;
    }

    const minPrice = req.query.minPrice ? parseInt(req.query.minPrice) : 0;
    const maxPrice = req.query.maxPrice ? parseInt(req.query.maxPrice) : 25000;

    const priceRangeCondition = {};
    priceRangeCondition.$gte = minPrice;
    priceRangeCondition.$lte = maxPrice;

    let filterCondition = {};

    const instockFilter = req.query.instockFilter || "all";
    switch (instockFilter) {
      case "instock":
        filterCondition.quantityAvailable = { $gt: 0 };
        break;
      case "outofstock":
        filterCondition.quantityAvailable = 0;
        break;
      default:
        break;
    }

    const totalCount = await BeautyProduct.find({
      name: { $regex: productName, $options: "i" },
      ...filterCondition,
      ...(Object.keys(priceRangeCondition).length > 0 && {
        price: priceRangeCondition,
      }),
    }).countDocuments();

    const products = await BeautyProduct.find({
      name: { $regex: productName, $options: "i" },
      ...filterCondition,
      ...(Object.keys(priceRangeCondition).length > 0 && {
        price: priceRangeCondition,
      }),
    })
      .sort(sortOptions)
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    if (!products || products.length === 0) {
      const error = new Error("No products found.");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      message: "Search products fetched successfully.",
      products: products,
      totalCount: totalCount,
    });
  } catch (e) {
    if (!e.statusCode) {
      e.statusCode = 500;
    }
    next(e);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const productId = req.params.productId;

    const product = await BeautyProduct.findById(productId);

    if (!product) {
      const error = new Error("Product not found.");
      error.statusCode = 404;
      throw error;
    }

    await product.deleteOne();

    res.status(200).json({ message: "Product deleted successfully." });
  } catch (e) {
    if (!e.statusCode) {
      e.statusCode = 500;
    }
    next(e);
  }
};
