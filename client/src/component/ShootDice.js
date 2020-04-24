import React from "react";
import ReactDOM from "react-dom";
import { db } from "../firebase";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link, 
  withRouter,
} from "react-router-dom";

class ShootDice extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tableId: this.props.match.params.tid,
      userId: this.props.match.params.uid,
      tableInfo: [],
      startSuccess: false,
    };
  }

  componentDidMount() {
    let currentComponent = this
    var docRef = db.collection("tables").doc(this.state.tableId);
    docRef.get().then(function(doc) {
        if (doc.exists) {
            console.log("Table data:", doc.data());
            currentComponent.setState({tableInfo: doc.data()});
        } else {
            // doc.data() will be undefined in this case
            console.log("No such table!");
        }
    }).catch(function(error) {
        console.log("Error getting table:", error);
    });
  }

  render() {
    const tableInfo = this.state.tableInfo;
    console.log("tableInfo");
    console.log(tableInfo);
    return (
      <Router>
        <p>Table Lobby</p>
        <div className="row">
          <div className="col-lg-6 col-md-6 col-s-12 mb-4">
            <div className="card h-100">
              <div className="card">
                <div className="card-body">
                  <div hidden={this.state.startSuccess}>
                    <p>{`Table: ${tableInfo.name}`}</p> 
                    <p>{`Username: ${this.state.userId}`}</p> 
                    <p>{`Number of Players: ${tableInfo.numPlayers}`}</p>
                    <p>{`Number of Dice: ${tableInfo.numDice}`}</p>
                  </div>
                  <Link 
                    to={`/tablelobby/1`}
                    className="btn btn-primary btn-block"
                    onClick={this.handleStart}>
                    <p style={linkStyle}>Start</p>
                  </Link>
                  <Switch>
                    <Route path={"/ShootDice/:tid"}>
                    </Route>
                  </Switch>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Router>
    )
  }
}

const linkStyle = {
  marginRight: 15
}

export default withRouter(ShootDice);