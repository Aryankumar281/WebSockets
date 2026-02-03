import { WebSocket, WebSocketServer } from "ws";
import { Server } from "http";
function sendJson(socket: WebSocket, payload: any) {
  if (socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify(payload));
}

function broadcast(wss: WebSocketServer, payload: any) {
  if (!wss.clients) return;
  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) return;
    client.send(JSON.stringify(payload));
  }
}

export function attachWebSocketServer(server: Server) {
  const wss = new WebSocketServer({
    server,
    path: "/ws",
    maxPayload: 1024 * 1024
  });


  wss.on("connection", (socket: WebSocket) => {
    sendJson(socket, { type: "Welcome to Live Score WebSocket Server!" });
    socket.on("error", console.error);
  })

  function broadcastMatchCreated(match: any) {
    broadcast(wss, { type: "match_created", data: match });
  }
  return{ broadcastMatchCreated };
}
