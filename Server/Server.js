"use strict";

const UserStorage = require("./UserStorage.js"),
      map         = require("./data/map.json"),
	  querystring = require("querystring"),
	  https       = require("https"),
	  fs          = require("fs"),
	  WebSocket   = require("ws"),

	  userStorage = new UserStorage(),
	  reCaptchaKey = fs.readFileSync("./data/secret.key", "utf8"),
	  Server = new WebSocket.Server({ port: 8081 }),
	  STAGES = { LOGIN: "login", PLAY: "play" };
	  
function verifyCaptcha(token, callback) {
	var post_data = querystring.stringify({
		secret: reCaptchaKey,
		response: token
	});
	var req = https.request({
		host: "www.google.com",
		port: "443",
		path: "/recaptcha/api/siteverify",
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			"Content-Length": Buffer.byteLength(post_data)
		}
	}, function(res) {
		res.setEncoding("utf8");
		res.on("data", function (chunk) {
			callback(JSON.parse(chunk).success);//do stuff in callback
		});
	});
	req.write(post_data);
	req.end();
}

const packetHandlers = (function() {
	let handlers = {};
	for (var stage in STAGES)
		handlers[STAGES[stage]] = [];
	function packet(stage, name, handler) {
		handlers[stage][name] = handler;
	}
	packet(STAGES.LOGIN, "token", function handleToken(client, packet) {
		var check = userStorage.checkToken(packet.username, packet.token);
		if (Array.isArray(check))
			return client.send({
				type: "login",
				success: false,
				error: check[0]
			});
		client.send({
			type: "login",
			success: true,
			username: packet.username,
			token: userStorage.updateToken(packet.username).value
		});
		client.stage = STAGES.PLAY;
		client.username = packet.username;
		client.guest = false;
		Server.broadcastJoin(packet.username);
	});
	packet(STAGES.LOGIN, "login", function handleLogin(client, packet) {
		if ((typeof packet.username !== "string") || (!packet.username.length))
			return client.send({
				type: "login",
				success: false,
				error: "No username?"
			});
		if (!userStorage.isRegistered(packet.username))
			return client.send({
				type: "login",
				success: false,
				error: "Not registered."
			});
		if ((typeof packet.password !== "string") || (!packet.password.length))
			return client.send({
				type: "login",
				success: false,
				error: "No password?"
			});
		userStorage.loginAsync(packet.username, packet.password, function (err, same) {
			if (err) {
				console.error(err);
				return client.send({
					type: "login",
					success: false,
					error: "An internal error occurred."
				});
			}
			if (!same)
				return client.send({
					type: "login",
					success: false,
					error: "Wrong password."
				});
			var name = packet.username.toLowerCase(),
				token = userStorage.data[name].token = userStorage.mkToken();
			client.send({
				type: "login",
				success: true,
				username: name,
				token: token.value
			});
			
			client.stage = STAGES.PLAY;
			client.username = name;
			client.guest = false;
			users[name] = client;
			Server.broadcastJoin(packet.username);
		});
	});
	packet(STAGES.LOGIN, "register", function handleRegister(client, packet) {
		if ((typeof packet.username !== "string") || (!packet.username.length))
			return client.send({
				type: "login",
				success: false,
				error: "No username?"
			});
		if ((typeof packet.token !== "string") || (!packet.token.length))
			return client.send({
				type: "login",
				success: false,
				error: "No captcha?"
			});
		var username = packet.username.toLowerCase();
		if (username.match(/^guest-[0-9]{1,9}$/g)) {
			return client.send({
				type: "login",
				success: false,
				error: "Username denied."
			});
		}
		if (userStorage.isRegistered(username))
			return client.send({
				type: "login",
				success: false,
				error: "Already registered."
			});
		if ((typeof packet.password !== "string") || (!packet.password.length))
			return client.send({
				type: "login",
				success: false,
				error: "No password?"
			});
		verifyCaptcha(packet.token, function (success) {
			if (!success) 
				return client.send({
					type: "login",
					success: false,
					error: "Problem with your captcha."
				});
			userStorage.registerAsync(username, packet.password, function(err, token) {
				if (err) {
					console.warn(err);
					return client.send({
						type: "login",
						success: false,
						error: "An internal error occurred."
					});
				}
				client.send({
					type: "login",
					success: true,
					username: username,
					token: token
				});
				client.stage = STAGES.PLAY;
				client.username = username;
				client.guest = false;
				users[username] = client;
				Server.broadcastJoin(username);
			});
		});
	});
	packet(STAGES.LOGIN, "guest", function handleGuestLogin(client, packet) {
		if ((typeof packet.token !== "string") || !packet.token.length)
			return client.send({
				type: "login",
				success: false,
				error: "No captcha?"
			});
		verifyCaptcha(packet.token, function(success) {
			if (!success)
				return client.send({
					type: "login",
					success: false,
					error: "Bad captcha? Try again."
				});
			var name = "guest-" + Math.floor(Math.random() * 1000000);
			client.send({
				type: "login",
				success: true,
				username: name
			});
			client.stage = STAGES.PLAY;
			client.username = name;
			client.guest = true;
			users[name] = client;
			Server.broadcastJoin(name);
		});
	});
	
	packet(STAGES.PLAY, "getChunks", function handleGetChunk(client, packet) {
		var chunks = packet.chunks, newChunks = {};
		if (!chunks || !Array.isArray(chunks) || !chunks.length || (chunks.length > 100)) return;
		for (var pos of chunks) {
			if (pos in map.chunks) {
				newChunks[pos] = map.chunks[pos];
			}
			/*if (pos.indexOf(",") === pos.lastIndexOf(","))
				newChunks[pos] = map.chunks["0,0"];*/
		}
		client.send({
			type: "chunks",
			chunks: newChunks
		});
	}); //TODO
  /*packet(STAGES.PLAY, "ping", function pong(client, packet) {
		client.send({
			type: "pong",
			timestamp: +new Date
		});
	});*/
	return handlers;
} ());

