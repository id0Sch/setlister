var request = require('request')
	module.exports = function(app){
	function fakeGet(url, res){
		console.log(url)
		request(url, function (err, response, body){
			if (err){
				throw err
			}
			res.send(body)
		})	
	}
	var home = require('../app/controllers/home');
	app.get('/', home.index);

	app.get('/getLineup/:festivalName/:year', function (req, res){
		fakeGet('http://www.efestivals.co.uk/festivals/'+req.params.festivalName+'/'+req.params.year+'/lineup.shtml', res);
	})
	app.get('/getSetlist/:artistName/:pageNumber', function (req, res){
		fakeGet('http://api.setlist.fm/rest/0.1/search/setlists.json?artistName='+req.params.artistName+'&p='+req.params.pageNumber, res);
	})
};
