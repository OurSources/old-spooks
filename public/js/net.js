/*global localStorage*/
var Spooks = Spooks || {};

Spooks.net = {};

Spooks.net.users = {};

Spooks.net.stages = { login: "login", play: "play" };

Spooks.net.connected = false;

Spooks.net.init = function init() {
	this.stage = this.stages.login;

	if (!("WebSocket" in window)) {
		if (!("MozWebSocket" in window)) {
			var error = "You're browser doesn't supports WebSockets. Spooks uses & needs WebSockets.";
			alert(error);
			throw new Error(error);
		} else {
			window.WebSocket = window.MozWebSocket;
		}
	}

	this.packetHandlers = {};
	this.addPacketHandlers();

	this.connect();
	
	setInterval(function() {
		if (this.connected)
			this.ws.send(JSON.stringify({
				type: "ping",
				timestamp: +new Date
			}));
	}.bind(this), 10000);
}.bind(Spooks.net);

Spooks.net.connect = function connect() {
	this.ws = new WebSocket(Spooks.options.server + ":" + Spooks.options.port);

	this.ws.onopen = function onopen() {
		this.connected = true;
		this.stage = this.stages.login;
		console.log("Connected to server.");
		if (localStorage.getItem("username") && localStorage.getItem("loginToken")) {
			this.ws.send(JSON.stringify({
				type: "token",
				username: localStorage.getItem("username"),
				token: localStorage.getItem("loginToken")
			}));
		}
	}.bind(this);

	this.ws.onclose = function onclose(e) {
		this.connected = false;
		this.stage = this.stages.connect;
		console.log(`Disconnected from server. Error code ${e.code}, in text "${e.reason}". Tryna reconnect.`);
		if (e.code != 1003) this.connect();
	}.bind(this);

	this.ws.onmessage = function onmessage(message) {
		message = JSON.parse(message.data);
		if (message.type in this.packetHandlers) {
			this.packetHandlers[message.type](message);
		} else {
			throw new Error(alert(`Your client might be outdated. It recieved a packet that it didn't knew about. ("${message.type}")`));
		}
	}.bind(Spooks.net);
}.bind(Spooks.net);

Spooks.net.addPacketHandler = function addPacketHandler(name, handler) {
	this.packetHandlers[name] = handler;
}.bind(Spooks.net);

Spooks.net.addPacketHandlers = function addPacketHandlers() {
	this.addPacketHandler("chunks", function handleChunks(packet) {
		var chunks = packet.chunks;
		for (var pos in chunks) Spooks.chunks[pos].setData(chunks[pos]);
	});
	this.addPacketHandler("login", function handleStatusPacket(packet) {
		if (packet.success) {
			if (packet.token) {
				try {
					localStorage.setItem("username", packet.username);
					localStorage.setItem("loginToken", packet.token);
				} catch(e) {
					console.warn(e);
				}
			}
			this.username = packet.username;
			this.stage = this.stages.play;
			Spooks.ui.hideLogin();
		} else {
			Spooks.ui.loginError(packet.error);
		}
	}.bind(this));
	this.addPacketHandler("leave", function handleLeavePacket(packet) {
		this.users[packet.name] = {};
		console.log(packet.name + " has left.");//for now
	}.bind(this));
	this.addPacketHandler("join", function handleJoinPacket(packet) {
		this.users[packet.username] = {};
		console.log(packet.username + " has joined.");//for now
	}.bind(this));
	this.addPacketHandler("pong", function () {});
}.bind(Spooks.net);

Spooks.net.guestLogin = function guestLogin(token) {
	this.ws.send(JSON.stringify({
		type: "guest",
		token: token
	}));
}.bind(Spooks.net);

Spooks.net.register = function register(username, password, token) {
	this.ws.send(JSON.stringify({
		type: "register",
		username: username,
		password: password,
		token: token
	}));
}.bind(Spooks.net);

Spooks.net.login = function login(username, password) {
	this.ws.send(JSON.stringify({
		type: "login",
		username: username,
		password: password
	}));
}.bind(Spooks.net);

Spooks.net.requestChunks = function requestChunks(chunks) {
	this.ws.send(JSON.stringify({
		type: "getChunks",
		chunks: chunks
	}));
}.bind(Spooks.net);