
const fs = require("fs/promises");

async function uploadProductImage(req, res) {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Please select a product image.",
    });
  }

  return res.status(201).json({
    success: true,
    message: "Image uploaded successfully.",
    image: `/uploads/products/${req.file.filename}`,
  });
}

async function removeUploadedFile(file) {
  if (file?.path) {
    await fs.unlink(file.path).catch(() => {});
  }
}

module.exports = {
  uploadProductImage,
  removeUploadedFile,
};
