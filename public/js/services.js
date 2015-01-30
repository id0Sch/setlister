setListApp.service('VideosService', ['$window', '$rootScope', '$log', function ($window, $rootScope, $log) {

	var service = this;

	var youtube = {
		ready: false,
		player: null,
		playerId: null,
		videoId: null,
		videoTitle: null,
		mute : false,
		shuffle : true,
		// playerHeight: '480',
		// playerWidth: '640',
		state: 'stopped',
		togglePlayPause : function (){
			if (this.state == 'playing'){
				this.player.pauseVideo()
			} else {
				this.player.playVideo()
			}
		},
		nextVideo : function (){
			playNextVideo();
		},
		previousVideo : function (){
			service.launchPlayer(history[0].id, history[0].title);
		},
		jumpTo : function (id, title){
			service.launchPlayer(id, title);
			service.archiveVideo(id, title);
			service.deleteVideo(upcoming, id);
		},
		toggleShuffle : function (){
			this.shuffle = !this.shuffle;
		},
		playNext : function (id, title){
			service.deleteVideo(upcoming, id)
			upcoming.unshift({
				id: id,
				title: title
			});
		}
	};
	var results = [];
	var upcoming = [];
	var history = [];

	$window.onYouTubeIframeAPIReady = function () {
		$log.info('Youtube API is ready');
		youtube.ready = true;
		service.bindPlayer('placeholder');
		service.loadPlayer();
		$rootScope.$apply();
	};

	function onYoutubeReady (event) {
		$log.info('YouTube Player is ready');
		// youtube.player.cueVideoById(history[0].id);
		// youtube.videoId = history[0].id;
		// youtube.videoTitle = history[0].title;
	}

	function onYoutubeStateChange (event) {
		if (event.data == YT.PlayerState.PLAYING) {
			youtube.state = 'playing';
		} else if (event.data == YT.PlayerState.PAUSED) {
			youtube.state = 'paused';
		} else if (event.data == YT.PlayerState.ENDED) {
			youtube.state = 'ended';
			playNextVideo()
		}
		$rootScope.$apply();
	}
	playNextVideo = function (){
		var nextVideoIndex = !youtube.shuffle ? 0 : Math.floor(Math.random()*upcoming.length);
		console.log(youtube.shuffle,nextVideoIndex)
		service.archiveVideo(youtube.videoId, youtube.title);
		service.launchPlayer(upcoming[nextVideoIndex].id, upcoming[nextVideoIndex].title);
		service.deleteVideo(upcoming, upcoming[nextVideoIndex].id);
	}
	this.bindPlayer = function (elementId) {
		$log.info('Binding to ' + elementId);
		youtube.playerId = elementId;
	};

	this.createPlayer = function () {
		$log.info('Creating a new Youtube player for DOM id ' + youtube.playerId + ' and video ' + youtube.videoId);
		return new YT.Player(youtube.playerId, {
			height: youtube.playerHeight,
			width: youtube.playerWidth,
			playerVars: {
				rel: 0,
				showinfo: 0
			},
			events: {
				'onReady': onYoutubeReady,
				'onStateChange': onYoutubeStateChange
			}
		});
	};

	this.loadPlayer = function () {
		if (youtube.ready && youtube.playerId) {
			if (youtube.player) {
				youtube.player.destroy();
			}
			youtube.player = service.createPlayer();
		}
	};

	this.launchPlayer = function (id, title) {
		youtube.player.loadVideoById(id);
		youtube.videoId = id;
		youtube.videoTitle = title;
		return youtube;
	}

	this.listResults = function (data) {
		results.length = 0;
		for (var i = data.items.length - 1; i >= 0; i--) {
			results.push({
				id: data.items[i].id.videoId,
				title: data.items[i].snippet.title,
				description: data.items[i].snippet.description,
				thumbnail: data.items[i].snippet.thumbnails.default.url,
				author: data.items[i].snippet.channelTitle
			});
		}
		return results;
	}

	this.queueVideo = function (id, title) {
		if (!youtube.videoId){
			this.launchPlayer(id , title)
		} else {
			upcoming.push({
				id: id,
				title: title
			});

		}
		return upcoming;
	};

	this.archiveVideo = function (id, title) {
		history.unshift({
			id: id,
			title: title
		});
		return history;
	};

	this.deleteVideo = function (list, id) {
		for (var i = list.length - 1; i >= 0; i--) {
			if (list[i].id === id) {
				list.splice(i, 1);
				break;
			}
		}
  	};

	this.getYoutube = function () {
		return youtube;
	};

	this.getResults = function () {
		return results;
	};

	this.getUpcoming = function () {
		return upcoming;
	};
	this.getHistory = function () {
		return history;
	};

}]);
// angular.module('youtube.api.services',[]).run(['$rootScope','$window',function($rootScope,$window) {
//  var tag = document.createElement('script');
//  tag.src = '//www.youtube.com/iframe_api';
//  var firstScriptTag = document.getElementsByTagName('script')[0];
//  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
//  $rootScope.$on('$viewContentLoaded',function() {
//      if (typeof YT !== 'undefined') {
//          $rootScope.$broadcast('apiReady');
//      }
//  });
// }]).factory('youtubePlayer', ['$window','$rootScope', function ($window, $rootScope) {
//  $window.onYouTubeIframeAPIReady = function () {
//      $rootScope.$broadcast('apiReady');
//  };
//  var ytplayer = {
//      'active':false,
//      'index':0,
//      'playerId':null,
//      'playerObj':null,
//      'videoId':null,
//      'autoplay': 0,
//      'html5': 1,
//      'controls': true,
//      'height':590,
//      'width':640,
//      'listType':null,
//      'playlist':[],
//      'playlistIndex':0,
//      'setShuffle':true,
//      'state':null,
//      'mute':false,

