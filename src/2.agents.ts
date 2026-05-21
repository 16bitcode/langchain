/**
 * createAgent() 提供一个可用于生产环境的agent实现
 */

import { ChatDeepSeek } from "@langchain/deepseek";
import ENV from "./help/env";
import {
  createAgent,
  createMiddleware,
  dynamicSystemPromptMiddleware,
  HumanMessage,
  SystemMessage,
  tool,
  ToolMessage,
} from "langchain";
import z from "zod";
import { MessagesValue, StateSchema } from "@langchain/langgraph";

// 核心组件
// Model
// 1.static model 静态模型
// 2.dynamic model 动态模型 ->  wrapModelCall()
const chatModel = new ChatDeepSeek({
  model: ENV.DEEPSEEK_MODEL,
  apiKey: ENV.DEEPSEEK_API_KEY,
  timeout: 30_000,
  configuration: {
    baseURL: ENV.DEEPSEEK_BASE_URL,
  },
});

const chatModelV4 = new ChatDeepSeek({
  model: ENV.DEEPSEEK_MODEL_V4,
  apiKey: ENV.DEEPSEEK_API_KEY,
  timeout: 30_000,
  configuration: {
    baseURL: ENV.DEEPSEEK_BASE_URL,
  },
});

const dynamicModelMiddleware = createMiddleware({
  name: "DynamicModelSelect",
  wrapModelCall: (request, handler) => {
    const messageCount = request.messages.length;
    return handler({
      ...request,
      model: messageCount > 2 ? chatModelV4 : chatModel,
    });
  },
});

// const agent = createAgent({
//     model: chatModel,
//     tools: [],
//     middleware: [dynamicModelMiddleware]
// })

// const r = await agent.invoke({'messages': [{'role': 'human', 'content': '今天天气怎么样？'}]})
// console.log(r)
// const rr = await agent.invoke({'messages': [{'role': 'human', 'content': '今天天气怎么样？'}]})
// console.log(rr)
// const rrr = await agent.invoke({'messages': [{'role': 'human', 'content': '今天天气怎么样？'}]})
// console.log(rrr)

// Tool 工具
// static tool 静态工具
// dynamic tool 动态工具 -> wrapModelCall()

const search = tool(({ query }: { query: string }) => `结果是:${query}`, {
  name: "search",
  description: "搜索信息",
  schema: z.object({
    query: z.string().describe("信息"),
  }),
});

const get_weather = tool(
  ({ location }: { location: string }) => `${location}的天气是晴天`,
  {
    name: "get_weather",
    description: "查询天气的方法",
    schema: z.object({
      location: z.string().describe("城市名"),
    }),
  },
);

const contextSchema = z.object({
  userRole: z.string(),
});
const contextDynamicTools = createMiddleware({
  name: "dynamicTools",
  contextSchema,
  wrapModelCall: (request, handler) => {
    const userRole = request.runtime.context.userRole;
    let filterTools = request.tools;
    if (userRole === "editor") {
      filterTools = filterTools.filter((t) => t.name !== "delete_data");
    }
    return handler({ ...request, tools: filterTools });
  },
});

// const agent = createAgent({
//   model: chatModel,
//   tools: [search, get_weather],
//   middleware: [contextDynamicTools],
// });

// 工具错误处理 wrapToolCall() 钩子
const handleToolError = createMiddleware({
  name: "HandleToolError",
  wrapToolCall: async (request, handler) => {
    try {
      return await handler(request);
    } catch (e) {
      return new ToolMessage({
        content: `Tool error: 请重新输入. ${e}`,
        tool_call_id: request.toolCall.id!,
      });
    }
  },
});

// const agent = createAgent({
//   model: chatModel,
//   tools: [search, get_weather],
//   middleware: [handleToolError],
// });

// ReAct 循环中工具使用情况

// System prompt 系统提示
// 1.静态系统提示
// 2.动态系统提示
// const agent = createAgent({
//   model: chatModel,
//   tools: [search, get_weather],
//   systemPrompt: "你是一个有用的助手",
// });
// systemPrompt接受 string 和 SystemMessage 类型
// const agent = createAgent({
//   model: chatModel,
//   tools: [search, get_weather],
//   systemPrompt: new SystemMessage({
//     content: [
//       { type: "text", text: "你是一个AI助手来分析书籍" },
//       {
//         type: "text",
//         text: "简单概述<傲慢与偏见>的内容",
//         cache_control: { type: "ephemeral" },
//       },
//     ],
//   }),
// });
// const res = await agent.invoke({
//   messages: [new HumanMessage("分析傲慢与偏见")],
// });
// 动态系统提示
// const agent = createAgent({
//   model: chatModel,
//   tools: [search, get_weather],
//   contextSchema,
//   middleware: [
//     dynamicSystemPromptMiddleware<z.infer<typeof contextSchema>>(
//       (state, runtime) => {
//         const userRole = runtime.context.userRole;
//         const basePrompt = "You are a helpful assistant.";

//         if (userRole === "expert") {
//           return `${basePrompt} Provide detailed technical responses.`;
//         } else if (userRole === "beginner") {
//           return `${basePrompt} Explain concepts simply and avoid jargon.`;
//         }
//         return basePrompt;
//       },
//     ),
//   ],
// });

// name属性
// 为代理设置可选的name属性，多代理系统中将代理添加为子图时，可用作节点标识符
// const agent = createAgent({
//   model: chatModel,
//   tools: [search, get_weather],
//   name: "chat",
// });

// invocation 调用
// 可以通过向agent的state传递更新来调用
// await agent.invoke({
//   messages: [{ role: "user", content: "北京天气？" }],
// });

// 高级概念
// structured output结构化输出
// 使用responseFormat参数实现结构化输出

// const ContactInfo = z.object({
//   name: z.string(),
//   email: z.string(),
//   phone: z.string(),
// });
// const agent = createAgent({
//   model: chatModel,
//   responseFormat: ContactInfo,
// });

// const res = await agent.invoke({
//   messages: [
//     {
//       role: "user",
//       content: "解析下面的数据：张三,zhangsan@163.com,(555) 123-4567",
//     },
//   ],
// });
// console.log(res.structuredResponse);

// Memory 记忆
// agent会通过消息状态自动维护对话历史记录，存储在状态中的信息可以被视为智能体的短期记忆
const CustomAgentState = new StateSchema({
  messages: MessagesValue,
  userPreferences: z.record(z.string(), z.string()),
});

const agent = createAgent({
  model: chatModel,
  tools: [search, get_weather],
  stateSchema: CustomAgentState,
});

// Streaming 流媒体 -> 实时发送消息流
// const stream = await agent.stream(
//   {
//     messages: [{ role: "user", content: "搜索最新的AI新闻" }],
//   },
//   { streamMode: "values" },
// );
// for await (const chunk of stream) {
//   const latestMessage = chunk.messages.at(-1);
//   if (latestMessage?.content) {
//     console.log(`Agent: ${latestMessage.content}`);
//   } else if (latestMessage?.tool_calls) {
//     const tollCallNames = latestMessage.tool_calls.map((tc) => tc.name);
//     console.log(`Calling tools: ${tollCallNames.join(", ")}`);
//   }
// }

// middleware 中间件
//
