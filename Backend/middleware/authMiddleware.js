import jwt from "jsonwebtoken";
import user from "../models/user.js";

const publicRoutes = [
  { method: "POST", path: "/api/auth/signup" },
  { method: "POST", path: "/api/auth/login" },
  { method: "GET", path: "/api/sql" },
  { method: "POST", path: "/api/sql" },
  { method: "GET", path: "/test" },
];

const isRouteMatch = (routePath, requestPath) => {
  const routeParts = routePath.split("/").filter(Boolean);
  const requestParts = requestPath.split("/").filter(Boolean);

  if (routeParts.length !== requestParts.length) {
    return false;
  }

  return routeParts.every((part, index) => {
    if (part.startsWith(":")) {
      return requestParts[index].length > 0;
    }

    return part === requestParts[index];
  });
};

const authMiddleware = async (req, res, next) => {
  try {
    // Allow explicitly public routes without authentication.
    const isPublicRoute = publicRoutes.some(
      (route) =>
        route.method === req.method && isRouteMatch(route.path, req.path),
    );

    if (isPublicRoute) {
      return next();
    }

    // All remaining routes require a Bearer token.
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required",
      });
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required",
      });
    }

    // Verify JWT signature and expiration.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch the current user from the database.
    const authenticatedUser = await user.findById(decoded.userId);

    if (!authenticatedUser) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Make authenticated user details available to downstream handlers.
    req.user = {
      id: authenticatedUser._id.toString(),
      name: authenticatedUser.name,
      email: authenticatedUser.email,
      role: authenticatedUser.role,
    };

    return next();
  } catch (error) {
    if (
      error.name === "TokenExpiredError" ||
      error.name === "JsonWebTokenError" ||
      error.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired authentication token",
      });
    }

    console.error("Authentication middleware error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export default authMiddleware;
