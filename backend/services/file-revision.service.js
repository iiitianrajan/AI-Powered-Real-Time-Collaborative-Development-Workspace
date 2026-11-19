import mongoose from "mongoose";
import fileRevisionModel from "../models/file-revision.model.js";
import projectModel from "../models/project.model.js";

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

const getPathParts = (filePath) => {
  if (typeof filePath !== "string") {
    throw new Error("A valid file path is required");
  }

  const parts = filePath.split("/").filter(Boolean);

  if (!parts.length || parts.some((part) => part === "." || part === "..")) {
    throw new Error("Invalid file path");
  }

  return parts;
};

const updateFileContentInTree = (tree, parts, content) => {
  const [currentPart, ...remainingParts] = parts;
  const currentNode = tree?.[currentPart];

  if (!currentNode || typeof currentNode !== "object") {
    throw new Error("File not found");
  }

  const updatedTree = { ...tree };

  if (!remainingParts.length) {
    if (!currentNode.file) {
      throw new Error("The selected path is not a file");
    }

    updatedTree[currentPart] = {
      ...currentNode,
      file: { ...currentNode.file, contents: content },
    };
    return updatedTree;
  }

  const isWebContainerDirectory = currentNode.directory && typeof currentNode.directory === "object";
  const childTree = isWebContainerDirectory ? currentNode.directory : currentNode;
  const updatedChildTree = updateFileContentInTree(childTree, remainingParts, content);

  updatedTree[currentPart] = isWebContainerDirectory
    ? { ...currentNode, directory: updatedChildTree }
    : updatedChildTree;

  return updatedTree;
};

const getFileContentFromTree = (tree, parts) => {
  let currentTree = tree;

  for (let index = 0; index < parts.length; index += 1) {
    const node = currentTree?.[parts[index]];

    if (!node) {
      return "";
    }

    if (index === parts.length - 1) {
      return node.file?.contents || "";
    }

    currentTree = node.directory || node;
  }

  return "";
};

const getLatestRevision = ({ projectId, filePath }) =>
  fileRevisionModel.findOne({ projectId, filePath }).sort({ revision: -1 });

export const updateFileContent = async ({ projectId, user, filePath, content, expectedRevision }) => {
  if (typeof content !== "string" || content.length > 200000) {
    throw new Error("File content is invalid or too large");
  }

  const parts = getPathParts(filePath);
  const project = await ensureProjectMember({ projectId, userId: user._id });
  let latestRevision = await getLatestRevision({ projectId, filePath });

  if (!latestRevision) {
    latestRevision = await fileRevisionModel.create({
      projectId,
      filePath,
      content: getFileContentFromTree(project.fileTree, parts),
      revision: 0,
      changedBy: { _id: "system", email: "Initial version" },
    });
  }

  const currentRevision = latestRevision?.revision || 0;

  if (Number(expectedRevision) !== currentRevision) {
    return {
      conflict: true,
      filePath,
      content: latestRevision?.content ?? getFileContentFromTree(project.fileTree, parts),
      revision: currentRevision,
    };
  }

  const updatedFileTree = updateFileContentInTree(project.fileTree, parts, content);
  const nextRevision = currentRevision + 1;

  await projectModel.updateOne({ _id: projectId }, { fileTree: updatedFileTree });

  const revision = await fileRevisionModel.create({
    projectId,
    filePath,
    content,
    revision: nextRevision,
    changedBy: { _id: user._id.toString(), email: user.email },
  });

  return { conflict: false, revision };
};

export const getFileRevisions = async ({ projectId, userId, filePath, limit = 50 }) => {
  getPathParts(filePath);
  await ensureProjectMember({ projectId, userId });
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);

  return fileRevisionModel.find({ projectId, filePath }).sort({ revision: -1 }).limit(safeLimit).lean();
};

export const restoreFileRevision = async ({ projectId, user, fileRevisionId }) => {
  if (!mongoose.Types.ObjectId.isValid(fileRevisionId)) {
    throw new Error("Invalid revision");
  }

  const revisionToRestore = await fileRevisionModel.findOne({ _id: fileRevisionId, projectId });

  if (!revisionToRestore) {
    throw new Error("Revision not found");
  }

  return updateFileContent({
    projectId,
    user,
    filePath: revisionToRestore.filePath,
    content: revisionToRestore.content,
    expectedRevision: (await getLatestRevision({ projectId, filePath: revisionToRestore.filePath }))?.revision || 0,
  });
};
