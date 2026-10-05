import bcrypt from "bcrypt";
import { db } from "../db.ts";
import jwt from "jsonwebtoken";

export const getCurrentUser = async (req, res) => {
  try {
    const user = await db.orm.public.User.first({
      id: Number(req.user.userId),
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User fetched successfully",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch current user" });
  }
};

export const updateCurrentUser = async (req, res) => {
  try {
    const { name, username, email, phone } = req.body;
    const userId = Number(req.user.userId);

    const existingUser = await db.orm.public.User.first({ id: userId });
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const updatedUser = await db.orm.public.User.where({ id: userId }).update({
      name: name ?? existingUser.name,
      username: username ?? existingUser.username,
      email: email ?? existingUser.email,
      phone: phone ?? existingUser.phone,
    });

    res.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        name: updatedUser.name,
        role: updatedUser.role,
        phone: updatedUser.phone,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = Number(req.user.userId);

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "Current password, new password and confirmation are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New password and confirmation do not match" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long" });
    }

    const user = await db.orm.public.User.first({ id: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const matches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!matches) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.orm.public.User.where({ id: userId }).update({ passwordHash });

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to change password" });
  }
};

export const register = async (req, res) => {
  try {
    const { email, username, name, phone, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const existingUser = await db.orm.public.User.first({
  email,
});

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await db.orm.public.User.create({
  email,
  username,
  name,
  phone,
  passwordHash,
  role: role || "staff",
});
    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Registration failed",
    });
  }
};

export const login = async (req, res) => {
  try {
    const rawIdentifier =
      req.body.email ||
      req.body.username ||
      req.body.identifier;

    const password = req.body.password;

    if (!rawIdentifier || !password) {
      return res.status(400).json({
        message: "Email or username and password are required",
      });
    }

    const identifier = String(rawIdentifier).trim();

    // First try exact email
    let user = await db.orm.public.User.first({
      email: identifier,
    });

    // Then try exact username
    if (!user) {
      user = await db.orm.public.User.first({
        username: identifier,
      });
    }

    // Case-insensitive fallback
    if (!user) {
      const users = await db.orm.public.User.all();

      const normalizedIdentifier = identifier.toLowerCase();

      user =
        users.find(
          (item) =>
            item.email?.toLowerCase() === normalizedIdentifier ||
            item.username?.toLowerCase() === normalizedIdentifier
        ) || null;
    }

    if (!user) {
      return res.status(401).json({
        message: "Invalid email/username or password",
      });
    }

    // Compare entered password with the CURRENT database hash
    const isPasswordValid = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email/username or password",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing");
      return res.status(500).json({
        message: "Server authentication configuration is missing",
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("========== LOGIN ERROR ==========");
    console.error(error);
    console.error("=================================");

    return res.status(500).json({
      message: "Login failed",
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const trimmedEmail = String(email).trim();

    let user = await db.orm.public.User.first({
      email: trimmedEmail,
    });

    if (!user) {
      const users = await db.orm.public.User.all();
      const normalized = trimmedEmail.toLowerCase();
      user = users.find(
        (u) => u.email?.toLowerCase() === normalized
      ) || null;
    }

    if (!user) {
      return res.status(404).json({
        message: "No user found with this email address",
      });
    }

    return res.status(200).json({
      message: "User verified successfully",
      email: user.email,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({
      message: "Failed to process forgot password request",
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        message: "Email and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long",
      });
    }

    const trimmedEmail = String(email).trim();

    let user = await db.orm.public.User.first({
      email: trimmedEmail,
    });

    if (!user) {
      const users = await db.orm.public.User.all();
      const normalized = trimmedEmail.toLowerCase();
      user = users.find(
        (u) => u.email?.toLowerCase() === normalized
      ) || null;
    }

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await db.orm.public.User.where({ id: user.id }).update({
      passwordHash,
    });

    return res.status(200).json({
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({
      message: "Failed to reset password",
    });
  }
};