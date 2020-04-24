import React from "react";
import { NotificationManager } from "react-notifications";
import { db } from "../firebase";
import {
  BrowserRouter as Router,
  Route,
  withRouter,
  Redirect,
  Switch,
} from "react-router-dom";
import TableLobby from "./TableLobby"

class RegisterTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      formValues: {
        name: "",
      },
      formErrors: {
        name: "",
      },
      formValidity: {
        name: false,
      },
      isSubmitting: false,
      registerSuccess: false,
      tid: 0,
      tableName: "",
    };
  }

  addTable = () => {
    const tid = new Date().getTime()
    const data = {
      ...this.state.formValues,
      adminId: this.props.adminId,
      adminName: this.props.adminName,
    };
    console.log(this.props)
    console.log(data);
    db.collection("tables")
      .doc(tid.toString())
      .set(data)
      .then(() => {
        NotificationManager.success("A new table has been created", "Success");
        this.setState({ registerSuccess: true, tid: tid, tableName: this.state.formValues.name});
      })
      .catch(error => {
        NotificationManager.error(error.message, "Create player failed");
        this.setState({ isSubmitting: false });
      });
      return tid;
  };

  submitForm = event => {

    event.preventDefault();
    this.setState({ isSubmitting: true });
    const { formValues, formValidity } = this.state;
    if (Object.values(formValidity).every(Boolean)) {
      this.addTable();
    } else {
      for (let key in formValues) {
        let target = {
          name: key,
          value: formValues[key]
        };
        this.handleValidation(target);
      }
      NotificationManager.error(
        "Please check on the validation message below form fields",
        "Validation error"
      );
      this.setState({ isSubmitting: false });
    }
  };

  handleChange = ({ target }) => {
    const { formValues } = this.state;
    formValues[target.name] = target.value;
    this.setState({ formValues });
    this.handleValidation(target);
  };

  handleValidation = target => {
    const { name, value } = target;
    const fieldValidationErrors = this.state.formErrors;
    const validity = this.state.formValidity;
    const isImage = name === "image";

    if (!isImage) {
      validity[name] = value.length > 0;
      fieldValidationErrors[name] = validity[name]
        ? ""
        : `${name} is required and cannot be empty`;
    }

    this.setState({
      formErrors: fieldValidationErrors,
      formValidity: validity
    });
  };

  render() {
    const { formValues, formErrors, isSubmitting, registerSuccess, tid} = this.state;
    if (registerSuccess) {
      return (
        <Router>
          <Redirect to={"/tablelobby/" + tid + "/" + this.props.adminId}/>
           <Switch>
              <Route path={"/tablelobby/:tid/:uid"}>
                      <TableLobby username={`${this.props.username}`}/>
              </Route>
          </Switch>
        </Router>
      );
    } else {
      return (
      <Router> 
        <div>
          <div>
            <div className="row mb-5">
              <div className="col-lg-12 text-center">
                <h1 className="mt-5">Register New Table</h1>
                <p> {`Username: ${this.props.adminName}`} </p> 
              </div>
            </div>
            <div className="row">
              <div className="col-lg-12">
                <form onSubmit={this.submitForm} >
                  <div className="form-group">
                    <label>Table Name</label>
                    <input
                      type="text"
                      name="name"
                      className={`form-control ${
                        formErrors.name ? "is-invalid" : ""
                      }`}
                      placeholder="Enter table name"
                      onChange={this.handleChange}
                      value={formValues.name}
                    />
                    <div className="invalid-feedback">{formErrors.name}</div>
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary btn-block"
                  >
                    {isSubmitting ? "Submitted" : "Submit"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </Router>
    );
  }
  }
}

export default withRouter(RegisterTable);
