import React from "react";
import ReactDOM from "react-dom";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";
import RegisterTable from "./RegisterTable"
import JoinTable from "./JoinTable"

const TableMenu = (props) => {
  const [hideOptions, setHideOptions] = React.useState(false)
  const onClick = () => setHideOptions(true)
  return (
    <div>
      <Router>
        <div className="row mb-5" hidden={hideOptions}>
          <div className="col-lg-12 text-center">
            <h1 className="mt-5">Table Menu</h1>
            <p>{`Username: ${props.username}`}</p> 
          </div>
        </div>
        <div>
          <Link 
            to={`/jointable/${props.username}`}
            className="btn btn-primary btn-block"
            onClick={onClick}
            hidden={hideOptions}>
            <p style={linkStyle}>Join Table</p>
          </Link>
          <Link 
            to={`/registertable/${props.username}`}
            className="btn btn-primary btn-block"
            onClick={onClick}
            hidden={hideOptions}>
            <p style={linkStyle}>Register Table</p>
          </Link>
          <Switch>
              <Route path={"/jointable/:handle"}>
                <JoinTable uid={`${props.uid}`} username={`${props.username}`}/>
              </Route>
              <Route path="/registertable/:handle">
                <RegisterTable adminId={`${props.uid}`} adminName={`${props.username}`}/>
              </Route>
          </Switch>
        </div>
      </Router>
    </div>
  )
}

const linkStyle = {
  marginRight: 15
}

export default TableMenu;