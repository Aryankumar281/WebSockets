import AgentAPI from "apminsight";
AgentAPI.config();
import express from "express";
import { matchRouter } from "./routes/matches.ts";
import http from "http";
import { attachWebSocketServer } from "./ws/server.ts";
import { securityMiddleware } from "./arcjet.ts";
import { commentryRouter } from "./routes/commentary.ts";
const PORT = Number(process.env.PORT) || 8000;
const HOST = process.env.HOST || "0.0.0.0";

const app = express();

// Configure trust proxy based on environment variable
// Only set if TRUST_PROXY_HOPS is present and is a valid non-negative integer
let trustProxyValue: number | boolean = false;
if (process.env.TRUST_PROXY_HOPS !== undefined) {
  const parsedValue = Number(process.env.TRUST_PROXY_HOPS);
  if (!isNaN(parsedValue) && Number.isInteger(parsedValue) && parsedValue >= 0) {
    trustProxyValue = parsedValue;
  } else {
    console.warn(`Invalid TRUST_PROXY_HOPS value: "${process.env.TRUST_PROXY_HOPS}". Must be a non-negative integer. Defaulting to false.`);
  }
}
app.set('trust proxy', trustProxyValue);

const server = http.createServer(app);
// Use JSON middleware
app.use(express.json());

// Root GET route
app.get("/", (req, res) => {
  res.send("Hello, World!");
});
app.use(securityMiddleware());

app.use("/matches", matchRouter);
app.use("/matches/:id/commentary", commentryRouter);

const { broadcastMatchCreated,broadcastCommentary } = attachWebSocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;
app.locals.broadcastCommentary = broadcastCommentary;

// Start the server
server.listen(PORT, HOST, () => {
  const baseUrl =
    HOST === "0.0.0.0" ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;
  console.log(`Server is running on ${baseUrl}`);
  console.log(
    `WebSocket server is running on ${baseUrl.replace("http", "ws")}/ws`,
  );
});
