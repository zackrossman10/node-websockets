import React from "react";
import { NotificationManager } from "react-notifications";
import { db } from "../firebase";
import TableMenu from "./TableMenu"


class RegisterUser extends React.Component {
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
      uid: 0,
      username: "",
    };
  }

  addUser = () => {
    console.log(this.state.formValues.name);
    const uid = new Date().getTime()
    const data = {
      ...this.state.formValues,
    };
    db.collection("users")
      .doc(uid.toString())
      .set(data)
      .then(() => {
        NotificationManager.success("A new temporary user has been added", "Success");
        this.setState({ registerSuccess: true, uid: uid, username: this.state.formValues.name });
      })
      .catch(error => {
        NotificationManager.error(error.message, "Create user failed");
        this.setState({ isSubmitting: false });
      });
  };

  handleSubmit = event => {
    event.preventDefault();
    this.setState({ isSubmitting: true });
    const { formValues, formValidity } = this.state;
    if (Object.values(formValidity).every(Boolean)) {
      this.addUser();
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
    const { formValues, formErrors, isSubmitting, registerSuccess} = this.state;
    return (
      <div>
        <div hidden={registerSuccess}>
          <div className="row mb-5">
            <div className="col-lg-12 text-center">
              <h1 className="mt-5">Register New User</h1>
            </div>
          </div>
          <div className="row">
            <div className="col-lg-12">
              <form onSubmit={this.handleSubmit}>
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    name="name"
                    className={`form-control ${
                      formErrors.name ? "is-invalid" : ""
                    }`}
                    placeholder="Enter username"
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
        <div hidden={!registerSuccess}>
           <TableMenu uid={`${this.state.uid}`} username={`${this.state.username}`}/>
        </div>
      </div>
    );
  }
}

export default RegisterUser;
