# WebSocket
Websocket is a **Communication Protocol** that enable **full duplex** connection between client and the server over a single persistent **TCP** connection.

It allow both parties to send messages independently at any time without needing to re-establish the connection, that makes it ideal for  __*real-time*__ application where __*low-latency*__ and continuous data exchange is crucial.

## WebSocket Protocol Comparison

| Aspect | ws:// (WebSocket) | wss:// (WebSocket Secure) |
|------|------------------|---------------------------|
| Encryption | None (plaintext) | TLS encryption (same as HTTPS) |
| Default Port | 80 | 443 |
| Initial Handshake Protocol | HTTP | HTTPS |
| Data Security | Susceptible to eavesdropping, tampering, and MITM attacks | Protected against eavesdropping, tampering, and most MITM attacks |
| Browser Behavior (Modern) | Blocked on HTTPS pages due to mixed content | Allowed on both HTTP and HTTPS pages |
| Performance Impact | Slightly lower overhead (no TLS) | Minimal overhead (TLS handshake; negligible afterward) |
| TLS Certificate Required | No | Yes |
| Production Usage | Not recommended | Strongly recommended (industry standard) |



## Advantages and Disadvantages of WebSockets

### Advantages

- **Low latency** compared to HTTP polling or long-polling
- **Minimal overhead**, especially efficient for frequent small messages
- **Full-duplex communication** enabling real-time, bidirectional data flow
- **Scalable** for chat systems, live dashboards, and streaming updates

### Disadvantages

- **Persistent connections required**, which can increase server resource usage
- **No built-in caching, retries, or status codes** like HTTP
- **Security risks** if `ws://` is used instead of `wss://` (TLS encryption)
- **Fallback mechanisms** may be needed for legacy browsers or restrictive networks (rare in 2026)



## WebSocket Use Cases (Architecture Context)

The architecture diagram illustrates a **persistent WebSocket connection** between clients and backend services, typically routed through a load balancer or gateway. This connection enables low-latency, bidirectional communication once the initial HTTP/HTTPS handshake is complete.

### 1. Real-Time Chat and Collaboration
**Architecture Flow:**  
Client ⇄ WebSocket Gateway ⇄ Messaging Service ⇄ Data Store

- Clients maintain open connections to receive messages instantly
- Backend services broadcast updates to multiple connected clients
- Ideal for collaborative editing, typing indicators, and presence updates  
_Examples_: Slack, Google Docs

---

### 2. Live Updates and Feeds
**Architecture Flow:**  
Client ⇄ WebSocket Server ⇄ Event Stream / Pub-Sub System

- Backend pushes events as soon as data changes
- Eliminates polling and reduces redundant HTTP requests
- Scales well when combined with message brokers (Kafka, Redis, NATS)  
_Examples_: stock prices, sports scores, news feeds

---

### 3. Online Gaming
**Architecture Flow:**  
Client ⇄ Game Session Server ⇄ State Synchronization Layer

- Low-latency bidirectional messaging for player inputs and game state
- Servers maintain authoritative game state
- WebSockets carry frequent, small payloads efficiently  
_Examples_: real-time multiplayer games

---

### 4. IoT and Streaming
**Architecture Flow:**  
Device / Client ⇄ WebSocket Ingress ⇄ Processing Pipeline ⇄ Storage

- Devices stream telemetry over persistent connections
- Backend processes and forwards data in near real time
- Suitable for monitoring dashboards and lightweight media streams  
_Examples_: sensor data, device monitoring, audio/video streaming

---

### 5. Notifications and Alerts
**Architecture Flow:**  
Client ⇄ WebSocket Server ⇄ Notification Service

- Server pushes events directly to connected clients
- No polling or refresh cycles required
- Works well with rule engines and alerting systems  
_Examples_: push notifications, system alerts

###
###
# How WebSockets Work: The Handshake Process

WebSockets begin life as a normal HTTP request. The “handshake” is the short negotiation where the client and server agree to stop behaving like HTTP and switch to a persistent WebSocket connection.

---

### Step 1: Client Starts With an HTTP Request

The browser (or client) sends a standard HTTP request to the server, asking to **upgrade** the connection.

Key things the client says:
- “I want to upgrade this connection to WebSocket”
- “Here’s a random key to prove this is a real WebSocket request”
- “I support the WebSocket protocol”

Even though it looks special, this is still just HTTP at this point.

---

### Step 2: Server Validates the Request

The server checks:
- Is the `Upgrade: websocket` header present?
- Is the WebSocket version supported?
- Is the request allowed (origin, auth, etc.)?

If everything checks out, the server agrees to the upgrade.

---

### Step 3: Server Sends an Upgrade Response

The server responds with an HTTP **101 Switching Protocols** status code.

This response means:
- “I accept the upgrade”
- “We are no longer using HTTP for this connection”
- “From now on, we speak WebSocket”

At this moment, the handshake is complete.

---

### Step 4: Persistent WebSocket Connection Is Established

After the handshake:
- The connection stays **open**
- Both client and server can send messages **at any time**
- No request–response cycle like HTTP
- Messages are framed and lightweight

This is where WebSockets shine: real-time, two-way communication.

---

### Secure Handshake (`wss://`)

When using `wss://`:
1. A **TLS handshake** happens first (same as HTTPS)
2. The WebSocket handshake runs inside that encrypted tunnel
3. All messages afterward are encrypted

To the application, it feels the same, just safer.

---

### In Simple Terms

Think of it like this:

- **HTTP**: knock → wait → answer → door closes  
- **WebSocket handshake**: knock → “can we keep the door open?” → yes  
- **WebSocket connection**: open door, talk freely both ways

No more knocking every time you want to say something.

---

### Why the Handshake Matters

- Works with existing HTTP infrastructure (proxies, load balancers)
- Allows servers to reject invalid or unsafe connections early
- Enables a clean switch to a fast, persistent protocol

The handshake is brief, but it’s what unlocks everything WebSockets are good at.
