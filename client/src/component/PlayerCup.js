import React from 'react';

class Die extends React.Component {
  render() {
    if (this.props.highlight) {
      return (
        <button className="square" style={highlightStyle}>
          {this.props.value}
        </button>
      );
    } else {
      return (
        <button className="square">
          {this.props.value}
        </button>
      );
    }
  }
}

class PlayerCup extends React.Component {

  renderDie(displayVal) {

    if (displayVal == null) {
      return null;
    } else if (this.props.myPosition !== this.props.player.playerPosition && !this.props.revealDice) {
      return <Die value={"?"} highlight={false}/>;
    } else if (this.props.revealDice && (this.props.call != null && 
              (parseInt(displayVal) === this.props.call.diceValue || parseInt(displayVal) === 1))) {
      // Highlight dice pertaining to the previous call
      return <Die value={displayVal} highlight={true}/>;
    } else {
      return <Die value={displayVal} highlight={false}/>;
    }
  }

  render() {
    // Stringify player's dice vals
    var diceVals = this.props.player.diceVals.map((val) => val.toString());

    // Fill in lost dice values with "X"
    while(diceVals.length < 6) {
      diceVals.push(null);
    }

    return (
      <div>
        <div className="status">{this.props.player.username}</div>
        <div className="board-row">
          {this.renderDie(diceVals[0])}
          {this.renderDie(diceVals[1])}
          {this.renderDie(diceVals[2])}
        </div>
        <div className="board-row">
          {this.renderDie(diceVals[3])}
          {this.renderDie(diceVals[4])}
          {this.renderDie(diceVals[5])}
        </div>
      </div>
    );
  }
}

const highlightStyle = {
  backgroundColor: "#00cc00",
};

export default PlayerCup;
