import express from "express";
import { register,login } from "../controllers/auth.controller.js";
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

router.post("/register", register);
router.post("/login", login);

export default router;