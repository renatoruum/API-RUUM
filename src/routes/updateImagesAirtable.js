import { upsetImagesInAirtable } from "../connectors/airtable.js";
import express from "express";

const router = express.Router();

router.post("/update-images-airtable", async (req, res) => {
  try {
    const imagesArray = req.body;
    if (!Array.isArray(imagesArray) || imagesArray.length === 0) {
      return res.status(400).json({ success: false, message: "Body must be a non-empty array of images" });
    }

    await upsetImagesInAirtable(imagesArray);
    res.json({ success: true, message: "Images updated/created in Airtable" });
  } catch (error) {
    console.error("Error updating images in Airtable:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

export default router;