'use strict';

var Clara = require('../lib/clara');

var token = "xoxb-91967712342-NdfiFfXCF6oMF52eX0cDDYmp";
var dbPath = process.env.BOT_DB_PATH;
var name = process.env.BOT_NAME;

var clara = new Clara({
	token : token,
	dbPath : dbPath,
	name : name
});

clara.run();
