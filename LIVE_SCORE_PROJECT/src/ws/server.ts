import { WebSocket, WebSocketServer } from "ws";
import { Server } from "http";
import { wsArcjet } from "../arcjet";
import { Request } from "express";

interface AliveWebSocket extends WebSocket {
  isAlive?: boolean;
}
function sendJson(socket: WebSocket, payload: any) {
  if (socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify(payload));
}

function broadcast(wss: WebSocketServer, payload: any) {
  if (!wss.clients) return;
  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) continue;
    client.send(JSON.stringify(payload));
  }
}

export function attachWebSocketServer(server: Server) {
  const wss = new WebSocketServer({
    server,
    path: "/ws",
    maxPayload: 1024 * 1024,
  });

  wss.on("connection", async (socket: AliveWebSocket,req:Request) => {
if(wsArcjet){
  try{
    const decision = await wsArcjet.protect(req);
    if(decision.isDenied()){
      const code = decision.reason.isRateLimit() ? 1013 : 1008;
      const reason = decision.reason.isRateLimit() ? "Rate limit exceeded" : "Access denied";
      socket.close(code, reason);
      return;
    }

  }catch(err){
    console.error("WS connection error:", err);
    socket.close(1011, "Server security error");
    return;
  }
}

    socket.isAlive = true;
    socket.on("pong", () => {
      socket.isAlive = true;
    });
    sendJson(socket, { type: "Welcome to Live Score WebSocket Server!" });
    socket.on("error", console.error);
  });

  const interval = setInterval(() => {
    wss.clients.forEach((ws: AliveWebSocket) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    }, 30000);
  });

  wss.on("close", () => {
    clearInterval(interval);
  });

  function broadcastMatchCreated(match: any) {
    broadcast(wss, { type: "match_created", data: match });
  }
  return { broadcastMatchCreated };
}
