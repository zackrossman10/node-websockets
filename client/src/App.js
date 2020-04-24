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
import './App.css';

const client = new W3CWebSocket('ws://127.0.0.1:8000');
const contentDefaultMessage = "Start writing your document here";



class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentplayers: [],
      currenttables: [],
      playeractivity: [],
      username: null,
      tablename: null,
      tableid: null,
      tableadmin: null,
      text: '',
      currenttable: null,
      
      NAME_INDEX: 0,
      NUM_PLAYERS_INDEX: 1,
      DICE_PER_PLAYER_INDEX: 2
    };
  }

  addPlayer = (registertable) => {
    const username = this.username.value;
    const tableadmin = registertable;
    if (username.trim()) {
      const data = {
        username,
        tableadmin
      };
      console.log(data);
      this.setState({
        ...data
      }, () => {
        client.send(JSON.stringify({
          ...data,
          type: "playerevent"
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
    const numdice = this.numdice.value;
    const tableid = this.getUniqueID();
    if (tablename.trim()) {
      const data = {
        tableid,
        tablename,
        numdice
      };
      console.log(data);
      this.setState({
        ...data
      }, () => {
        client.send(JSON.stringify({
          ...data,
          type: "tableevent"
        }));
      });
    }
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
     if (dataFromServer.type === "playerevent") {
       stateToChange.currentplayers = Object.values(dataFromServer.data.players);
     } else if (dataFromServer.type === "tableevent") {
       stateToChange.currenttables = Object.values(dataFromServer.data.tables);
       stateToChange.currenttable = Object.values(dataFromServer.data.currentTable);
     } else if (dataFromServer.type === "contentchange") {
       stateToChange.text = dataFromServer.data.editorContent || contentDefaultMessage;
     }
     stateToChange.playerActivity = dataFromServer.data.playerActivity;
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
            <p className="account__name">{`Admin ${this.state.username}`}</p>
          </div>
          <input name="tablename" placeholder="Table name" ref={(input) => { this.tablename = input; }} className="form-control" />
          <input name="numdice" placeholder="Starting umber of dice" ref={(input) => { this.numdice = input; }} className="form-control" />
          <button type="button" onClick={() => this.addTable()} className="btn btn-primary account__btn">Register Table</button>
        </div>
      </div>
    </div>
  )

  showTableJoinSection = () => (
    <div className="row">
      {this.state.currenttables.map(table => (
        <div className="col-lg-6 col-md-6 col-s-12 mb-4">
          <div className="card h-100">
            <div className="card">
              <div className="card-body" >
                <div>
              <p>{`Table: ${table}`}</p> 
              <p>{`Number of Players: ${table.numPlayers}`}</p>
              <p>{`Number of Dice/Player: ${table.numdice}`}</p>
              </div>
                <p> Join Table </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  showTableLobby = () => (
    <div className="account">
      <div className="account__wrapper">
        <div className="account__card">
          <div className="account__profile">
            <Identicon className="account__avatar" size={64} string="randomness" />
            <p className="account__name">{`Table Lobby: ${this.state.currenttable[this.state.NAME_INDEX]}`}</p>
          </div>
          <p className="account__name">{`Number of Players: ${this.state.currenttable[this.state.NUM_PLAYERS_INDEX]}`}</p>
          <p className="account__name">{`Starting dice: ${this.state.currenttable[this.state.DICE_PER_PLAYER_INDEX]}`}</p>
        </div>
      </div>
    </div>
  )

  render() {
    const {
      currenttables,
      username,
      tableadmin,
      tablename,
      currenttable    
    } = this.state;
    console.log(this.state);
    return (
      <React.Fragment>
        <Navbar color="light" light>
          <NavbarBrand href="/">Stags Liars Dice</NavbarBrand>
        </Navbar>
        <div className="container-fluid">
          {username ? (currenttable ? this.showTableLobby() : (tableadmin ? 
            this.showTableRegisterSection() : this.showTableJoinSection())) : this.showLoginSection()}
        </div>
      </React.Fragment>
    );
  }
}

export default App;
