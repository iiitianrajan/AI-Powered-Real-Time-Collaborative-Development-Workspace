import mongoose from "mongoose";

const fileRevisionSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "project",
      required: true,
      index: true,
    },
    filePath: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 200000,
    },
    revision: {
      type: Number,
      required: true,
    },
    changedBy: {
      _id: { type: String, required: true },
      email: { type: String, required: true },
    },
  },
  { timestamps: true },
);

fileRevisionSchema.index({ projectId: 1, filePath: 1, revision: -1 }, { unique: true });

const FileRevision = mongoose.model("file-revision", fileRevisionSchema);

export default FileRevision;
