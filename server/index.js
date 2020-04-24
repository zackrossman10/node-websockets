const webSocketsServerPort = 8000;
const webSocketServer = require('websocket').server;
const http = require('http');
// Spinning the http server and the websocket server.
const server = http.createServer();
server.listen(webSocketsServerPort);
const wsServer = new webSocketServer({
  httpServer: server
});

// Generates unique ID for every new connection
const getUniqueID = () => {
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return s4() + s4() + '-' + s4();
};

// I'm maintaining all active connections in this object
const clients = {};
// I'm maintaining all active players in this object
const players = {};
// I'm maintaining all active tables in this object
const tables = {};

// The current editor content is maintained here.
let editorContent = null;
// player activity history.
let playerActivity = [];

const sendMessage = (json) => {
  // We are sending the current data to all connected clients
  Object.keys(clients).map((client) => {
    clients[client].sendUTF(json);
  });
}

const typesDef = {
  PLAYER_EVENT: "playerevent",
  TABLE_EVENT: "tableevent",
  CONTENT_CHANGE: "contentchange",
  TABLE_CHANGE: "tablechange"
}

wsServer.on('request', function(request) {
  var playerID = getUniqueID();
  console.log((new Date()) + ' Recieved a new connection from origin ' + request.origin + '.');
  // You can rewrite this part of the code to accept only the requests from allowed origin
  const connection = request.accept(null, request.origin);
  clients[playerID] = connection;
  console.log('connected: ' + playerID + ' in ' + Object.getOwnPropertyNames(clients));
  connection.on('message', function(message) {
    if (message.type === 'utf8') {
      const dataFromClient = JSON.parse(message.utf8Data);
      const json = { type: dataFromClient.type };
      if (dataFromClient.type === typesDef.PLAYER_EVENT) {
        players[playerID] = { username: dataFromClient.username,
                              tableAdmin: dataFromClient.tableAdmin };
        playerActivity.push(`${dataFromClient.username} joined to edit the document`);
        json.data = { players, playerActivity };
      } else if (dataFromClient.type === typesDef.TABLE_EVENT) {
        console.log("datafromclient");
        console.log(dataFromClient);
        var tableID = dataFromClient.tableid;
        var currentTable = { tablename: dataFromClient.tablename,
                            numPlayers: 1,
                            dicePerPlayer: dataFromClient.numdice };
        tables[tableID] = currentTable;
        console.log("tables");
        console.log(tables);
        playerActivity.push(`${players[playerID]} created a new table, ${dataFromClient.tablename}`);
        json.data = { players, tables, currentTable, playerActivity };
        console.log("json");
        console.log(json.data);
      }else if (dataFromClient.type === typesDef.CONTENT_CHANGE) {
        editorContent = dataFromClient.content;
        json.data = { editorContent, playerActivity };
      }
      sendMessage(JSON.stringify(json));
      console.log("tables**");
      console.log(tables);
    }
  });
  // player disconnected
  connection.on('close', function(connection) {
    console.log((new Date()) + " Peer " + playerID + " disconnected.");
    const json = { type: typesDef.PLAYER_EVENT };
    playerActivity.push(`${players[playerID].username} left the document`);
    json.data = { players, playerActivity };
    delete clients[playerID];
    delete players[playerID];
    sendMessage(JSON.stringify(json));
  });
});
