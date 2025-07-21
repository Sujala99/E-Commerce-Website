const multer = require("multer");

const myStorage = multer.diskStorage({
  destination: (req, res, cb) => {
    let path = process.cwd() + "/images";
    cb(null, path);
  },
  filename: (req, file, cb) => {
    let f_name = Date.now() + "-" + file.originalname;
    cb(null, f_name);
  },
});

const fileFilter = (req, file, cb) => {
  try {
    if (
      file.mimetype === "image/png" ||
      file.mimetype === "image/jpg" ||
      file.mimetype === "image/jpeg" ||
      file.mimetype === "image/webp"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  } catch (error) {
    cb(error, false);
  }
};

const uploader = multer({
  storage: myStorage,
  fileFilter: fileFilter,
});

module.exports = uploader;
