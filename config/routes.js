module.exports = function(app){

	var home = require('../app/controllers/home');
	app.get('/', home.index);
	app.get('/list', home.list);
	app.post('/add', home.add);
};
