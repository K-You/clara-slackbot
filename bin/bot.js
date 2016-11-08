'use strict';

var Clara = require('../lib/clara');

var token = "xoxb-91967712342-3xh6RFdu3UMLh1PEAWIgYcD0";
var dbPath = process.env.BOT_DB_PATH;
var name = process.env.BOT_NAME;

var clara = new Clara({
	token : token,
	dbPath : dbPath,
	name : name
});

clara.run();