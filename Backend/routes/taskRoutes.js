import { Router } from "express";
import {
  deleteTask,
  getTasks,
  saveTask,
  updateTask,
} from "../controllers/taskController.js";
const taskRoutes = Router();

taskRoutes.post("/savetask", saveTask);
taskRoutes.get("/gettasks", getTasks);
taskRoutes.put("/updatetask/:taskId", updateTask);
taskRoutes.delete("/deletetask:taskId", deleteTask);
export default taskRoutes;
