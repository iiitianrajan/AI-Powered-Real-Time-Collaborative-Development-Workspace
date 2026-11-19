import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "project",
      required: true,
      index: true,
    },
    sender: {
      _id: { type: String, required: true },
      email: { type: String, required: true },
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100000,
    },
    type: {
      type: String,
      enum: ["user", "ai"],
      default: "user",
    },
    isAiPrompt: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

messageSchema.index({ projectId: 1, createdAt: -1 });

const Message = mongoose.model("message", messageSchema);

export default Message;
