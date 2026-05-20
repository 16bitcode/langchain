import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const resolvePath = (str: string) =>
  path.resolve(__dirname, "../../", str);
