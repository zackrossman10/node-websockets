import React, { Component } from 'react';
import { w3cwebsocket as W3CWebSocket } from "websocket";
import Identicon from 'react-identicons';
import {
  Navbar,
  NavbarBrand,
  UncontrolledTooltip
} from 'reactstrap';
import Editor from 'react-medium-editor';
import 'medium-editor/dist/css/medium-editor.css';
import 'medium-editor/dist/css/themes/default.css';
import "bootstrap/dist/css/bootstrap.css";
import './App.css';
import Game from "./component/Game.js";

const client = new W3CWebSocket('ws://127.0.0.1:8000');
const contentDefaultMessage = "Start writing your document here";



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

      TABLE_ID_INDEX: 0,
      TABLE_NAME_INDEX: 1,
      TABLE_DICE_PER_PLAYER_INDEX: 2,
      TABLE_ADMIN_ID_INDEX: 3,
      TABLE_ADMIN_USERNAME_INDEX: 4,
      TABLE_CURRENT_GAME_INDEX: 5
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

  startGame = () => {
    return(
      <Game />
    )
  }

 /* When content changes, we send the
 current content of the editor to the server. */
 onEditorStateChange = (text) => {
   client.send(JSON.stringify({
     type: "contentchange",
     username: this.state.username,
     content: text
   }));
 };

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
       stateToChange.currentTable = Object.values(dataFromServer.data.currentTable);
       stateToChange.playerPosition = Object.values(dataFromServer.data.currentTable.currentGame.players.length)
     } else if (dataFromServer.type === "gamesetupevent") {
      stateToChange.currentTable = Object.values(dataFromServer.data.currentTable);
      stateToChange.gameReady = true;
     } else if (dataFromServer.type )
     console.log(stateToChange);
     this.setState({
       ...stateToChange
     });
   };
 }

  showLoginSection = () => (
    <div className="account">
      <div className="account__wrapper">
        <div className="account__card">
          <div className="account__profile">
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
          <input name="tablename" placeholder="Table name" ref={(input) => { this.tablename = input; }} className="form-control" />
          <input name="numDice" placeholder="Starting umber of dice" ref={(input) => { this.numDice = input; }} className="form-control" />
          <button type="button" onClick={() => this.addTable()} className="btn btn-primary account__btn">Register Table</button>
        </div>
      </div>
    </div>
  )

  showTableJoinSection = () => (
    <div className="row">
      {this.state.currentTables.map(table => (
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
          <p className="account__name">{`Starting dice: ${this.state.currentTable[this.state.TABLE_DICE_PER_PLAYER_INDEX]}`}</p>
          {this.state.tableAdmin ? this.showTableStartButton() : this.showTableStatus()}
        </div>
      </div>
    </div>
  )

  showTable = () => (
    <Game />
  )

  render() {
    const {
      currentTables,
      username,
      tableAdmin,
      currentTable,
      gameReady  
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
