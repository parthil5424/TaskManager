import mongoose from "mongoose";
import task from "../models/task.js";
import permission from "../models/permission.js";

const getTaskPermissions = async (userId) => {
  const userPermission = await permission.findOne({ userId }).lean();

  if (!userPermission) {
    return null;
  }

  const taskModule = userPermission.permissions.find(
    (module) => module.moduleName === "TASK",
  );

  return taskModule?.permissions ?? null;
};

// CREATE TASK
const saveTask = async (req, res) => {
  try {
    const { taskName, description } = req.body;

    if (typeof taskName !== "string" || !taskName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Task name is required",
      });
    }

    const taskPermissions = await getTaskPermissions(req.user.id);

    if (!taskPermissions?.canCreate) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to create tasks",
      });
    }

    if (description !== undefined && typeof description !== "string") {
      return res.status(400).json({
        success: false,
        message: "Description must be a string",
      });
    }

    const newTask = await task.create({
      taskName: taskName.trim(),
      description: description?.trim() ?? "",
      userId: req.user.id,
      username: req.user.name,
    });

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: newTask,
    });
  } catch (error) {
    console.error("Save task error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// UPDATE TASK
const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description } = req.body;

    console.log("taskId", taskId);
    // Validate MongoDB ObjectId.
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    // Only allow fields that the client is permitted to update.
    const updates = {};

    if (Object.prototype.hasOwnProperty.call(req.body, "title")) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Task name must be a non-empty string",
        });
      }

      updates.title = title.trim();
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "description")) {
      if (typeof description !== "string") {
        return res.status(400).json({
          success: false,
          message: "Description must be a string",
        });
      }

      updates.description = description.trim();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update",
      });
    }

    // Fetch the authenticated user's TASK permissions.
    const taskPermissions = await getTaskPermissions(req.user.id);

    if (!taskPermissions?.canEdit) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to edit tasks",
      });
    }

    // Find the task.
    const existingTask = await task.findById(taskId);

    if (!existingTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Users can edit their own tasks unless canEditAll is enabled.
    const isOwner = existingTask.userId.toString() === req.user.id;

    if (!isOwner && !taskPermissions.canEditAll) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to edit this task",
      });
    }

    const updatedTask = await task.findByIdAndUpdate(
      taskId,
      { $set: updates },
      { new: true, runValidators: true },
    );

    return res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: updatedTask,
    });
  } catch (error) {
    console.error("Update task error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// DELETE TASK
const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    // Validate MongoDB ObjectId.
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    // Fetch the authenticated user's TASK permissions.
    const taskPermissions = await getTaskPermissions(req.user.id);

    if (!taskPermissions?.canDelete) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete tasks",
      });
    }

    // Find the task.
    const existingTask = await task.findById(taskId);

    if (!existingTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Users can delete their own tasks unless canDeleteAll is enabled.
    const isOwner = existingTask.userId.toString() === req.user.id;

    if (!isOwner && !taskPermissions.canDeleteAll) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete this task",
      });
    }

    await task.findByIdAndDelete(taskId);

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully",
      data: {
        taskId,
      },
    });
  } catch (error) {
    console.error("Delete task error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getTasks = async (req, res) => {
  try {
    // 1. Fetch permissions for the authenticated user.
    const taskPermissions = await getTaskPermissions(req.user.id);

    if (!taskPermissions?.canView) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view tasks",
      });
    }

    // 2. Fetch only this user's tasks.
    const tasks = await task
      .find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    // 3. Return the records.
    return res.status(200).json({
      success: true,
      message: "Tasks fetched successfully",
      data: tasks,
    });
  } catch (error) {
    console.error("Get tasks error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export { saveTask, updateTask, deleteTask, getTasks };
