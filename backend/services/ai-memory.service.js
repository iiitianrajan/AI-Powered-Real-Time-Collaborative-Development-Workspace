import aiMemoryModel from "../models/ai-memory.model.js";

const MAX_RECENT_TURNS = 6;

const truncate = (value, maxLength) => value.slice(0, maxLength);

const getResponseText = (response) => {
  try {
    const parsedResponse = JSON.parse(response);
    return typeof parsedResponse.text === "string" ? parsedResponse.text : "AI generated a project response.";
  } catch {
    return response;
  }
};

export const getAiMemoryContext = async ({ projectId }) => {
  const memory = await aiMemoryModel.findOne({ projectId }).lean();

  if (!memory?.recentTurns?.length) {
    return "";
  }

  return memory.recentTurns
    .map((turn) => `User AI request: ${turn.prompt}\nAI response: ${turn.response}`)
    .join("\n\n");
};

export const saveAiMemoryTurn = async ({ projectId, prompt, response }) => {
  const turn = {
    prompt: truncate(prompt.trim(), 1200),
    response: truncate(getResponseText(response).trim(), 2400),
    createdAt: new Date(),
  };

  await aiMemoryModel.findOneAndUpdate(
    { projectId },
    {
      $push: {
        recentTurns: {
          $each: [turn],
          $slice: -MAX_RECENT_TURNS,
        },
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
};

export const clearAiMemory = async ({ projectId }) => {
  await aiMemoryModel.deleteOne({ projectId });
};