var clients = [],
	users = {};

function Client(socket) {
	this.stage = STAGES.LOGIN;
	
	this.socket = socket;
	this.socket.on("message", this.handleWSMessage.bind(this));
	this.socket.on("close", this.destroy.bind(this));
	
	this.username = null;
	
	this.id = (clients.indexOf(null) > -1) ? clients.indexOf(null) : clients.length;
	clients[this.id] = this;
}

Client.prototype.handleWSMessage = function handleWSMessage(message) {
	if (typeof message !== "string") return this.error("Invalid message");
	try {
		message = JSON.parse(message);
	} catch(e) {
		return this.error(1003, "Couldn't parse message JSON");
	}
	if (!message || (typeof message !== "object")) {
		return this.error(1003, "Invalid message JSON");
	}
	var type = message.type;
	if ((typeof type === "string") && type.length) {
		if (type in packetHandlers[this.stage]) {
			packetHandlers[this.stage][type](this, message);
		} else console.log(`There ain't "${type}" packet in stage "${this.stage}".`);
	} else console.log("A client sent a packet with the type not being a string or being an empty string.");
};

Client.prototype.send = function send(packet) {
	if (typeof packet !== "string") packet = JSON.stringify(packet);
	this.socket.send(packet);
};

Client.prototype.error = function error(code, error) {
	if (arguments.length != 2) throw "Error code & in text is needed.";
	this.socket.close(code, error);
};

Client.prototype.destroy = function destroy() {
	clients[this.id] = null;
	if (this.username in users) {
		delete users[this.username];
		if (!this.guest)
			Server.broadcastLeave(userStorage.get(this.username).username);
	}
};

Server.on("connection", function(socket) {
	new Client(socket);
});

Server.broadcast = function broadcast(packet) {
	if (typeof packet !== "string") packet = JSON.stringify(packet);
	for (var name in users)
		if (users.hasOwnProperty(name))
			users[name].send(packet);
};

Server.broadcastJoin  = function broadcastJoin (username) {
	this.broadcast({
		type: "join",
		username: username
	});
}.bind(Server);

Server.broadcastLeave = function broadcastLeave(username) {
	this.broadcast({
		type: "leave",
		username: username
	});
}.bind(Server);