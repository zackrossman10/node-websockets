import React from "react";
import { db } from "../firebase";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";
import TableLobby from "./TableLobby";

class JoinTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tables: [],
      joinSuccess: false,
    };
  }

  appendId(tid, data) {
  	return {tid, ...data}
  }

  componentDidMount() {
    db.collection("tables")
      .get()
      .then(querySnapshot => {
        const data = querySnapshot.docs.map(doc => this.appendId(doc.id, doc.data()));
        console.log(data);
        this.setState({ tables: data });
      });
  }

  handleJoin = event => {
  	this.setState({joinSuccess: true});
  }

  render() {
    const { tables } = this.state;
    console.log(tables);
    return (
	    <Router>
	      <div className="row" hidden={this.state.joinSuccess}>
	        {tables.map(table => (
	          <div className="col-lg-6 col-md-6 col-s-12 mb-4">
	            <div className="card h-100">
	              <div className="card">
	                <div className="card-body" >
	                  <div >
				          <p>{`Table: ${table.name}`}</p> 
				          <p>{`Number of Players: ${table.numPlayers}`}</p>
				          <p>{`Number of Dice/Player: ${table.numDice}`}</p>
			          </div>
	                  <Link 
			            to={`/tablelobby/${table.tid}/${this.props.uid}`}
			            className="btn btn-primary btn-block"
			            onClick={this.handleJoin}
			            hidden={this.state.joinSuccess}>
			          	<p style={linkStyle}>Join Table</p>
			          </Link>
	                </div>
	              </div>
	            </div>
	          </div>
	        ))}
	      </div>
	      <Switch>
	        <Route path={"/tablelobby/:tid/:uid"}>
	          <TableLobby username={`${this.props.username}`}/>
	        </Route>
	      </Switch>
	    </Router>
    );
  }
}

const linkStyle = {
  marginRight: 15
}

export default JoinTable;