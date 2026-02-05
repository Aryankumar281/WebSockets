import express from "express";
import { matchRouter } from "./routes/matches.ts";
import http from "http";
import { attachWebSocketServer } from "./ws/server.ts";
import { securityMiddleware } from "./arcjet.ts";
import { commentryRouter } from "./routes/commentary.ts";
const PORT = Number(process.env.PORT) || 8000;
const HOST = process.env.HOST || "0.0.0.0";

const app = express();
app.set('trust proxy', true);
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

const { broadcastMatchCreated } = attachWebSocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;

// Start the server
server.listen(PORT, HOST, () => {
  const baseUrl =
    HOST === "0.0.0.0" ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;
  console.log(`Server is running on ${baseUrl}`);
  console.log(
    `WebSocket server is running on ${baseUrl.replace("http", "ws")}/ws`,
  );
});
