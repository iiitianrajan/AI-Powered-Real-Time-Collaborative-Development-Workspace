import mongoose from "mongoose";
import messageModel from "../models/message.model.js";
import projectModel from "../models/project.model.js";
import { clearAiMemory } from "./ai-memory.service.js";

const ensureProjectMember = async ({ projectId, userId }) => {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new Error("Invalid projectId");
  }

  const project = await projectModel.findOne({ _id: projectId, users: userId });

  if (!project) {
    throw new Error("You do not have access to this project");
  }

  return project;
};

export const createMessage = async ({ projectId, sender, message, type = "user", isAiPrompt = false }) => {
  if (!message || typeof message !== "string") {
    throw new Error("A message is required");
  }

  return messageModel.create({ projectId, sender, message: message.trim(), type, isAiPrompt });
};

export const getProjectMessages = async ({ projectId, userId, before, limit = 50 }) => {
  await ensureProjectMember({ projectId, userId });

  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const query = { projectId };

  if (before && !Number.isNaN(new Date(before).getTime())) {
    query.createdAt = { $lt: new Date(before) };
  }

  const messages = await messageModel
    .find(query)
    .sort({ createdAt: -1 })
    .limit(safeLimit)
    .lean();

  return messages.reverse();
};

export const clearProjectMessages = async ({ projectId, userId }) => {
  await ensureProjectMember({ projectId, userId });
  const result = await messageModel.deleteMany({ projectId });
  await clearAiMemory({ projectId });
  return result;
};
