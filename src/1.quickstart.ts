import { createAgent, initChatModel, tool } from "langchain";
import { ChatDeepSeek } from "@langchain/deepseek";
import ENV from "./help/env";
import z from "zod";
import { MemorySaver } from "@langchain/langgraph";
import { createDeepAgent } from "deepagents";

// const getWeather = tool((input) => `${input}总是晴天`, {
//   name: "get_weather",
//   description: "查询一个城市的天气",
//   schema: z.object({
//     city: z.string().describe("需要提供城市"),
//   }),
// });

// 方式一：通过模型实例传递 baseURL 和 apiKey（推荐）
const model = new ChatDeepSeek({
  model: ENV.DEEPSEEK_MODEL,
  apiKey: ENV.DEEPSEEK_API_KEY,
  timeout: 30_000,
  configuration: {
    baseURL: ENV.DEEPSEEK_BASE_URL,
  },
});

// 方式二：直接用字符串（环境变量会自动读取，无需传参）
// const agent = createAgent({
//   model: ENV.DEEPSEEK_MODEL,
//   tools: [getWeather],
// });

// const agent = createAgent({
//   model,
//   tools: [getWeather],
// });

// console.log(
//   await agent.invoke({
//     messages: [{ role: "user", content: "上海天气怎么样?" }],
//   }),
// );

// ------

// 定义系统提示词
const SYSTEM_PROMPT = `
你是一名文学数据助手。
## 能力
- \`fetch_text_from_url\`：从网址中读取文档文本并导入对话中。
切勿自行猜测行数与文本位置，需以已保存文件的工具返回结果为准。
`;

const fetchTextFromUrl = tool(
  async ({ url }: { url: string }): Promise<string> => {
    const controller = new AbortController();
    const timeId = setTimeout(() => controller.abort(), 120_000);
    try {
      const resp = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; quickstart-research/1.0)",
        },
        signal: controller.signal,
      });
      if (!resp.ok) {
        return `Fetch failed: HTTP ${resp.status} ${resp.statusText}`;
      }
      return await resp.text();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return `Fetch failed: ${msg}`;
    } finally {
      clearTimeout(timeId);
    }
  },
  {
    name: "fetch_text_from_url",
    description: "从URL上获取文档",
    schema: z.object({ url: z.string().url() }),
  },
);

// const model = await initChatModel(ENV.DEEPSEEK_MODEL, {
//   temperature: 0.5,
//   timeout: 300,
//   maxTokens: 25000,
// });

const checkpointer = new MemorySaver();

async function main() {
  const agent = createAgent({
    model,
    tools: [fetchTextFromUrl],
    systemPrompt: SYSTEM_PROMPT,
    checkpointer,
  });
  const deepAgent = createDeepAgent({
    model,
    tools: [fetchTextFromUrl],
    systemPrompt: SYSTEM_PROMPT,
    checkpointer,
  });

  const content = `Project Gutenberg hosts a full plain-text copy of F. Scott Fitzgerald's The Great Gatsby.
    URL: https://www.gutenberg.org/files/64317/64317-0.txt

    Answer as much as you can:

    1) How many lines in the complete Gutenberg file contain the substring \`Gatsby\` (count lines, not occurrences within a line, each line ends with a line break).
    2) The 1-based line number of the first line in the file that contains \`Daisy\`.
    3) A two-sentence neutral synopsis.

    Do your best on (1) and (2). If at any point you realize you cannot **verify** an exact answer with
    your available tools and reasoning, do not fabricate numbers: use \`null\` for that field and spell out
    the limitation in \`how_you_computed_counts\`. If you encounter any errors please report what the error was and what the error message was.`;
  console.log("here");
  const agentResult = await agent.invoke(
    {
      messages: [{ role: "user", content }],
    },
    { configurable: { thread_id: "great-gatsby-lc" } },
  );

  // const deepAgentResult = await deepAgent.invoke(
  //   {
  //     messages: [{ role: "user", content }],
  //   },
  //   { configurable: { thread_id: "great-gatsby-da" } },
  // );

  const agentMessage = agentResult.messages;
  // const deepMessage = deepAgentResult.messages;
  console.log(agentMessage);
  console.log("\n");
  // console.log(deepMessage);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
