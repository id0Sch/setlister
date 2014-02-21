var mongoose = require('mongoose'),
  	Artist = mongoose.model('Artist'),
  	http = require('http');

exports.index = function(req, res){
    res.render('index');
};

exports.add = function (req, res) {
	var lineup = req.body.lineup;
	for (var i in lineup){
		var artist = new Artist();
		artist.name = lineup[i];
		artist.save();
	}
	res.send(200);
};