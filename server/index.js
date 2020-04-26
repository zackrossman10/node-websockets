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
  PLAYER_CALL_EVENT: "playercallevent",
  PLAYER_CAP_EVENT: "playercapevent",
  PLAYER_WIN_EVENT: "playerwinevent",
  ROUND_START_EVENT: "roundstartevent"
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

const setupRound = (currentGame) => {
  // Give the players a random set of dice for the first round
  currentGame.players.map((player) => {
    player.diceVals = shakeDice(player.numDice);
  })

  // Calculate the number of each dice (aka the max call for each dice value)
  var diceTotals = calculateTotals(currentGame.players);
  currentGame.diceTotals = diceTotals;
}

const calculateNextTurn = (currentPosition, players) => {
  for(var i = currentPosition+1; i < players.length; i++) {
    if (players[i].numDice > 0) {
      return i;
    }
  }

  for(var i = 0; i < currentPosition; i++) {
    if (players[i].numDice > 0) {
      return i;
    }
  }
}

const calculateDiceAreThere = (currentGame) => {
  var diceQuantityCall = currentGame.previousTurn.call.diceQuantity;
  var diceValueCall = currentGame.previousTurn.call.diceValue;
  var correctDiceQuantity = currentGame.diceTotals[diceValueCall];

  currentGame.capResult.call = { diceQuantity:  diceQuantityCall,
                                 diceValue: diceValueCall }
  currentGame.capResult.correctDiceQuantity = correctDiceQuantity;

  return (diceQuantityCall <= correctDiceQuantity);
}

const calculateIsWinner = (currentGame) => {
  var playersWithDice = 0;

  for(var i = 0; i < currentGame.players.length; i++) {
    if (currentGame.players[i].numDice > 0) {
      playersWithDice++;
    }
  }

  return (playersWithDice <= 1);
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

      switch (dataFromClient.type) {
        case (typesDef.PLAYER_REGISTER_EVENT): 
          // Create a new player
          players[playerId] = { username: dataFromClient.username,
                                tableAdmin: dataFromClient.tableAdmin };
          playerActivity.push(`${dataFromClient.username} registered as a player`);
          break;

        case (typesDef.TABLE_REGISTER_EVENT): 
          // Create a new table and a new game within this table
          var tableId = dataFromClient.tableId;
          var game = { winnerName: null,
                       totalNumDice: null,
                       diceTotals: null,
                       capResult: { call: null,
                                    correctDiceQuantity: null,
                                    winnerName: null,
                                    winnerPosition: null,
                                    loserName: null,
                                    loserPosition: null },
                       currentTurn: { position: 0,
                                      call: null },
                       previousTurn: { position: null,
                                       call: null },
                       players: [{ playerPosition: 0,
                                   playerId: playerId,
                                   username: players[playerId].username, 
                                   numDice: dataFromClient.numDice, 
                                   diceVals: null }] }
          var currentTable = { tableId: tableId,
                               tablename: dataFromClient.tablename,
                               status: "open",
                               dicePerPlayer: dataFromClient.numDice,
                               adminId: playerId,
                               adminUsername: players[playerId].username,
                               currentGame: game };
          tables[tableId] = currentTable;
          playerActivity.push(`${players[playerId].username} created a new table, ${dataFromClient.tablename}`);
          broadcastToPlayers(currentTable, typesDef.TABLE_REGISTER_EVENT);
          break;

        case (typesDef.TABLE_JOIN_EVENT): 
          // Add a new player to the current game of the current table
          var tableId = dataFromClient.tableId;
          var currentTable = tables[tableId];
          var numDice = tables[tableId].dicePerPlayer;
          var playerPosition = currentTable.currentGame.players.length;
          var player = { playerPosition: playerPosition,
                         playerId: playerId,
                         username: players[playerId].username,
                         numDice: numDice, 
                         diceVals: null }
          currentTable.currentGame.players.push(player);
          console.log("currentTable");
          console.log(currentTable);
          playerActivity.push(`${players[playerId].username} joined a table, ${currentTable.tablename}`);
          broadcastToPlayers(currentTable, typesDef.TABLE_JOIN_EVENT);
          break;

        case (typesDef.GAME_SETUP_EVENT): 
          // Close table such that new players cannot join
          var currentTable = tables[dataFromClient.tableId];
          currentTable.status = "closed";

          // Calculate total number of dice to start
          var dicePerPlayer = currentTable.dicePerPlayer;
          var numPlayers = currentTable.currentGame.players.length;
          currentTable.currentGame.totalNumDice = dicePerPlayer * numPlayers;

          // Save the original game configuration
          currentTable.originalGame = currentTable.currentGame;

          setupRound(currentTable.currentGame);

          broadcastToPlayers(currentTable, typesDef.GAME_SETUP_EVENT);
          break;

        case (typesDef.PLAYER_CALL_EVENT): 
          // Log the previous call and ask the next player to call
          var currentTable = tables[dataFromClient.tableId]
          var currentGame = currentTable.currentGame;
          var currentTurn = { position: dataFromClient.playerPosition,
                              call: { diceQuantity: dataFromClient.callDiceQuantity,
                                      diceValue: dataFromClient.callDiceValue }}
          currentGame.previousTurn = currentTurn

          var nextPlayerPosition = calculateNextTurn(dataFromClient.playerPosition, currentGame.players);
          var nextTurn = { position: nextPlayerPosition,
                           call: null }
          currentGame.currentTurn = nextTurn

          broadcastToPlayers(currentTable, typesDef.PLAYER_CALL_EVENT);
          break;

        case (typesDef.PLAYER_CAP_EVENT): 
          // Calculate winner, subtract die from losing player
          var currentTable = tables[dataFromClient.tableId]
          var currentGame = currentTable.currentGame;
          var winnerPosition = -1;
          var loserPosition = -1;

          if (calculateDiceAreThere(currentGame)) {
            winnerPosition = currentGame.previousTurn.position;
            loserPosition = currentGame.currentTurn.position;
          } else {
            winnerPosition = currentGame.currentTurn.position;
            loserPosition = currentGame.previousTurn.position;
          }

          currentGame.capResult.winnerName = currentGame.players[winnerPosition].username;
          currentGame.capResult.winnerPosition = winnerPosition;
          currentGame.capResult.loserName = currentGame.players[loserPosition].username;
          currentGame.capResult.loserPosition = loserPosition;
          broadcastToPlayers(currentTable, typesDef.PLAYER_CAP_EVENT);
          break;

        case (typesDef.ROUND_START_EVENT):
          var currentTable = tables[dataFromClient.tableId]
          var currentGame = currentTable.currentGame;
          var loserPosition = currentGame.capResult.loserPosition;
          var winnerPosition = currentGame.capResult.winnerPosition;

          currentGame.players[loserPosition].numDice = currentGame.players[loserPosition].numDice - 1;
          currentGame.currentTurn = { position: winnerPosition,
                                      call: null }
          currentGame.previousTurn = { position: null,
                                       call: null }

          if (calculateIsWinner(currentGame)) {
            setupRound(currentGame);
            currentGame.winnerName = currentGame.players[winnerPosition].username;
            broadcastToPlayers(currentTable, typesDef.PLAYER_WIN_EVENT);
          } else {
            setupRound(currentGame);
            broadcastToPlayers(currentTable, typesDef.PLAYER_CAP_EVENT);
          }

          broadcastToPlayers(currentTable, typesDef.ROUND_START_EVENT);
          break;
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
