import React from "react";
import { db } from "../firebase";
class SavedList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      games: []
    };
  }

  componentDidMount() {
    db.collection("tables")
      .get()
      .then(querySnapshot => {
        const data = querySnapshot.docs.map(doc => doc.data());
        console.log(data);
        this.setState({ games: data });
      });
  }

  render() {
    const { games } = this.state;
    return (
      <div className="row">
        {games.map(game => (
          <div key={game.gid} className="col-lg-6 col-md-6 col-s-12 mb-4">
            <div className="card h-100">
              <div className="card">
                <div className="card-body">
                  <h5>{game.name}</h5>
                  <h5>{game.num_players}</h5>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
}

export default SavedList;
