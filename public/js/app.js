var setListApp = angular.module('setListApp', []);

setListApp.controller('setListCtrl', ['$scope', '$http', '$location', function($scope, $http, $location) {

	String.prototype.capitalize = function() {
		return this.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
	};

	$scope.lineup = [];
	$scope.selectedArtist = null;
	$scope.festivalName = null;
	$scope.festivalYear = null;
	var artistCache = {};


	function getTopSongs (songList) {
		var topSongs = {};

		for (var i in songList) {
			var song = songList[i];

			if (!topSongs[song])
				topSongs[song] = {
					name: song,
					timesPlayed: 0
				};

			++topSongs[song].timesPlayed;
		}

		var topSongsArray = [];

		for (var currentSong in topSongs) {
			topSongsArray.push({
				timesPlayed: topSongs[currentSong].timesPlayed,
				name: currentSong
			});
		}

		console.log(topSongsArray);
		return topSongsArray;
	}

	$scope.getLineup = function (){
		getArtists($scope.festivalName, $scope.festivalYear, function (err, artists) {
				if (err)
					return console.error(err);
				
				for(var i in artists)
				{
					$scope.lineup.push({
						name: artists[i]
					});
				}
			});
	}

	function getArtists(festivalName, year, callback) {
		var lineupUrl = "http://anyorigin.com/dev/get?url=http%3A//www.efestivals.co.uk/festivals/" + festivalName + "/" + year + "/lineup.shtml&callback=JSON_CALLBACK";
		$http.jsonp(lineupUrl).success(function (data) {
			if(data.contents.indexOf("alarm") === 0)
				return getArtists(festivalName, year, callback);
				//return callback('error gettings data');

			var pattern=/Tiny.*?1\">\(C\)<\/span> (.*?)<\/a>/ig;

			var artists = [];
			
			while (match = pattern.exec(data.contents)) {
				artists.push(match[1].replace('<span class="lu_new1">', '').replace("</span>", ""));
			}

			callback(null, artists);
		});
	}

	function getYoutubeSongLink (artistName, songName, callback) {
		var	youtubeQuery = 'http://gdata.youtube.com/feeds/api/videos?q=%22'+ encodeURIComponent(artistName +' '+songName) +'%22&orderby=viewCount&alt=json&callback=JSON_CALLBACK';
		$http.jsonp(youtubeQuery).success( function (data){
			var url= data.feed.entry[0].link[0].href;
			return callback(url);
		});
	}
	
	function getSongs (artist, pageNumber, callback) {
		var songList = [],
			setListURL = 'http://anyorigin.com/dev/get?url=http%3A//api.setlist.fm/rest/0.1/search/setlists.json%3FartistName%3D'+artist.name+'%26p%3D'+pageNumber+'&callback=JSON_CALLBACK';
		$http.jsonp(setListURL).success( function (data){
			if (!data.contents.setlists)
			{
				callback([]);
				return;
			}

			setlists = data.contents.setlists.setlist;
			
			for (var set in setlists){
				if (setlists[set].sets){
					if (setlists[set].sets.set.song){
						for (song in setlists[set].sets.set.song){
							songName = setlists[set].sets.set.song[song]['@name'];
							if (songName)
								songList.push(songName.capitalize());
						}
					}
					else {
						for(var sub_set in setlists[set].sets.set){
							for (song in setlists[set].sets.set[sub_set].song){
								songName = setlists[set].sets.set[sub_set].song[song]['@name'];
								if (songName)
									songList.push(songName.capitalize());
							}
						}
					}
				}
			}
			callback(songList);
		});
	}

	$scope.showSetList = function (artist){
		var	setlists = null,
			songName = null,
			pageNumber = 1;

		if ($scope.selectedArtist !== null && $scope.selectedArtist.name === artist.name)
		{
			$scope.selectedArtist = null;
			return;
		}

		$scope.selectedArtist = artist;

		if ($scope.selectedArtist.topSongs)
		{
			console.log($scope.selectedArtist.topSongs);
			return;
		}

		$scope.selectedArtist.topSongs = null;

		getSongs(artist, pageNumber, function (songList){
			if (songList.length > 0)
				$scope.selectedArtist.topSongs = getTopSongs(songList);
			else{
				pageNumber++;
				getSongs(artist, pageNumber, function (songListII){
					if (songListII.length > 0)
						$scope.selectedArtist.topSongs = getTopSongs(songListII);
					else
						$scope.selectedArtist.topSongs = false;
				});
			}
		});
	};
}]);