import bcrypt from "bcryptjs";
import user from "../models/user.js";
import permissionBluePrint from "../models/permissionBluePrint.js";
import permission from "../models/permission.js";
import jwt from "jsonwebtoken";

const signup = async (req, res) => {
  try {
    const { name, email, password, role = "USER" } = req.body;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (name == "" || name == null || name == undefined) {
      return res.status(400).json({
        success: false,
        message: "Please Enter Name",
      });
    }
    if (
      email == "" ||
      email == null ||
      email == undefined ||
      !emailRegex.test(email.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Please Enter Valid email",
      });
    }
    if (
      password == "" ||
      password == null ||
      password == undefined ||
      password.length < 8
    ) {
      return res.status(400).json({
        success: false,
        message: "Password Must be greater than 8 characters",
      });
    }
    const existingUser = await user.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: `User Exists With this Email: ${email}`,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const saved = await user.create({
      name: name.trim(),
      email: email.trim(),
      password: hashedPassword,
      role: role,
    });

    const permissionBlurPrintData = await permissionBluePrint
      .findOne({
        role: "USER",
      })
      .lean();

    if (permissionBlurPrintData) {
      let permissionobj = {
        userId: saved._id,
        permissions: [],
      };
      const assignedPermissions = permissionBlurPrintData.permissions.map(
        (module) => ({
          moduleName: module.moduleName,
          permissions: {
            canCreate: module.permissions.canCreate,
            canEdit: module.permissions.canEdit,
            canDelete: module.permissions.canDelete,
            canView: module.permissions.canView,
            canEditAll: module.permissions.canEditAll,
            canDeleteAll: module.permissions.canDeleteAll,
            canViewAll: module.permissions.canViewAll,
          },
        }),
      );
      permissionobj.permissions = assignedPermissions;
      const permissionSaved = permission.create(permissionobj);
      if (permissionSaved) {
        return res.status(201).json({
          success: true,
          message: "User Created Successfully",
          data: {
            name: name,
            email: email,
            role: role,
          },
        });
      }
    } else {
      await user.deleteOne({ _id: saved._id });
      return res.status(500).json({
        success: true,
        message: "User not created",
      });
    }
  } catch (err) {
    console.log("Error Occurred", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate request
    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // 2. Find user and explicitly include password
    const existingUser = await user
      .findOne({ email: email.trim().toLowerCase() })
      .select("+password")
      .select("+role");

    // Use the same response for an unknown email or wrong password
    if (!existingUser) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    console.log("Before Error");
    // 3. Verify password against stored bcrypt hash
    const isPasswordValid = await bcrypt.compare(
      password,
      existingUser.password,
    );

    console.log("After Error");

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    // 4. Fetch current user-specific permissions
    const userPermissions = await permission
      .findOne({ userId: existingUser._id })
      .lean();

    if (!userPermissions) {
      return res.status(500).json({
        success: false,
        message: "User permissions are not configured",
      });
    }

    // 5. Ensure the JWT secret is configured
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing from environment variables");

      return res.status(500).json({
        success: false,
        message: "Authentication is not configured",
      });
    }

    // 6. Generate token containing the user's identity
    const token = jwt.sign(
      { userId: existingUser._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" },
    );

    // 7. Return token, user details and permissions
    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: existingUser._id,
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role,
        },
        permissions: userPermissions.permissions,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export { signup, login };
