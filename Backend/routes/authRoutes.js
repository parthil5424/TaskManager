import { Router } from "express";
import { login, signup } from "../controllers/authController.js";
const authRoutes = Router();
authRoutes.post("/signup", signup);
authRoutes.post("/login", login);
authRoutes.get("/me", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Authenticated user fetched successfully",
    data: {
      user: req.user,
    },
  });
});

export default authRoutes;
