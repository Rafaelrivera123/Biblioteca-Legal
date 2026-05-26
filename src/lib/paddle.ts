import { Environment, LogLevel, Paddle } from "@paddle/paddle-node-sdk";

const apiKey = process.env.PADDLE_API_KEY || "placeholder";

export const paddle = new Paddle(apiKey, {
  environment: Environment.production,
  logLevel: LogLevel.error,
});
