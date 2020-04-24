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
  renderDie(i) {
    return <Die value={i} />;
  }

  render() {
    const status = 'Next player: X';

    return (
      <div>
        <div className="status">{status}</div>
        <div className="board-row">
          {this.renderDie(0)}
          {this.renderDie(1)}
          {this.renderDie(2)}
        </div>
        <div className="board-row">
          {this.renderDie(3)}
          {this.renderDie(4)}
          {this.renderDie(5)}
        </div>
        <div className="board-row">
          {this.renderDie(6)}
          {this.renderDie(7)}
          {this.renderDie(8)}
        </div>
      </div>
    );
  }
}

class Game extends React.Component {
  render() {
    return (
      <div className="game">
        <div className="game-board">
          <PlayerCup />
        </div>
        <div className="game-info">
          <div>{/* status */}</div>
          <ol>{/* TODO */}</ol>
        </div>
      </div>
    );
  }
}

export default Game;
