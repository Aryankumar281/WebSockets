import WebSocket, { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });


// Connection event
wss.on('connection',(socket,request)=>{
    const ip = request.socket.remoteAddress;

    socket.on("message",(rawData)=>{
        const message =  rawData.toString();
        console.log({rawData});
        console.log(message)


        wss.clients.forEach((client)=>{
            if(client.readyState===WebSocket.OPEN) client.send(`Server Broadcast :- ${message}`)
        })
    })

    socket.on('error',(err)=>{
        console.error(`Error: ${err.message}: ${ip}`)
    })

    socket.on('close',()=>{
        console.log("Client Disconnected");
    })
    
})

console.log("Websocket Server is live on ws://localhost:8080")