var setListApp = angular.module('setListApp', ['ui.bootstrap', 'youtube.api.services']);

setListApp.controller('setListCtrl', ['$scope', '$http', '$location', 'youtubePlayer', function($scope, $http, $location, ytplayer) {

	String.prototype.capitalize = function() {
		return this.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
	};

	$scope.lineup = [];

	$scope.selectedArtist = null;
	$scope.player = null;
	$scope.festivalName = null;
	$scope.festivalYear = null;
	$scope.festivalName = 'rockwerchter';
	$scope.festivalYear = '2015';

	function initPlayer (){
		$scope.currentPlaylist = [];
		$scope.player = ytplayer;
		$scope.player.autoplay = '1';
		$scope.player.state = Boolean(parseInt($scope.player.autoplay,10));
		var index = 0;
		$scope.player.commands = {
			togglePlayPause:function(){
				if (!$scope.player.state)
					$scope.player.playVideo();
				else
					$scope.player.pauseVideo();
				$scope.player.state = !$scope.player.state;
			},
			jumpTo:function(index){
				$scope.player.playlistIndex = index;
				$scope.player.jumpTo(index);
				if (!$scope.player.state)
					$scope.player.state = !$scope.player.state;
			},
			next:function(){
				if ($scope.currentPlaylist.length-1 === $scope.player.playlistIndex)
					return;
				$scope.player.playlistIndex ++ ;
				$scope.player.nextVideo();
			},
			previous:function(){
				if ($scope.player.playlistIndex > 0 )
					$scope.player.playlistIndex -- ;
				$scope.player.previousVideo();
			},
			rePlay:function(){
				$scope.player.seekTo(0);
			},
			toggleMute:function(){
				if (!$scope.player.mute)
					$scope.player.muteVideo();
				if ($scope.player.mute)
					$scope.player.unMuteVideo();

				$scope.player.mute = !$scope.player.mute;
			}
		};
	}

	$scope.run = function (){
		if (!$scope.player)
			initPlayer();

		index = 0;
		$scope.player.active = true;

		var songs = [
			['Evil Twin', 'Arctic Monkeys'],
			['R U Mine?', 'Arctic Monkeys '],
			['RATHER BE','CLEAN BANDIT FT JESS GLYNNE'],
			['STAY THE NIGHT','ZEDD FT HAYLEY WILLIAMS'],
			['HAPPY','PHARRELL WILLIAMS']
		];
		getPlaylistIds(songs, function (currentPlaylistIds){
			$scope.player.setPlayList(currentPlaylistIds);
			$scope.player.loadPlayer();
		});
	}

	function getPlaylistIds (songs, callback){
		var currentPlaylistIds = [];
		for (var song in songs){
			getYoutubeSong(songs[song][0], songs[song][1] ,function (youtubeSong){
				$scope.currentPlaylist.push(youtubeSong);
				currentPlaylistIds.push(youtubeSong.id);
				if (currentPlaylistIds.length === songs.length)
					callback(currentPlaylistIds);
			});
		}
	}

	function getYoutubeSong (songName, artistName, callback) {
		var	youtubeQuery = 'http://gdata.youtube.com/feeds/api/videos?q=%22'+ encodeURIComponent(artistName +' '+songName) +'%22&orderby=viewCount&alt=json&max-results=1&format=5&callback=JSON_CALLBACK';
		$http.jsonp(youtubeQuery).success( function (data){
			var songIndex = parseInt(index,10);
			index++;

			if (!data.feed.entry){
				callback({name:songName, artist:artistName, id :null, index:songIndex});
			}
			var songId = data.feed.entry[0].id.$t.split('/').reverse()[0];

			callback( {name:songName, artist:artistName, id : songId, index:songIndex});
		});
	}

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

		return topSongsArray;
	}

	$scope.getLineup = function (){
		$scope.lineup = [];
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
	};

	function getArtists(festivalName, year, callback) {
		$http.get('/getLineup/'+festivalName+'/'+year).success(function (data) {			
			var pattern=/Tiny.*?1\">\(C\)<\/span> (.*?)<\/a>/ig;

			var artists = [];
			while (match = pattern.exec(data)) {
				artists.push(match[1].replace('<span class="lu_new1">', '')
									.replace('<span class="lu_new5">', '')
									.replace('</span>', ''));
			}
			callback(null, artists);
		});
	}

	function getSongs (artist, pageNumber, callback) {
		var songList = [],
			setListURL = '/getSetlist/'+artist.name+'/'+pageNumber;
		$http.get(setListURL).success( function (data){
			if (!data)
			{
				callback([]);
				return;
			}

			var setlists = data.setlists.setlist;
			for (var set in setlists){
				if (setlists[set].sets){
					if (setlists[set].sets.set.song){
						console.log(setlists[set].sets.set.song)
						for (var song in setlists[set].sets.set.song){
							var songName = setlists[set].sets.set.song[song]['@name'];
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
		var pageNumber = 1;

		if ($scope.selectedArtist !== null && $scope.selectedArtist.name === artist.name)
		{
			$scope.selectedArtist = null;
			return;
		}

		$scope.selectedArtist = artist;

		if ($scope.selectedArtist.topSongs)
		{
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
	$scope.getLineup();
}]);

setListApp.directive('youtube', ['youtubePlayer', function (YtPlayerApi) {
	return {
		restrict:'E',
		link:function (scope,element,attrs) {
			YtPlayerApi.setPlayerId(attrs.id);
			var player_vars={};
			var allowed_vars=['autoplay','controls','html5'];
			for (var idx in allowed_vars) {
				if (allowed_vars[idx] in attrs) {
					player_vars[allowed_vars[idx]]=attrs[allowed_vars[idx]];
				}
			}
			YtPlayerApi.setPlayerVars(player_vars);
		}
	};
}]);