//      setPlayerId:function(elemId) {
//          this.playerId=elemId;
//      },
//      setDimensions:function(width,height) {
//          this.width=width;
//          this.height=height;
//      },
//      setPlayerVars: function(player_vars) {
//          for (var attr in player_vars) {
//              this[attr]=player_vars[attr];
//          }
//      },
//      setPlayList : function (list) {
//          this.listType = 'playlist';
//          this.playlist = this.playlist.concat(list);
//      },
//      setVideoId: function(videoId) {
//          this.videoId = videoId;
//      },
//      loadPlayer:function (callback) {
//          var playerVars={'autoplay':this.autoplay,'controls':this.controls};
//          var playerConfig={'height':this.height,'width':this.width,'playerVars':playerVars,'events':{}};
//          if (this.listType) {
//              playerConfig.playerVars.listType=this.listType;
//              playerConfig.playerVars.setShuffle=this.setShuffle;
//              playerConfig.playerVars.playlist=this.playlist.toString();
//          }
//          else {
//              playerConfig.videoId=this.videoId;
//          }
//          if (callback) {
//              playerConfig.events.onReady=callback;
//          }
//          this.playerObj = new YT.Player(this.playerId, playerConfig);
//      },
//      muteVideo: function() {
//          this.playerObj.mute();
//      },
//      unMuteVideo: function() {
//          this.playerObj.unMute();
//      },
//      setVolume: function(volume){
//          this.playerObj.setVolume({volume:volume});
//      },
//      playVideo:function() {
//          this.playerObj.playVideo();
//      },
//      pauseVideo:function() {
//          this.playerObj.pauseVideo();
//      },
//      stopVideo:function() {
//          this.playerObj.stopVideo();
//      },
//      nextVideo:function() {
//          this.playerObj.nextVideo();
//      },
//      previousVideo:function(){
//          this.playerObj.previousVideo();
//      },
//      seekTo:function(value){
//          this.playerObj.seekTo(value);
//      },
//      jumpTo:function(value){
//          this.playerObj.playVideoAt(value);
//      },
//      cueVideo:function (id) { // loads the video but does not play - do not mistake for adding to queqe
//          this.playerObj.loadVideoById(id);
//      },
//      getVideoLoadedFraction: function() { // returns a number between 0 -1 that represents the precentage of video bufferd (not played!)
//          if (this.playerObj)
//              return this.playerObj.getVideoLoadedFraction();
//      }
//  };
//  return ytplayer;
// }]);