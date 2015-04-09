(function() {
	var wordlibs = "";
	var defaultArr = ['E','O','I','A','U'];
	//init words libs.

	//GameWord
	function GameWord(obj) {
		this.currentWord = obj.data.word;
		this.totalWordCount = obj.data.totalWordCount;
		this.wrongGuessCountOfCurrentWord = obj.data.wrongGuessCountOfCurrentWord;
		this.tmpWords = "";
		this.tmpSortArr = [];
		return this;
	}
	GameWord.prototype = {
		setValue: function(obj) {
			this.currentWord = obj.data.word;
			this.totalWordCount = obj.data.totalWordCount;
			this.wrongGuessCountOfCurrentWord = obj.data.wrongGuessCountOfCurrentWord;
			return this;
		}
	};

	//Game
	function Game() {
		this.words = [];
		this.sessionId = "";
		this.numberOfWordsToGuess = 0;
		this.numberOfGuessAllowedForEachWord = 0;
		this.currentWord;
		return this;
	}
	Game.prototype = {
		//create game, get sessionId,
		initGame: function() {
			var _this = this;
			var startGameParam = {
				"playerId": playerID,
				"action": "startGame"
			};
			doPost(startGameParam, function(json) {
				_this.sessionId = json.sessionId;
				_this.numberOfWordsToGuess = json.data.numberOfWordsToGuess
				_this.numberOfGuessAllowedForEachWord = json.data.numberOfGuessAllowedForEachWord;
			});
			return this;
		},
		//get next word 
		getWord: function() {
			var _this = this;
			//all words here, game over and get result.
			if (_this.words.length == _this.numberOfWordsToGuess) {
				_this.getResult();
				return;
			}
			//or get word
			var getWordParam = {
				"sessionId": _this.sessionId,
				"action": "nextWord"
			};
			this.doPost(getWordParam, function(json) {
				var word = new GameWord(json);
				_this.words.push(word);
				_this.currentWord = word;
			});
			return this;
		},
		//guess the word
		makeGuess: function(c) {
			var _this = this;
			var guessWordParam = {
				"sessionId": _this.sessionId,
				"action": "guessWord",
				"guess": c
			};
			this.doPost(guessWordParam, function(json) {
				//when word is correct or guess wrong count is maxium, get next word
				if (json.data.word.indexOf("*") < 0 || json.data.wrongGuessCountOfCurrentWord == _this.numberOfGuessAllowedForEachWord) {
					_this.getWord();
					return;
				}
				//if the word is the same, it meaning, this guess is incorrect, go next
				if(json.data.word == _this.currentWord.currentWord){
					_this.makeGuess(_this.currentWord.tmpSortArr.shift());
					return;
				}
				
				_this.currentWord.setValue(json);
				_this.currentWord.tmpWords = retrieveWords(json.data.word);
				_this.currentWord.tmpSortArr = calculationWords(_this.currentWord.tmpWords);
				
			});
			return this;
		},
		//get result
		getResult: function() {
			var getResultParam = {
				"sessionId": this.sessionId,
				"action": "getResult"
			};
			this.doPost(getResultParam, function(json) {
				//show Result
				$("#r_totalWordCount").html(jsonResult.data.totalWordCount);
				$("#r_correctWordCount").html(jsonResult.data.correctWordCount);
				$("#r_totalWrongGuessCount").html(jsonResult.data.totalWrongGuessCount);
				$("#r_score").html(jsonResult.data.score);
			});
			return this;
		},
		//submit current session's result
		submitGame: function() {
			var submitResult = {
				"sessionId": this.sessionId,
				"action": "submitResult"
			};
			this.doPost(getResultParam, function(json){
				
			});
			return this;
		}
	};


	//retrieve words from libs
	function retrieveWords(tmpWords, word) {
		var newReg = word.replace(/\*/g, "\[A\-Z\]");
		var tmpArr = [];
		if (!tmpWords) {
			tmpArr = wordlibs.match(new RegExp(newReg, "gi"));
		} else {
			tmpArr = tmpWords.match(new RegExp(newReg, "gi"));
		}
		tmpWords = tempArr.join(",");
		return tmpWords;

	};

	//calculate a sort of words
	function calculationWords(tmpWords) {
		var tmpSortArr = tempWords.split('').sort().join('').match(/([A-Za-z])\1+/g).sort(function(b, a) {
			return a.length - b.length;
		});
		var rArr = [];
		for (var i = 0; i < tmpSortArr.length; i++) {
			if (!tmpSortArr[i]) continue;
			rArr.push(tmpSortArr[i][0]);
		};
		return rArr;
	};


	var requestURL = "https://strikingly-hangman.herokuapp.com/game/on"; //action port
	var playerID = "329142963@qq.com";
	//core post data method
	function doPost(param, callback) {
		//		$.ajax({
		//			type: "POST",
		//			url: requestURL,
		//			contentType: "application/json",
		//			dataType: "json",
		//			async: false,
		//			data: JSON.stringify(param),
		//			success: function(jsonResult) {
		//				callback(jsonResult, data);
		//			}
		//		});
		callback("test");
	};

	//regiest to global
	function $Game() {
		return new Game();
	};
	window.$Game = $Game;

})();