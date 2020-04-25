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
const getUniqueId = () => {
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

const typesDef = {
  BROADCAST: "broadcastevent",
  PLAYER_REGISTER_EVENT: "playerregisterevent",
  TABLE_REGISTER_EVENT: "tableregisterevent",
  TABLE_JOIN_EVENT: "tablejoinevent",
  GAME_SETUP_EVENT: "gamesetupevent",
  GAME_START_EVENT: "gamestartevent"  
}

// Send json data to all connected clients
const broadcastToAll = (json) => {
  Object.keys(clients).map((client) => {
    clients[client].sendUTF(json);
  });
}

// Send updates about the current game to all players in the current game
const broadcastToPlayers = (currentTable, type) => {
  currentTable.currentGame.players.map((player) => {
    var playerId = player.playerId;
    var json = { type: type };
    json.data = {currentTable: currentTable};
    clients[playerId].sendUTF(JSON.stringify(json));
  });
}

 const shakeDice = (numDice) => {
  var dice = []
  for (var i = 0; i < numDice; i++) {
    // Generate random number between 1 and 6
    var random = Math.floor(Math.random() * 6) + 1 ;
    dice.push(random);
  }
  return dice;
 }

 const calculateTotals = (players) => {
  // Indices 0-1 are not used, indices 2-6 hold total number of that dice number
  var diceTotals = [0,0,0,0,0,0,0]
  players.map((player) => {
    player.diceVals.map((die) => {
      switch(die) {
        case 1:
          diceTotals = diceTotals.map((total) => total + 1);
          break;
        case 2: 
          diceTotals[2] = diceTotals[2] + 1;
          break;
        case 3: 
          diceTotals[3] = diceTotals[3] + 1;
          break;
        case 4: 
          diceTotals[4] = diceTotals[4] + 1;
          break;
        case 5: 
          diceTotals[5] = diceTotals[5] + 1;
          break;
        case 6: 
          diceTotals[6] = diceTotals[6] + 1;
          break;
      }
    });
  });
  console.log("Calculated dice totals");
  console.log(diceTotals);
  return diceTotals;
}

wsServer.on('request', function(request) {
  var playerId = getUniqueId();
  console.log((new Date()) + ' Recieved a new connection from origin ' + request.origin + '.');
  // You can rewrite this part of the code to accept only the requests from allowed origin
  const connection = request.accept(null, request.origin);
  clients[playerId] = connection;
  console.log('connected: ' + playerId + ' in ' + Object.getOwnPropertyNames(clients));
  connection.on('message', function(message) {

    if (message.type === 'utf8') {
      console.log("JSON dataFromClient");
      const dataFromClient = JSON.parse(message.utf8Data);
      const broadcastJson = { type: typesDef.BROADCAST };
      const specificJson = { type: dataFromClient.type };

      if (dataFromClient.type === typesDef.PLAYER_REGISTER_EVENT) {
        // Create a new player
        players[playerId] = { username: dataFromClient.username,
                              tableAdmin: dataFromClient.tableAdmin };
        playerActivity.push(`${dataFromClient.username} registered as a player`);

      } else if (dataFromClient.type === typesDef.TABLE_REGISTER_EVENT) {
        // Create a new table and a new game within this table
        var tableId = dataFromClient.tableId;
        var game = { totalNumDice: null,
                     diceTotals: null,
                     currentTurn: { position: 0,
                                    call: null },
                     previousTurn: { position: null,
                                     call: null },
                     players: [{ playerId: playerId, numDice: dataFromClient.numDice, diceVals: null }] }
        var currentTable = { tableId: tableId,
                             tablename: dataFromClient.tablename,
                             dicePerPlayer: dataFromClient.numDice,
                             adminId: playerId,
                             adminUsername: players[playerId].username,
                             currentGame: game };
        tables[tableId] = currentTable;
        playerActivity.push(`${players[playerId].username} created a new table, ${dataFromClient.tablename}`);
        broadcastToPlayers(currentTable, typesDef.TABLE_REGISTER_EVENT);

      } else if (dataFromClient.type === typesDef.TABLE_JOIN_EVENT) {
        // Add a new player to the current game of the current table
        var tableId = dataFromClient.tableId;
        var currentTable = tables[tableId];
        var numDice = tables[tableId].dicePerPlayer;
        var player = { playerId: playerId,
                       numDice: numDice, 
                       diceVals: null }
        currentTable.currentGame.players.push(player);
        console.log("currentTable");
        console.log(currentTable);
        playerActivity.push(`${players[playerId].username} joined a table, ${currentTable.tablename}`);
        broadcastToPlayers(currentTable, typesDef.TABLE_JOIN_EVENT);

      } else if (dataFromClient.type === typesDef.GAME_SETUP_EVENT) {
        // Calculate total number of dice to start
        var currentTable = tables[dataFromClient.tableId];
        var dicePerPlayer = currentTable.dicePerPlayer;
        var numPlayers = currentTable.currentGame.players.length;
        currentTable.currentGame.totalNumDice = dicePerPlayer * numPlayers;

        // Save the original game configuration
        currentTable.originalGame = currentTable.currentGame;

        // Give the players a random set of dice for the first round
        currentTable.currentGame.players.map((player) => {
          player.diceVals = shakeDice(player.numDice);
        })

        // Calculate the number of each dice (aka the max call for each dice value)
        var diceTotals = calculateTotals(currentTable.currentGame.players);
        currentTable.currentGame.diceTotals = diceTotals;

        broadcastToPlayers(currentTable, typesDef.GAME_SETUP_EVENT);

      } 

      // Broadcast some JSON data to all connections, send others to a specific connection
      broadcastJson.data = { players, tables, playerActivity };
      broadcastToAll(JSON.stringify(broadcastJson));
      
      console.log("JSON broadcast");
      console.log(broadcastJson.data);
    }
  });
  // player disconnected
  connection.on('close', function(connection) {
    console.log((new Date()) + " Peer " + playerId + " disconnected.");
    const json = { type: typesDef.PLAYER_EVENT };
    playerActivity.push(`${players[playerId].username} left the document`);
    json.data = { players, playerActivity };
    delete clients[playerId];
    delete players[playerId];
    broadcastToAll(JSON.stringify(json));
  });
});
