var request = require('request');
var Q = require('q');
String.prototype.capitalize = function() {
	return this.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
};
module.exports = function(app){

	function fakeGet(url, res){
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
			var setlists = JSON.parse(data).setlists.setlist;
			setlists.forEach(function (set){
				if (set.sets){
					if (set.sets.set.song){
						if (set.sets.set.song['@name']){
							songList.push(set.sets.set.song['@name']);
						}
						else {
							set.sets.set.song.forEach(function (song){
								var songName = song['@name'];
								if (songName){
									songList.push(songName);
								}
							})
						}
					}
					else {
						if (set.sets.set){
							set.sets.set.forEach(function (subSet){
								if (subSet.song){
									if (subSet.song['@name']){
										var songName = subSet.song['@name'];
										songList.push(songName);
									}
									else {
										subSet.song.forEach(function (song){
											var songName = song['@name'];
											if (songName){
												songList.push(songName);
												// console.log('1',songList.length)
											}
										})
									}
								}
							})
						}
					}
				}
			})
			return deffered.resolve(songList)
		})
		.catch(function (err){
			throw err
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
						played : 0
					};
					promises.push(getYoutubeURL(artistName, topSongs[song]))
				}
				++topSongs[song].played;
			})
			return Q.all(promises);
		})
		.then(function (data){
			// console.log(artistName,data.length)
			return deffered.resolve({name : artistName, songs : data})
		})
		.catch(function (err){
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
			throw err
		})
	})
};
