/**
 * createAgent() 提供一个可用于生产环境的agent实现
 */

import { ChatDeepSeek } from "@langchain/deepseek";
import ENV from "./help/env";
import { createAgent, createMiddleware } from "langchain";

// 核心组件
// Model
// 1.static model 静态模型
// 2.dynamic model 动态模型
const chatModel = new ChatDeepSeek({
    model: ENV.DEEPSEEK_MODEL,
    apiKey: ENV.DEEPSEEK_API_KEY,
    timeout: 30_000,
    configuration: {
        baseURL: ENV.DEEPSEEK_BASE_URL,
    },
})

const chatModelV4 = new ChatDeepSeek({
    model: ENV.DEEPSEEK_MODEL_V4,
    apiKey: ENV.DEEPSEEK_API_KEY,
    timeout: 30_000,
    configuration: {
        baseURL: ENV.DEEPSEEK_BASE_URL,
    },
})

const dynamicModelMiddleware = createMiddleware({
    name: 'DynamicModelSelect',
    wrapModelCall: (request, handler) => {
        const messageCount = request.messages.length
        return handler({
            ...request,
            model: messageCount > 2 ? chatModelV4 : chatModel
        })
    }
})

const agent = createAgent({
    model: chatModel,
    tools: [],
    middleware: [dynamicModelMiddleware]
})

// const r = await agent.invoke({'messages': [{'role': 'human', 'content': '今天天气怎么样？'}]})
// console.log(r)
// const rr = await agent.invoke({'messages': [{'role': 'human', 'content': '今天天气怎么样？'}]})
// console.log(rr)
// const rrr = await agent.invoke({'messages': [{'role': 'human', 'content': '今天天气怎么样？'}]})
// console.log(rrr)