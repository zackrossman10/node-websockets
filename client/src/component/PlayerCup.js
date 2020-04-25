import React, { Component } from 'react';


class Die extends React.Component {
  render() {
    return (
      <button className="square">
        {this.props.value}
      </button>
    );
  }
}

class PlayerCup extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      diceVals: this.props.player.diceVals
    }
  }

  renderDie(i) {
    return <Die value={i} />;
  }

  render() {
    // Stringify player's dice vals
    this.state.diceVals = this.state.diceVals.map((val) => val.toString());

    // Fill in lost dice values with "X"
    while(this.state.diceVals.length < 6) {
      this.state.diceVals.push("X");
    }

    return (
      <div>
        <div className="status">Status</div>
        <div className="board-row">
          {this.renderDie(this.state.diceVals[0])}
          {this.renderDie(this.state.diceVals[1])}
          {this.renderDie(this.state.diceVals[2])}
        </div>
        <div className="board-row">
          {this.renderDie(this.state.diceVals[3])}
          {this.renderDie(this.state.diceVals[4])}
          {this.renderDie(this.state.diceVals[5])}
        </div>
      </div>
    );
  }
}

export default PlayerCup;
