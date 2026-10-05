import express from "express";
import { register, login, getCurrentUser, updateCurrentUser, changePassword, forgotPassword, resetPassword } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/test", (req, res) => {
  res.json({
    message: "Auth route is working!",
  });
});
router.get("/protected", authenticate, (req, res) => {
  res.json({
    message: "You have access to this protected route!",
    user: req.user,
  });
});
router.get("/me", authenticate, getCurrentUser);
router.put("/me", authenticate, updateCurrentUser);
router.patch("/change-password", authenticate, changePassword);

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;