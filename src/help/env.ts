import { config } from "dotenv";
import { resolvePath } from ".";

const dotConfig = config({ path: resolvePath(".env") }).parsed || {};

const ENV = {
    DEEPSEEK_MODEL: dotConfig.DEEPSEEK_MODEL,
    DEEPSEEK_API_KEY: dotConfig.DEEPSEEK_API_KEY,
    DEEPSEEK_BASE_URL: dotConfig.DEEPSEEK_BASE_URL,
    DEEPSEEK_MODEL_V4: dotConfig.DEEPSEEK_MODEL_V4
}

export default ENV;
