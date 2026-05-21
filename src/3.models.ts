/**
 * Models 模型
 *
 * 模型的2种使用方式
 * 1. 通过agent使用
 * 2. 单独使用
 */

import { initChatModel } from "langchain";
import ENV from "./help/env";

// 1.独立使用模型 initChatModel
// const model = await initChatModel(ENV.DEEPSEEK_MODEL, {
//   modelProvider: "deepseek",
// });
// const res = await model.invoke("你是谁？");
// console.log(res);
