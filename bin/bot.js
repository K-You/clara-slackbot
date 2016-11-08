'use strict';

var Clara = require('../lib/clara');

var token = "SLACK-TOKEN";
var dbPath = process.env.BOT_DB_PATH;
var name = process.env.BOT_NAME;

var clara = new Clara({
	token : token,
	dbPath : dbPath,
	name : name
});

clara.run();
