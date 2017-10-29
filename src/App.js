import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import io from 'socket.io-client';

import './Card.css';
import CardArr from './Cards.js';
import Card from './Card.jsx';

var log = function log(...m) {
    console.log('\n' + Date().toString() + ':\n', m);
};
var err = function err(...m) {
    console.error('\n' + Date().toString() + ':\n', m);
};

log(CardArr);

const socket = io('http://localhost:3000');

socket.on('err', err);
socket.on('log', log);

class FormLogin extends Component {
    constructor(props) {
        super(props);
        this.state = {
            password: ''
        };

        this.handleUsernameChange = this.handleUsernameChange.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleUsernameChange(event) {
        this.props.handleUsernameChange(event.target.value);
    }

    handleInputChange(event) {
        const target = event.target;
        const value = target.value;
        const name = target.name;

        this.setState({
            [name]: value
        });
    }

    handleSubmit(event) {
        event.preventDefault();

        const username = this.props.username;
        const password = this.state.password;

        if (username && password)
            this.props.handleLogin(password);
    }

    render() {
        const username = this.props.username;

        return (
            <form onSubmit={this.handleSubmit}>
                <label>
                    Username:
                    <input name="username" type="text" value={username} onChange={this.handleUsernameChange} />
                </label>
                <label>
                    Password:
                    <input name="password" type="password" value={this.state.password} onChange={this.handleInputChange} />
                </label>
                <input type="submit" value="Log in" />
            </form>
        );
    }
}

class Login extends Component {
    render() {
        const username = this.props.username;

        return (
            <div className="App-login">
                <p className="App-intro">
                    A cool new multiplayer browsergame, based on NodeJS and socket.io
            </p>
                <FormLogin username={username} handleUsernameChange={this.props.handleUsernameChange} handleLogin={this.props.handleLogin} />
            </div>
        );
    }
}

class MainMenu extends Component {
    constructor(props) {
        super(props);
        this.state = {
            getUsername: this.props.username
        };

        this.handleLogout = this.handleLogout.bind(this);
        this.handleStateChange = this.handleStateChange.bind(this);

        this.getUl = this.getUl.bind(this);
        this.handleGetUsernameChange = this.handleGetUsernameChange.bind(this);
    }

    getUl(event, ul) {
        event.preventDefault();

        socket.emit('getUserlist', ul);
    }

    handleGetUsernameChange(event) {
        this.setState({
            getUsername: event.target.value
        });
    }

    getUser(event, un) {
        event.preventDefault();

        socket.emit('getUser', un);
    }

    handleLogout(event) {
        event.preventDefault();

        this.props.handleLogout();
    }

    handleStateChange(event) {
        event.preventDefault();

        this.props.handleStateChange();
    }

    render() {
        const username = this.props.username;
        const state = this.props.state;
        const getUsername = this.state.getUsername;
        const stateTextArr = {
            'lobby': 'Start search',
            'searching': 'Stop search',
            'waiting': 'Stop search',
            'inGame': 'Give up',
            'giveUp': 'You gave up :/',
            'results': 'Back to lobby'
        };
        const stateText = stateTextArr[state] || 'Current state: ' + state;

        return (
            <div className="App-mainMenu">
                <p>Welcome back, {username}! <a href="" onClick={this.handleLogout}>Log out</a></p>
                <br />
                <a href="#changeState" onClick={this.handleStateChange}>{stateText}</a>
                <br />
                <br />
                <a href="#getUserlist.eo" onClick={(e) => this.getUl(e, 'eo')}>get ul.eo</a>&nbsp;
                <a href="#getUserlist.o" onClick={(e) => this.getUl(e, 'o')}>get ul.o</a>&nbsp;
                <a href="#getUserlist.g" onClick={(e) => this.getUl(e, 'g')}>get ul.g</a>&nbsp;
                <a href="#getUserlist.gids" onClick={(e) => this.getUl(e, 'gids')}>get ul.gids</a>
                <br />
                <br />
                <input type="text" value={getUsername} onChange={this.handleGetUsernameChange} />&nbsp;
                <a href="#getUser" onClick={(e) => this.getUser(e, getUsername)}>get user</a>
            </div>
        );
    }
}

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            username: '',
            isLoggedIn: false,
            state: 'lobby'
        };

        this.handleUsernameChange = this.handleUsernameChange.bind(this);
        this.handleLogin = this.handleLogin.bind(this);
        this.handleLogout = this.handleLogout.bind(this);
        this.handleStateChange = this.handleStateChange.bind(this);

        const dis = this;
        socket.on('userlist', function (ulN, ul) {
            log('userlist >>', ulN, ul);
        });
        socket.on('user', function (unN, un) {
            log('user >>', unN, un);
        });
        socket.on('state', function (state) {
            log('state >>', state);
            dis.setState({
                state: state
            });
        });

        socket.on('loginProcessed', function (err) {
            log('loginProcessed >>', err);

            dis.setState({
                isLoggedIn: (err.length === 0 ? true : false)
            });
        });

        socket.on('playerJoined', function (data) {
            log('playerJoined >>', data);
            socket.emit('startGame', data);
        });
        socket.on('gameStarted', function (game) {
            log('gameStarted >>', game);
            socket.emit('gameStarted');
        });
        socket.on('gameEnded', function (game) {
            log('gameEnded >>', game);
            socket.emit('gameEnded');
        });

        setInterval(function () {
            socket.emit('getState');
        }, 5000);
    }

    handleUsernameChange(username) {
        this.setState({
            username: username
        });
    }

    handleLogin(password) {
        const state = this.state;

        log('logging in >> ', state, password);

        socket.emit('logIn', {
            username: state.username,
            password: password
        });
    }

    handleLogout() {
        this.setState({
            isLoggedIn: false
        });

        socket.emit('logOut');
    }

    handleStateChange() {
        const state = this.state.state;
        const state2nstateArr = {
            'lobby': 'searching',
            'searching': 'lobby',
            'waiting': 'lobby',
            'inGame': 'giveUp',
            'giveUp': 'results',
            'results': 'lobby'
        };
        const nstate = state2nstateArr[state];

        socket.emit('switchState', nstate);
    }

    render() {
        const isLoggedIn = this.state.isLoggedIn;
        const username = this.state.username;
        const state = this.state.state;

        let CurScreen = null;
        if (isLoggedIn)
            CurScreen = <MainMenu username={username} state={state} handleLogout={this.handleLogout} handleStateChange={this.handleStateChange} />;
        else
            CurScreen = <Login username={username} handleUsernameChange={this.handleUsernameChange} handleLogin={this.handleLogin} />;

        return (
            <div className="App">
                <header className="App-header">
                    {/* <img src={logo} className="App-logo" alt="logo" /> */}
                    <h1 className="App-title">Da_Cards</h1>
                </header>
                {CurScreen}
                <div style={{backgroundColor: '#424242', padding: '0.25rem'}}>
                    <Card fOb="front" type="King" style={{left: '50%', transform: 'translateX(-50%)'}} />
                    <Card fOb="front" type="Queen" style={{left: '50%', transform: 'translateX(-50%)'}} />
                    <Card fOb="back" type="Queen" style={{left: '50%', transform: 'translateX(-50%)'}} />
                </div>
            </div>
        );
    }
}

export default App;
