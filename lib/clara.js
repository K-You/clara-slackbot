'use strict';
var util = require('util');
var path = require('path');
var fs =require('fs');
var SQLite = require('sqlite3').verbose();
var Bot = require("slackbots");




/*************/

// HTTP adds

/*************/

var https = require("https");
var http = require("http");

//END HTTP


var Clara= function Constructor(settings){
	this.settings = settings;
	this.settings.name = this.settings.name || 'clara';

	this.dbPath = settings.dbPath || path.resolve(process.cwd(), 'data', 'norrisbot.db');
	this.user = null;
	this.db = null;
}

util.inherits(Clara, Bot);
module.exports = Clara;


Clara.prototype.run = function(){
	Clara.super_.call(this, this.settings);

	this.on('start', this._onStart);
	this.on('message', this._onMessage);
};

Clara.prototype._onStart = function(){
	this._loadBotUser();
	this._connectDb();
	this._firstRunCheck();
};

Clara.prototype._loadBotUser = function(){
	var self = this;
	this.user = this.users.filter(function(user){
		return user.name===self.name;
	})[0];
};

Clara.prototype._connectDb = function(){
	if(!fs.existsSync(this.dbPath)){
		console.error("Database path "+ '"' + this.dbPath +'" does not exist or it\'s not readable.');
		process.exit();
	}
	this.db = new SQLite.Database(this.dbPath);
};

Clara.prototype._firstRunCheck = function(){
	var self = this;
	self.db.get('SELECT val FROM info WHERE name = "lastrun" LIMIT 1', function(err,record){
		if(err){
			return console.error('DATABASE ERROR:', err);
		}
		var currentTime = (new Date()).toJSON();

		if(!record){
			self._welcomeMessage();
			return self.db.run('INSERT INTO info(name, val) VALUES("lastrun", ?)', currentTime);
		}
		self.db.run('UPDATE info SET val = ? WHERE name="lastrun"', currentTime);
	})
};

Clara.prototype._welcomeMessage = function(){
	this.postMessageToChannel(this.channels[0].name, 'Hi guys, roundhouse-kick anyone?'+
		'\n I can tell jokes, but very honest ones. Just say `Chuck Norris` or `'+this.name+'`to invoke me!',
		{as_user:true} );
};


Clara.prototype._onMessage = function(message){
	if(this._isChatMessage(message) && this._isChannelConversation(message) && !this._isFromClara(message)){

		if(this._isMentioningChuckNorris(message)){
			this._replyWithRandomJoke(message);
		}

		if(this._isMentioningClara(message)){
			if(this._isAskingForRequest(message)){
				this._requestUrl(message);
			}
		}

	}
};

Clara.prototype._isChatMessage = function(message){
	return message.type === 'message' && Boolean(message.text);
};

Clara.prototype._isChannelConversation = function(message){
	return typeof message.channel === 'string' && message.channel[0] === 'C';
};

Clara.prototype._isFromClara = function(message){
	return message.user === this.user.id;
};

Clara.prototype._isMentioningChuckNorris = function(message){
	return 	message.text.toLowerCase().indexOf('chuck norris')>-1;
};

Clara.prototype._isMentioningClara = function(message){
	var self = this;
	return 	message.text.toLowerCase().indexOf(this.name)>-1 || 
	message.text.toLowerCase().indexOf('clara oswald')>-1 || 
	message.text.toLowerCase().indexOf(this.id);
};

Clara.prototype._replyWithRandomJoke = function(message){
	var self = this;
	self.db.get('SELECT id, joke FROM jokes ORDER BY used ASC, RANDOM() LIMIT 1', function(err, record){
		if(err){
			return console.error('DATABASE ERROR:', err);
		}
		var channel = self._getChannelById(message.channel);
		self.postMessageToChannel(channel.name, record.joke, {as_user:true});
		self.db.run('UPDATE jokes SET used = used+1 WHERE id=?', record.id);
	});
};

Clara.prototype._getChannelById = function(channelId){
	return this.channels.filter(function (item){
		return item.id === channelId;
	})[0];
};

Clara.prototype._isAskingForRequest = function(message){
	return message.text.toLowerCase().indexOf("ping")>-1;
};

Clara.prototype._requestUrl = function(message){
	var self = this;
	var channel = self._getChannelById(message.channel);

	try{

		var url = message.text.substring(message.text.toLowerCase().indexOf("ping")+"ping".length).replace(/\s+/g, '').replace(/\</g, '').replace(/\>/g,'');
		

		
		var start = Date.now();
		var callback = function(response){
			var body = '';
			response.on('data', function(d){
				body+=d;
			});
			response.on('end', function(){
				var response;
				try{
					
					response = JSON.parse(body);
					//self.postMessageToChannel(channel.name, "J'ai pu récupérer un JSON.", {as_user:true});
				}catch(e){
					response = body;
					//self.postMessageToChannel(channel.name, "J'ai pu récupérer une chaîne de caractères.", {as_user:true});
				}

				self.postMessageToChannel(channel.name, "Ce site a répondu en "+(Date.now()-start)+"ms.", {as_user:true});
				self.postMessageToChannel(channel.name, response, {as_user:true});
			});
		}
		self.postMessageToChannel(channel.name, "Je tente de récupérer des infos sur "+url+" ... ", {as_user:true});
		if(url.indexOf("https")>-1){		
			https.get(url, callback);
		}else if(url.indexOf("http")>-1){
			http.get(url, callback);
		}else{
			self.postMessageToChannel(channel.name, "Quel protocole? (HTTP/HTTPS).", {as_user:true});
		}

	}catch(e){
		self.postMessageToChannel(channel.name, "Une erreur est survenue :/ ", {as_user:true});
	}
};

