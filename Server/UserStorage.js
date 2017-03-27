const bcrypt = require("bcrypt"),
      crypto = require("crypto"),
      fs = require("fs");

function UserStorage(name) {
	this.file = `./data/${name||"users"}.json`;
	this.data = {};
	this.saltRounds = 11;

	fs.existsSync(this.file) ? this.load() : this.save();
}

UserStorage.prototype.save = function save() {
	fs.writeFileSync(this.file, JSON.stringify(this.data));
};

UserStorage.prototype.load = function load() {
	this.data = require(this.file);
};

UserStorage.prototype.clean = function clean() {
	this.data = {};
	this.save();
};

UserStorage.prototype.get = function get(username) {
	return this.data[username];
};

UserStorage.prototype.isRegistered = function isRegistered(user) {
	return user in this.data;
};

UserStorage.prototype.deleteUser = function deleteUser(username) {
	delete this.data[username];
	this.save();
};

UserStorage.prototype.mkToken = function mkToken() {
	return { timestamp: +new Date, value: crypto.randomBytes(256).toString('ascii') };
};

UserStorage.prototype.checkToken = function checkToken(username, token) {
	if (typeof username !== "string") return ["Username not string."];
	if (typeof token !== "string") return ["Token not a string."];
    if (!username.length) return ["Blank username."];
	if (!this.isRegistered(username)) return ["Unregistered user."];
	if (!token.length) return ["Blank token."];
	if (token !== this.get(username).token.value) return ["Tokens didn't match."];
	if (+new Date - this.get(username).token.timestamp >= 21600000 /*6 hours*/) {
		delete this.data[username].token;
		this.save();
		return ["Expired token."];
	}
	return true;
};

UserStorage.prototype.updateToken = function updateToken(username) {
	return this.get(username).token = this.mkToken();
};

UserStorage.prototype.loginAsync = function loginAsync(user, pw, callback) {
	bcrypt.compare(pw, this.get(user).pw, function(err, same) {
    	if (err) return callback(err);
    	callback(false, same);
	});
};

UserStorage.prototype.registerAsync = function registerAsync(username, password, callback) {
	bcrypt.hash(password, this.saltRounds, function(err, encrypted) {
		if (err) return callback(err);
	    var token = this.mkToken();
		this.data[username] = {
			pw: encrypted,
			token: token,
			username: username
		};
		this.save();
		callback(false, token.value);
	}.bind(this));
};

module.exports = UserStorage;