/*global grecaptcha, zxcvbn*/
var Spooks = Spooks ||{};

Spooks.ui = {};

// Called by captcha
function recaptchaCallback(token) {
	if (document.getElementById("login-register").style.display == "none") {
		Spooks.net.guestLogin(token);
	} else {
		document.getElementById("register-button").disabled = false;
		Spooks.ui.recaptchaToken = token;
	}
}

Spooks.ui.hideLogin = function() {
	document.getElementById("login").style.display = "none";
};

Spooks.ui.loginError = function(error) {
	document.getElementById("login-error").innerHTML = error;
	document.getElementById("login-error").style.display = "";
};

Spooks.ui.init = function() {
	//Login
	document.getElementById("login-button").addEventListener("click", function() {
		this.net.login(document.getElementById("login-username").value, document.getElementById("login-password").value);
	}.bind(Spooks));
	document.getElementById("register-link").addEventListener("click", function() {
		document.getElementById("login-login").style.display = "none";
		document.getElementById("login-register").style.display = "";
	});
	
	document.getElementById("login-link").addEventListener("click", function() {
		document.getElementById("login-register").style.display = "none";
		document.getElementById("login-login").style.display = "";
		document.getElementById("register-button").disabled = true;
		grecaptcha.reset();
	});
	document.getElementById("register-button").addEventListener("click", function() {
		if (document.getElementById("register-password").value == document.getElementById("register-verify").value) {
			Spooks.net.register(document.getElementById("register-username").value, document.getElementById("register-password").value, this.recaptchaToken);
		} else {
			this.loginError("Passwords don't match");
		}
	}.bind(this));
	
	document.getElementById("register-password").addEventListener("input", function oninput() {
		this.style.backgroundColor = this.value.length ? "#"+"FF0000,FFA500,FFFF00,00FF00,006400".split(",")[zxcvbn(this.value, [document.getElementById("register-password"), "spooks"]).score] : "";
	});
}.bind(Spooks.ui);