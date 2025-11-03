import express from 'express';
import {fetchToolLogoName} from "../utils/fetchToolLogoName.js";

const router = express.Router();

router.get('/get-tool-name-logo', async (req, res) => {
  try {
    const data = await fetchToolLogoName(); // call your controller function
    res.json(data); // send it as response
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});
export default router;
