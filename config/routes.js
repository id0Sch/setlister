var request = require('request');
var Q = require('q');
var jsonPath = require('JSONPath');

String.prototype.capitalize = function() {
	return this.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
};
module.exports = function(app){

	function fakeGet(url){
		var deffered = Q.defer();
		request(url, function (err, response, body){
			if (err){
				return deffered.reject(err);
			}
			return deffered.resolve(body)
		})
		return deffered.promise;
	}
	function getArtists (festivalName, year){
		var deffered = Q.defer();
		var url = 'http://www.efestivals.co.uk/festivals/'+festivalName+'/'+year+'/lineup.shtml';
		var pattern=/Tiny.*?1\">\(C\)<\/span> (.*?)<\/a>/ig;
		var lineup = [];
		fakeGet(url)
		.then(function (body){
			while (match = pattern.exec(body)) {
				var artist = match[1].replace('<span class="lu_new1">', '')
									.replace('<span class="lu_new5">', '')
									.replace('</span>', '')
									.replace('(live)','')
				lineup.push({name : artist});
			}
			return deffered.resolve(lineup);
		})
		return deffered.promise;
	}
	function getSongsPage(artistName, pageNumber){
		var deffered = Q.defer();
		var url = 'http://api.setlist.fm/rest/0.1/search/setlists.json?artistName='+artistName+'&p='+pageNumber;
		var songList = []
		fakeGet(url)
		.then(function (data){
			var jsonData = JSON.parse(data);
			songList = jsonPath.eval(jsonData, '$.setlists.setlist[*].sets[*].song[*][@name]');
			return deffered.resolve(songList)
		})
		.catch(function (err){
			console.log(err)
			return deffered.reject(err)
		})
		return deffered.promise;

	}
	function getArtistSongs (artistName){
		var deffered = Q.defer();
		var topSongs = {};
		var songsList = [];
		var promises = []
		Q.all([getSongsPage(artistName,1),getSongsPage(artistName,2)])
		.then(function (songs){
			songsList = songs[0]
			songsList.concat(songs[1])
			songsList.forEach(function (song){
				if (!topSongs[song]){
					topSongs[song] = {
						name : song,
						artist : artistName,
						playCount : 0,
						title : artistName +' - ' + song
					};
					promises.push(getYoutubeURL(artistName, topSongs[song]))
				}
				++topSongs[song].playCount;
			})
			return Q.all(promises);
		})
		.then(function (data){
			return deffered.resolve(data)
		})
		.catch(function (err){
			console.log(err)
			throw err
		})
		return deffered.promise;
	}
	function getYoutubeURL(artistName, song){
		var deffered = Q.defer();

		var	url = 'http://gdata.youtube.com/feeds/api/videos?q=%22'
								+ encodeURIComponent(artistName +' '+song.name)
								+ '%22&orderby=viewCount&alt=json&max-results=10&format=5';
		fakeGet(url)
		.then(function (data){
			data = JSON.parse(data)
			if (!data.feed.entry){
				return deffered.resolve(song)
			}
			else {
				for (var i in data.feed.entry){
					entry = data.feed.entry[i]
					var title = entry.title.$t.toLowerCase()
					if ( title.indexOf(artistName.toLowerCase()) != -1 &&  title.indexOf(song.name.toLowerCase()) != -1){
						song.youtubeID = entry.id.$t.split('/').reverse()[0];
						return deffered.resolve(song)
					}
				}
				song.youtubeID = data.feed.entry[0].id.$t.split('/').reverse()[0];
				return deffered.resolve(song)
			}
		})
		return deffered.promise;
	}
	var home = require('../app/controllers/home');

	app.get('/', home.index);

	app.get('/getLineup/:festivalName/:year', function (req, res){
		var promises = []
		getArtists(req.params.festivalName, req.params.year)
		.then(function (artists){
			return res.send(artists);
		})
		.catch(function (err){
			console.log(err)
			return res.send(null)
		})
	})
	app.get('/getSetlist/:artistName', function (req, res){
		getArtistSongs(req.params.artistName)
		.then(function (songs){
			return res.send(songs)
		})
		.catch(function (err){
			console.log(err)
			throw err
		})
	})
};
