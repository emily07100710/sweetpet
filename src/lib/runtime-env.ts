type RuntimeEnv = Record<string, unknown>;

let runtimeEnv: RuntimeEnv = {};

function readEnvValue(source: RuntimeEnv | undefined, name: string) {
  const value = source?.[name];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function normalizeApiKey(value: string | undefined) {
  if (!value || value === "your_gemini_api_key_here") {
    return undefined;
  }

  return value;
}

export function setRuntimeEnv(env: unknown) {
  if (env && typeof env === "object") {
    runtimeEnv = env as RuntimeEnv;
  }
}

export function getGeminiApiKey() {
  return normalizeApiKey(
    readEnvValue(runtimeEnv, "GEMINI_API_KEY") ??
      readEnvValue(runtimeEnv, "VITE_GEMINI_API_KEY") ??
      process.env.GEMINI_API_KEY ??
      process.env.VITE_GEMINI_API_KEY ??
      import.meta.env.VITE_GEMINI_API_KEY,
  );
}
