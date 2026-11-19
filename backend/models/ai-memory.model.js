import mongoose from "mongoose";

const aiMemorySchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "project",
      required: true,
      unique: true,
    },
    recentTurns: [
      {
        prompt: { type: String, required: true, maxlength: 1200 },
        response: { type: String, required: true, maxlength: 2400 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

const AiMemory = mongoose.model("ai-memory", aiMemorySchema);

export default AiMemory;
