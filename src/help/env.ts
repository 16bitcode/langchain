import { config } from "dotenv";
import { resolvePath } from ".";

const ENV = config({ path: resolvePath(".env") }).parsed || {};

export default ENV;
