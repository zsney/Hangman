(function() {
	var wordlibs = "";
	var defaultArr = ['E', 'T', 'A', 'O', 'I', 'N', 'S', 'H', 'R', 'D', 'L', 'C', 'U', 'M', 'W', 'F', 'G', 'Y', 'P', 'B', 'V', 'K', 'J', 'X', 'Q', 'Z'];

	//GameWord
	function GameWord(obj) {
		this.currentWord = obj.data.word;
		this.totalWordCount = obj.data.totalWordCount;
		this.wrongGuessCountOfCurrentWord = obj.data.wrongGuessCountOfCurrentWord;
		this.tmpWords = "";
		this.tmpSortArr = [];
		this.guessedChar = "";
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
		this.words = []; //GameWord list
		this.sessionId = "";
		this.numberOfWordsToGuess = 0;
		this.numberOfGuessAllowedForEachWord = 0;
		this.currentWord;
		this.gameRunningFlag = false;
		return this;
	}
	Game.prototype = {
		//create game, get sessionId,
		initGame: function() {
			if(!wordlibs) return;
			var _this = this;
			_this.gameRunningFlag = true;
			var startGameParam = {
				"playerId": playerID,
				"action": "startGame"
			};
			doPost(startGameParam, function(json) {
				_this.sessionId = json.sessionId;
				_this.numberOfWordsToGuess = json.data.numberOfWordsToGuess;
				_this.numberOfGuessAllowedForEachWord = json.data.numberOfGuessAllowedForEachWord;
				//console.log("game init done..... sessionId = " + _this.sessionId);
				_this.getWord();
			});
			return this;
		},
		//get next word 
		getWord: function() {
			var _this = this;
			//console.log("get a word..... sessionId = " + _this.sessionId);
			//all words here, game over and get result.
			if (_this.words.length == _this.numberOfWordsToGuess) {
				//console.log("words size is maxium..... sessionId = " + _this.sessionId);
				_this.getResult();
				return;
			}
			//or get word
			var getWordParam = {
				"sessionId": _this.sessionId,
				"action": "nextWord"
			};
			doPost(getWordParam, function(json) {
				var word = new GameWord(json);
				_this.words.push(word);
				_this.currentWord = word;
				_this.currentWord.tmpSortArr = defaultArr.concat();
				//console.log("get word..... sessionId = " + _this.sessionId + ", word index = " + _this.currentWord.totalWordCount);
				var ch = _this.currentWord.tmpSortArr.shift();
				//console.log("guess charator = " + ch);
				_this.currentWord.guessedChar += ch;
				_this.makeGuess(ch);
			});
			return this;
		},
		//guess the word
		makeGuess: function(c) {
			var _this = this;

			if (!c) {
				_this.getWord();
				return;
			}

			var guessWordParam = {
				"sessionId": _this.sessionId,
				"action": "guessWord",
				"guess": c.toUpperCase()
			};
			doPost(guessWordParam, function(json) {
				//when word is correct, go to next word
				if (json.data.word.indexOf("*") < 0) {
					var result = "word correct. sessionId = " + _this.sessionId + ', index = ' +json.data.totalWordCount +', word = ' + json.data.word + "<br />";
					$("#results").append(result);
					_this.getWord();
					return;
				}
				//when wrong counts is reach max number, go to next word
				if (json.data.wrongGuessCountOfCurrentWord == _this.numberOfGuessAllowedForEachWord) {
					//console.log("word incorrect attemp times goes to max, go next..... sessionId = " + _this.sessionId + ', word = ' + json.data.word);
					_this.getWord();
					return;
				}

				//if the word is the same, it meaning, this guess is incorrect, go next
				if (json.data.word == _this.currentWord.currentWord) {
					//console.log("guess incorrect, guess next charator..... sessionId = " + _this.sessionId);
					var ch = _this.currentWord.tmpSortArr.shift();
					//console.log("guess charator = " + ch);
					_this.currentWord.guessedChar += ch;
					_this.makeGuess(ch);
					return;
				}

				_this.currentWord.setValue(json);
				_this.currentWord.tmpWords = retrieveWords(_this.currentWord.tmpWords, json.data.word);
				_this.currentWord.tmpSortArr = calculationWords(_this.currentWord.tmpWords, _this.currentWord.guessedChar);

				//fix null issue
				if (!_this.currentWord.tmpSortArr) {
					_this.currentWord.tmpSortArr = defaultArr.concat();
					var ch = "";
					do {
						ch = _this.currentWord.tmpSortArr.shift();
					} while (_this.currentWord.guessedChar.indexOf(ch) >= 0);
					//console.log("guess charator = " + ch);
					_this.currentWord.guessedChar += ch;
					_this.makeGuess(ch);
				} else {
					var ch = _this.currentWord.tmpSortArr.shift();
					//console.log("guess charator = " + ch);
					_this.currentWord.guessedChar += ch;
					_this.makeGuess(ch);
				}
			});
			return this;
		},
		//get result
		getResult: function() {
			var _this = this;
			var getResultParam = {
				"sessionId": _this.sessionId,
				"action": "getResult"
			};
			doPost(getResultParam, function(json) {
				//show Result
				$("#r_totalWordCount").html(json.data.totalWordCount);
				$("#r_correctWordCount").html(json.data.correctWordCount);
				$("#r_totalWrongGuessCount").html(json.data.totalWrongGuessCount);
				$("#r_score").html(json.data.score);
			});
			return this;
		},
		//submit current session's result
		submitGame: function() {
			var _this = this;
			var submitResult = {
				"sessionId": _this.sessionId,
				"action": "submitResult"
			};
			doPost(submitResult, function(json) {
				alert("score = " + json.data.score);
			});
			return this;
		}
	};


	//retrieve words from libs
	function retrieveWords(tmpWords, word) {
		try {
			//console.log("word = " + word);
			var newReg = word.replace(/\*/g, "\[A\-Z\]");
			var tmpArr = [];
			if (!tmpWords) {
				tmpArr = wordlibs.match(new RegExp(newReg, "gi"));
			} else {
				tmpArr = tmpWords.match(new RegExp(newReg, "gi"));
			}
			//fix null array, as no word in lib
			if (!tmpArr || tmpArr.length == 0) {
				tmpWords = "";
			} else {
				tmpWords = tmpArr.join(",");
			}
			return tmpWords;
		} catch (e) {
			//console.error("tmpWords = " + tmpWords);
			//console.error("word = " + word);
			//console.error(e);
			return "";
		}

	};

	//calculate a sort array of words
	function calculationWords(tmpWords, guessedChar) {
		//fix null issue
		if (!tmpWords) return [];
		try {
			var reg = new RegExp("([^," + guessedChar + "])\\1*", "gi");
			//console.log("tmpWords.length = " + tmpWords.length);
			var tmpSortArr = tmpWords.split('').sort().join('').match(reg).sort(function(b, a) {
				return a.length - b.length;
			});
			var rArr = [];
			for (var i = 0; i < tmpSortArr.length; i++) {
				if (!tmpSortArr[i]) continue;
				rArr.push(tmpSortArr[i][0]);
			};
			return rArr;
		} catch (e) {
			//console.error("tmpWords = " + tmpWords);
			//console.error("guessedChar = " + guessedChar);
			//console.error(e);
			return [];
		}
	};


	var requestURL = "https://strikingly-hangman.herokuapp.com/game/on"; //action port
	var playerID = "329142963@qq.com";
	//core post data method
	function doPost(param, callback) {
		$.ajax({
			type: "POST",
			url: requestURL,
			contentType: "application/json",
			dataType: "json",
			async: false,
			data: JSON.stringify(param),
			success: callback
		});
	};

	//init words libs.
	function initWordlibs() {
		var n = document.getElementById("wordsframe").contentWindow.document.all[0];
		if (!n) {
			setTimeout(initWordlibs, 500);
			return;
		} else {
			wordlibs = n.innerText;
			//console.log("words lib init done.....");
		}
	};
	initWordlibs();

	function $Game() {
		return new Game();
	}
	window.$Game = $Game;


})();