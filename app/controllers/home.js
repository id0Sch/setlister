var mongoose = require('mongoose'),
  Artist = mongoose.model('Artist');

exports.index = function(req, res){
    res.render('index');
};

exports.list = function (req, res) {
	Artist.find().sort({'_id': -1}).exec(function (err, artists) {
		res.send(artists);
	});
};

exports.add = function (req, res) {
	var lineup = req.body.lineup;
	for (i in lineup){
		var artist = new Artist();
		artist.name = lineup[i];
		artist.save();		
	}
	res.send(200);
};