/**
 * models 模型
 */

import { ChatDeepSeek } from "@langchain/deepseek";
import ENV from "./env";

const chatModel = new ChatDeepSeek({
  model: ENV.DEEPSEEK_MODEL,
  apiKey: ENV.DEEPSEEK_API_KEY,
  timeout: 30_000,
  configuration: {
    baseURL: ENV.DEEPSEEK_BASE_URL,
  },
});

export default { chatModel };
