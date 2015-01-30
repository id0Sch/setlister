var setListApp = angular.module('setListApp', ['ui.bootstrap']);
setListApp.run(function () {
	var tag = document.createElement('script');
	tag.src = "http://www.youtube.com/iframe_api";
	var firstScriptTag = document.getElementsByTagName('script')[0];
	firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
});

setListApp.controller('setListCtrl', ['$scope', '$http', '$location', 'VideosService','$q', function ($scope, $http, $location, VideosService, $q) {

	$scope.lineup = [];

	$scope.selectedArtist = null;
	$scope.festivalName = null;
	$scope.festivalYear = null;
	$scope.festivalName = 'rockwerchter';
	$scope.festivalYear = '2015';


	init();

	function init() {
		$scope.youtube = VideosService.getYoutube();
		$scope.results = VideosService.getResults();
		$scope.upcoming = VideosService.getUpcoming();
		$scope.history = VideosService.getHistory();
		$scope.playlist = true;
	}

	$scope.launch = function (song) {
		var id = song.youtubeID;
		var title = song.artist + ' - ' + song.name;

		VideosService.launchPlayer(id, title);
		VideosService.archiveVideo(id, title);
		VideosService.deleteVideo($scope.upcoming, id);
	};

	$scope.queue = function (song) {
		var id = song.youtubeID;
		var title = song.artist + ' - ' + song.name;
		VideosService.queueVideo(id, title);
		VideosService.deleteVideo($scope.history, id);
    };
	$scope.delete = function (song) {
		var id = song.youtubeID;
		var title = song.artist + ' - ' + song.name;
  		VideosService.deleteVideo(list, id);
	};


	$scope.getLineup = function (){
		$scope.lineup = [];
		$http.get('/getLineup/'+$scope.festivalName+'/'+$scope.festivalYear)
		.success(function (data) {
			$scope.lineup = data;
			$scope.showSetList($scope.lineup[0])
		})
	};
	function getSongs (artist) {
		var deffered = $q.defer();
		$http.get('/getSetlist/'+artist.name)
		.success( function (data){
			return deffered.resolve(data.songs);
		});
		return deffered.promise
	}

	$scope.showSetList = function (artist){
		if ($scope.selectedArtist && $scope.selectedArtist.name === artist.name){
			$scope.selectedArtist = null;
			return;
		}

		$scope.selectedArtist = artist;

		if ($scope.selectedArtist.topSongs){
			return;
		}

		getSongs(artist)
		.then(function (songs){
			$scope.selectedArtist.topSongs = songs;
			for (song in $scope.selectedArtist.topSongs){
				$scope.queue($scope.selectedArtist.topSongs[song])
			}
		})
	}
	$scope.getLineup();
}]);