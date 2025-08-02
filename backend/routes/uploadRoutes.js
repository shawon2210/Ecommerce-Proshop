const path = require('path');
const express = require('express');
const multer = require('multer');
const router = express.Router();

// Configure storage for uploaded files
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/images/');
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

// Check file type
function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png|svg/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype) || file.mimetype === 'image/svg+xml';

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb('Images only! Supported formats: JPG, JPEG, PNG, SVG');
  }
}

// Initialize upload
const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

// Upload route
router.post('/', upload.single('image'), (req, res) => {
  res.send(`/${req.file.path}`);
});

module.exports = router;