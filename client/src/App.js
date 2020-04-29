import React, { Component } from 'react';
import { w3cwebsocket as W3CWebSocket } from "websocket";
import Identicon from 'react-identicons';
import {
  Navbar,
  NavbarBrand,
} from 'reactstrap';
import 'medium-editor/dist/css/medium-editor.css';
import 'medium-editor/dist/css/themes/default.css';
import "bootstrap/dist/css/bootstrap.css";
import './App.css';
import PlayerCup from "./component/PlayerCup.js";


// const client = new W3CWebSocket('ws://127.0.0.1:8000');
const client = new W3CWebSocket(' ws://ec2-52-15-169-240.us-east-2.compute.amazonaws.com:8000');

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentPlayers: [],
      currentTables: [],
      currentTable: null,
      playerActivity: [],
      username: null,
      tableAdmin: null,
      playerPosition: null,
      gameReady: false,
      gameOver: false,
      revealDice: false,

      TABLE_ID_INDEX: 0,
      TABLE_NAME_INDEX: 1,
      TABLE_STATUS_INDEX: 2,
      TABLE_DICE_PER_PLAYER_INDEX: 3,
      TABLE_ADMIN_ID_INDEX: 4,
      TABLE_ADMIN_USERNAME_INDEX: 5,
      TABLE_CURRENT_GAME_INDEX: 6,
      TABLE_ORIGINAL_GAME_INDEX: 7,

      formValues: { diceQuantity: "",
                    diceValue: "" },
      formErrors: { diceQuantity: "",
                    diceValue: "" },
      formValidity: { diceQuantity: false,
                      diceValue: false },
    };
  }

  addPlayer = (registertable) => {
    const username = this.username.value;
    const tableAdmin = registertable;
    if (username.trim()) {
      const data = {
        username,
        tableAdmin
      };
      console.log(data);
      this.setState({
        ...data
      }, () => {
        client.send(JSON.stringify({
          ...data,
          type: "playerregisterevent"
        }));
      });
    }
    document.getElementById("register_player").value = "";
  }

  // Generates unique ID for every new table
  getUniqueID = () => {
    const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    return s4() + s4() + '-' + s4();
  };


  addTable = (registertable) => {
    const tablename = this.tablename.value;
    const numDice = this.numDice.value;
    const tableId = this.getUniqueID();
    if (tablename.trim()) {
      const data = {
        tablename,
        numDice,
        tableId
      };
      client.send(JSON.stringify({
        ...data,
        type: "tableregisterevent"
      }));
    }
  }

  joinTable = (table) => {
    const tableId = table.tableId;
    client.send(JSON.stringify({
      tableId,
      type: "tablejoinevent"
    }));
  }

  setupGame = () => {
    const tableId = this.state.currentTable[this.state.TABLE_ID_INDEX];
    client.send(JSON.stringify({
      tableId,
      type: "gamesetupevent"
    }));
  }

  handleCallSubmit = () => {
    const tableId = this.state.currentTable[this.state.TABLE_ID_INDEX];
    const playerPosition = this.state.playerPosition;
    const callDiceQuantity = this.state.formValues.diceQuantity;
    const callDiceValue = this.state.formValues.diceValue;
    const data = {
      tableId,
      playerPosition,
      callDiceQuantity,
      callDiceValue
    };
    client.send(JSON.stringify({
        ...data,
        type: "playercallevent"
    }));

    // Reset form values
    this.setState({
      formValues: { diceQuantity: "",
                    diceValue: "" },
      formErrors: { diceQuantity: "",
                    diceValue: "" },
      formValidity: { diceQuantity: false,
                      diceValue: false }
    });
  }

  handleCapSubmit = () => {
    const tableId = this.state.currentTable[this.state.TABLE_ID_INDEX];
    const data = { tableId };
    client.send(JSON.stringify({
      ...data,
      type: "playercapevent"
    }));

    // Reset form values
    this.setState({
      formValues: { diceQuantity: "",
                    diceValue: "" },
      formErrors: { diceQuantity: "",
                    diceValue: "" },
      formValidity: { diceQuantity: false,
                      diceValue: false }
    });
  }

  handleStartNextRound = () => {
    const tableId = this.state.currentTable[this.state.TABLE_ID_INDEX];
    const data = { tableId };
    client.send(JSON.stringify({
      ...data,
      type: "roundstartevent"
    }));
  }

  componentWillMount() {
    client.onopen = () => {
     console.log('WebSocket Client Connected');
    };
    client.onmessage = (message) => {
      const dataFromServer = JSON.parse(message.data);
      console.log(dataFromServer);
      const stateToChange = {};
      if (dataFromServer.type === "broadcastevent") {
        stateToChange.currentplayers = Object.values(dataFromServer.data.players);
        stateToChange.currentTables = Object.values(dataFromServer.data.tables);
        stateToChange.playerActivity = dataFromServer.data.playerActivity;
      } else if (dataFromServer.type === "tableregisterevent" || 
                 dataFromServer.type === "tablejoinevent") {
        var currentTable = Object.values(dataFromServer.data.currentTable);
        stateToChange.currentTable = currentTable;

        // Only update player position if it is not yet defined
        if (this.state.playerPosition == null) {
          stateToChange.playerPosition = currentTable[this.state.TABLE_CURRENT_GAME_INDEX].players.length-1;
        }
      } else if (dataFromServer.type === "gamesetupevent"  ||
                 dataFromServer.type === "playercallevent") {
        stateToChange.currentTable = Object.values(dataFromServer.data.currentTable);
        stateToChange.gameReady = true;
      } else if (dataFromServer.type === "playercapevent" ) {
        stateToChange.currentTable = Object.values(dataFromServer.data.currentTable);
        stateToChange.revealDice = true;
      } else if (dataFromServer.type === "roundstartevent") {
        stateToChange.revealDice = false;
      } else if (dataFromServer.type === "playerwinevent") {
        stateToChange.currentTable = Object.values(dataFromServer.data.currentTable);
        stateToChange.gameOver = true;
      }
      
      this.setState({
        ...stateToChange
      });
    };
  }

  showLoginSection = () => (
    <div className="account">
      <div className="account__wrapper">
        <div className="account__card">
          <div className="account__profile" id="register_player">
            <Identicon className="account__avatar" size={64} string="randomness" />
            <p className="account__name">Hello, player!</p>
          </div>
          <input name="username" placeholder="Username" ref={(input) => { this.username = input; }} className="form-control" />
          <button type="button" onClick={() => this.addPlayer(true)} className="btn btn-primary account__btn">Register & Create Table</button>
          <button type="button" onClick={() => this.addPlayer(false)} className="btn btn-primary account__btn">Register & Join Table</button>
        </div>
      </div>
    </div>
  )

  showTableRegisterSection = () => (
    <div className="account">
      <div className="account__wrapper">
        <div className="account__card">
          <div className="account__profile">
            <Identicon className="account__avatar" size={64} string="randomness" />
            <p className="account__name">{`Admin: ${this.state.username}`}</p>
          </div>
          <div id="register_fields">
            <input name="tablename" placeholder="Table name" ref={(input) => { this.tablename = input; }} className="form-control" />
            <input type="number" name="numDice" placeholder="Starting umber of dice" ref={(input) => { this.numDice = input; }} className="form-control" />
            <button type="button" onClick={() => this.addTable()} className="btn btn-primary account__btn">Register Table</button>
          </div>
        </div>
      </div>
    </div>
  )

  showTableJoinSection = () => {
    var openTables = [];
    this.state.currentTables.map(table => {
      if (table.status === "open") {
        openTables.push(table);
      }
      return 0;
    });

    console.log("open table **");
    console.log(openTables);

    return (
      <div className="row">
        {openTables.map(table => (
          <div className="col-lg-6 col-md-6 col-s-12 mb-4">
            <div className="card h-100">
              <div className="card">
                <div className="card-body" >
                  <p>{`Table: ${table.tablename}`}</p> 
                  <p>{`Admin: ${table.adminUsername}`}</p>
                  <p>{`Number of Players: ${table.currentGame.players.length}`}</p>
                  <p>{`Number of Dice/Player: ${table.dicePerPlayer}`}</p>
                  <button type="button" onClick={() => this.joinTable(table)} className="btn btn-primary account__btn">Join Table</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  showTableStatus = () => (
    <p>{`Status: Waiting for admin (${this.state.currentTable[this.state.TABLE_ADMIN_USERNAME_INDEX]}) to start game`}</p>
  )

  showTableStartButton = () => (
    <button type="button" onClick={() => this.setupGame()} className="btn btn-primary account__btn">Start Game</button>
  )

  showTableLobby = () => (
    <div className="account">
      <div className="account__wrapper">
        <div className="account__card">
          <div className="account__profile">
            <Identicon className="account__avatar" size={64} string="randomness" />
            <p className="account__name">{`Table Lobby: ${this.state.currentTable[this.state.TABLE_NAME_INDEX]}`}</p>
          </div>
          <p className="account__name">{`Number of Players: ${this.state.currentTable[this.state.TABLE_CURRENT_GAME_INDEX].players.length}`}</p>
          <p type="number" className="account__name">{`Starting dice: ${this.state.currentTable[this.state.TABLE_DICE_PER_PLAYER_INDEX]}`}</p>
          {this.state.tableAdmin ? this.showTableStartButton() : this.showTableStatus()}
        </div>
      </div>
    </div>
  )

  handleChange = ({ target }) => {
    const { formValues } = this.state;
    console.log(target);
    formValues[target.name] = parseInt(target.value);
    this.setState({ formValues });
    this.handleValidation(target);
  };

  handleValidation = target => {
    const { name, value } = target;
    const numValue = parseInt(value); 
    const fieldValidationErrors = this.state.formErrors;
    const validity = this.state.formValidity;
    const previousCall = this.state.currentTable[this.state.TABLE_CURRENT_GAME_INDEX].previousTurn.call;
    if (name === "diceValue") {
      // Validate dice val
      const diceVals = [2,3,4,5,6];
      validity[name] = diceVals.some(diceVal => diceVal === numValue);
      fieldValidationErrors[name] = validity[name]
        ? ""
        : `${name} is required, must be between 2-6`;
      
      // Validate increasing calls
      if ((validity[name]) && (previousCall != null)) {
        var previousCallQuantity = previousCall.diceQuantity
        var currentCallDiceQuantity = this.state.formValues["diceQuantity"];
        var previousCallDiceValue = previousCall.diceValue
        var currentCallDiceValue = numValue

        if (currentCallDiceQuantity === previousCallQuantity) {
          validity[name] = currentCallDiceValue > previousCallDiceValue;
          fieldValidationErrors[name] = validity[name]
            ? ""
            : `${name} must be larger than previous dice value (${previousCallDiceValue})`;
        } 
      }
    } else if (name === "diceQuantity") {
      var floor = 1;
      validity[name] = true;
      var previousCallDiceQuantity = 1;

      if (previousCall != null) {
        previousCallDiceQuantity = previousCall.diceQuantity;
        currentCallDiceValue = this.state.formValues["diceValue"];
        currentCallDiceQuantity = numValue;
        previousCallDiceValue = previousCall.diceValue;

        if (currentCallDiceQuantity < previousCallDiceQuantity) {
          validity[name] = false;
        } else if (currentCallDiceValue <= previousCallDiceValue) {
          floor = previousCallDiceQuantity + 1;
          validity[name] = currentCallDiceQuantity >= floor;
        } else {
          floor = previousCallDiceQuantity;
          validity[name] = currentCallDiceQuantity >= floor;
        }
      }
    
      fieldValidationErrors[name] = validity[name]
        ? ""
        : `${name} must be at least ${floor}`;
    }

    this.setState({
      formErrors: fieldValidationErrors,
      formValidity: validity
    });
  };

  showSubmitCallButton = () => {
    const { formValidity } = this.state;
    var validCall = Object.values(formValidity).every(Boolean)
    if (validCall) {
      return (
        <button
          type="submit"
          className="btn btn-primary btn-block"
          onClick={() => this.handleCallSubmit()}
        >
          Submit Call
        </button>
      )
    } else {
      return null;
    }
  }

  showCapButton = () => {
    var previousCall = this.state.currentTable[this.state.TABLE_CURRENT_GAME_INDEX].previousTurn.call;
    if (previousCall != null) {
      return (
        <button
          type="submit"
          className="btn btn-primary btn-block"
          onClick={() => this.handleCapSubmit()}
        >
          Cap
        </button>
      )
    }
  }

  showCallForm = () => (
    <div>
      <div className="form-group">
        <input
          type="number"
          name="diceQuantity"
          id="callDiceQuantity"
          className={`form-control ${this.state.formErrors.diceQuantity ? "is-invalid" : ""}`}
          placeholder="Dice Quantity"
          onChange={this.handleChange}
          value={this.state.formValues.diceQuantity}
        />
        <input
          type="number"
          name="diceValue"
          id="callDiceValue"
          className={`form-control ${this.state.formErrors.diceValue ? "is-invalid" : ""}`}
          placeholder="Dice Value"
          onChange={this.handleChange}
          value={this.state.formValues.diceValue}
        />
        <div className="invalid-feedback">{this.state.formErrors.diceQuantity}</div>
        <div className="invalid-feedback">{this.state.formErrors.diceValue}</div>
      </div>
      <div>
        {this.showSubmitCallButton()}
        {this.showCapButton()}
      </div>
    </div>
  )

  showStartNextRoundButton = () => (
    <button type="submit" className="btn btn-primary btn-block" onClick={() => this.handleStartNextRound()} >Start Next Round</button>
  )

  showEndOfRoundInfo = () => {
    var capResult = this.state.currentTable[this.state.TABLE_CURRENT_GAME_INDEX].capResult;

    return (
      <div>
        <p>{`Call: ${capResult.call.diceQuantity} ${capResult.call.diceValue}s`}</p>
        <p>{`Actual Amount: ${capResult.correctDiceQuantity}`}</p>
        <p>{`Winner: ${capResult.winnerName}`}</p>
        <p>{`Loser: ${capResult.loserName}`}</p>
        {this.state.tableAdmin ? this.showStartNextRoundButton() : null}
      </div>
    )
  }

  showCurrentRoundInfo = () => {
    var currentGame = this.state.currentTable[this.state.TABLE_CURRENT_GAME_INDEX];

    return (
      <div>
        <div>
          {currentGame.currentTurn.position === this.state.playerPosition ? this.showCallForm() : null}
        </div>
        <div>
          <p>{`Current Player: ${currentGame.players[currentGame.currentTurn.position].username}`}</p>
          {currentGame.previousTurn.call != null ? <p>{`Current Call: ${currentGame.previousTurn.call.diceQuantity} ${currentGame.previousTurn.call.diceValue}s`}</p> : null}
        </div>
      </div>
    )
  }

  showWinner = () => (
    <div>
      <p>{`Winner: ${this.state.currentTable[this.state.TABLE_CURRENT_GAME_INDEX].winnerName}`}</p>
    </div>
  )

  showTable = () => (
    <div className="row">
      {this.state.currentTable[this.state.TABLE_CURRENT_GAME_INDEX].players.map(player => (
        <div className="col-lg-6 col-md-6 col-s-12 mb-4">
          <div className="card h-100">
            <div className="card">
              <div className="card-body" >
                <PlayerCup revealDice={this.state.revealDice} 
                           call={this.state.currentTable[this.state.TABLE_CURRENT_GAME_INDEX].previousTurn.call}
                           player={player} 
                           myPosition={this.state.playerPosition}/>
              </div>
            </div>
          </div>
        </div>
      ))}
      {this.state.revealDice ? this.showEndOfRoundInfo() : (this.state.gameOver ? this.showWinner() : this.showCurrentRoundInfo())}
    </div>
  )

  render() {
    const {
      username,
      tableAdmin,
      currentTable,
      gameReady ,
    } = this.state;
    console.log(this.state);
    return (
      <React.Fragment>
        <Navbar color="light" light>
          <NavbarBrand href="/">Stags Liars Dice</NavbarBrand>
        </Navbar>
        <div className="container-fluid">
          {username ? (currentTable ? (gameReady ? this.showTable() : this.showTableLobby()) : (tableAdmin ? 
            this.showTableRegisterSection() : this.showTableJoinSection())) : this.showLoginSection()}
        </div>
      </React.Fragment>
    );
  }
}

export default App;
