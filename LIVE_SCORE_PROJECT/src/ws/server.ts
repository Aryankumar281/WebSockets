import { WebSocket, WebSocketServer } from "ws";
import { Server } from "http";
import { wsArcjet } from "../arcjet";
import { Request } from "express";

interface AliveWebSocket extends WebSocket {
  isAlive?: boolean;
  subscriptions?: Set<number>;
}


const matchSubscribers = new Map();
function subscribe(matchId: number, socket: AliveWebSocket) {
  if (!matchSubscribers.has(matchId)) {
    matchSubscribers.set(matchId, new Set());
  }
  matchSubscribers.get(matchId).add(socket);
}

function unsubscribe(matchId: number, socket: AliveWebSocket) {
  const subscribers = matchSubscribers.get(matchId);
  if (!subscribers) return;
  // Remove the socket first, then delete the entry if empty
  subscribers.delete(socket);
  if (subscribers.size === 0) {
    matchSubscribers.delete(matchId);
  }
}

function cleanUpSubscriptions(socket: AliveWebSocket) {
  if (!socket.subscriptions) return;
  for (const matchId of socket.subscriptions) {
    unsubscribe(matchId, socket);
  }
}

function sendJson(socket: WebSocket, payload: any) {
  if (socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify(payload));
}

function broadcastToAll(wss: WebSocketServer, payload: any) {
  if (!wss.clients) return;
  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) continue;
    client.send(JSON.stringify(payload));
  }
}

function broadcastToMatch(matchId: number, payload: any) {
  const subscribers = matchSubscribers.get(matchId);
  if (!subscribers) return;
  const message = JSON.stringify(payload);
  for (const subscriber of subscribers) {
    if (subscriber.readyState === WebSocket.OPEN) {
      subscriber.send(message);
    } else {
      cleanUpSubscriptions(subscriber);
    }
  }
}


function handleMessage(socket: AliveWebSocket, data: any) {
  let message;

  try{
    message = JSON.parse(data.toString());

  }catch(err){
    sendJson(socket, { type: "error", message: "Invalid message format" });
  }
  if(message?.type === "subscribe" && Number.isInteger(message.matchId)){
    subscribe(message.matchId, socket);
    socket.subscriptions = socket.subscriptions ?? new Set();
    socket.subscriptions.add(message.matchId);
    sendJson(socket, { type: "subscribed", matchId: message.matchId });
    return;
  }
  if(message?.type === "unsubscribe" && Number.isInteger(message.matchId)){
    unsubscribe(message.matchId, socket);
    if (socket.subscriptions) socket.subscriptions.delete(message.matchId);
    sendJson(socket, { type: "unsubscribed", matchId: message.matchId });
    return;
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
    socket.subscriptions = new Set();
    sendJson(socket, { type: "Welcome to Live Score WebSocket Server!" });
    socket.on("message", (data) => handleMessage(socket, data));
    socket.on("error", (err) => {
      console.error('WS socket error:', err);
      // terminate on error to ensure a clean state
      try { socket.terminate(); } catch (e) { /* ignore */ }
    });
    socket.on("close", () => {
      cleanUpSubscriptions(socket);
    });
  });

  // Heartbeat: ping clients every 30s and terminate those that don't respond
  const interval = setInterval(() => {
    wss.clients.forEach((ws: AliveWebSocket) => {
      if (ws.isAlive === false) {
        try { ws.terminate(); } catch (e) { /* ignore */ }
        return;
      }
      ws.isAlive = false;
      try { ws.ping(); } catch (e) { /* ignore */ }
    });
  }, 30000);

  wss.on("close", () => {
    clearInterval(interval);
  });

  function broadcastMatchCreated(match: any) {
    broadcastToAll(wss, { type: "match_created", data: match });
  }
  function broadcastCommentary(matchId: number, commentary: any) {
    broadcastToMatch(matchId, { type: "new_commentary", data: commentary });
  }
  return { broadcastMatchCreated, broadcastCommentary };
}