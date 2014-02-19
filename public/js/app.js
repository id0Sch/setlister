var setListApp = angular.module('setListApp', []);

setListApp.controller('setListCtrl', ['$scope', '$http', function($scope, $http) {

	String.prototype.capitalize = function() {
		return this.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
	};

	$scope.lineup = [];
	$scope.selectedArtist = null;

	function getTopSongs (songList){
		var topSongs = {};
		topSongs.len = 0;

		for (var i = 0; i in songList; i++){
			if (topSongs[songList[i]]) {
				topSongs[songList[i]].timesPlayed++;
			}
			else {
				topSongs[songList[i]] = {name : songList[i], timesPlayed :1};
				topSongs.len++;
			}
		}
		return topSongs;
	}

	getArtists("rockwerchter", 2014, function (err, data) {
		if (err)
			return console.error(err);
		
		console.log(data);
	});

	function getArtists(festivalName, year, callback) {
		var lineupUrl = "http://anyorigin.com/dev/get?url=http%3A//www.efestivals.co.uk/festivals/" + festivalName + "/" + year + "/lineup.shtml&callback=JSON_CALLBACK";
		//var lineupUrl = "http://anyorigin.com/dev/get/?url=http%3A//www.efestivals.co.uk/festivals/rockwerchter/2014/lineup.shtml";

		$http.jsonp(lineupUrl).success(function (data) {
			if(data.contents.indexOf("alarm") == 0)
				return callback('error gettings data');

			var pattern=/Tiny.*?1\">\(C\)<\/span> (.*?)<\/a>/ig;

			var artists = [];
			
			while (match = pattern.exec(data.contents)) {
				artists.push(match[1].replace('<span class="lu_new1">', '').replace("</span>", ""));
			}

			callback(null, artists);
		});
	}

	function getSongs (artist, pageNumber, callback) {
		var songList = [],
			setListURL = 'http://anyorigin.com/dev/get?url=http%3A//api.setlist.fm/rest/0.1/search/setlists.json%3FartistName%3D'+artist.name+'%26p%3D'+pageNumber+'&callback=JSON_CALLBACK';
		$http.jsonp(setListURL).success( function (data){
			console.log(data);
			if (!data.contents.setlists)
			{
				callback([]);
				return;
			}
			setlists = data.contents.setlists.setlist;
			for (set in setlists){
				if (setlists[set].sets){
					if (setlists[set].sets.set.song){
						for (song in setlists[set].sets.set.song){
							songName = setlists[set].sets.set.song[song]['@name'];
							if (songName)
								songList.push(songName.capitalize());
						}
					}
					else {
						for(sub_set in setlists[set].sets.set){
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

	$scope.list = function (){
		$http.get('/list').success(function (data){
			$scope.lineup = data;
		});
	};

	$scope.addArtists = function (){
		var artistsList = $scope.addArtistsInput.split('\n');
		$http.post('/add',{lineup: artistsList}).success(function (err, data){
			if (!err)
				$scope.list();
		});
	};
	
	$scope.list();
}]);