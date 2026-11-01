import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import authMiddleware from "./middleware/authMiddleware.js";
import taskRoutes from "./routes/taskRoutes.js";
import sqldb from "./config/sqldb.js";

const app = express();

app.use(express.json()); // to use Json Body Need to Enable this from Request
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(authMiddleware);
app.use("/api/auth", authRoutes);
app.use("/api/task", taskRoutes);
app.get("/test", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Kid Just Stay There ",
  });
});
app.get("/api/sql", async (req, res) => {
  try {
    await sqldb.query(`
      CREATE TABLE IF NOT EXISTS docker_test (
        id INT AUTO_INCREMENT PRIMARY KEY,
        message VARCHAR(100) NOT NULL
      )
    `);

    await sqldb.execute("INSERT INTO docker_test (message) VALUES (?)", [
      "Hello from TaskManager",
    ]);

    const [rows] = await sqldb.query("SELECT * FROM docker_test");

    res.json({
      success: true,
      message: "Connected to MySQL Docker container!",
      data: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "MySQL test failed",
    });
  }
});

export default app;
