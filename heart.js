"use strict";

const	http			= require('http');
const	ytdl			= require('ytdl-core');
const	streamOptions	= {seek: 0, volume: 1};
const	xtjConverter	= require('xml-js');
const	fs				= require('fs');
const	request			= require('request');
const	discord			= require('discord.js');
const	client			= new discord.Client();
const	broadcast		= client.createVoiceBroadcast();
var		boostMeter		= 0;
let		malCreditencial;
let		config; 

fs.readFile('config.json', (err, content) => {
	if (err !== null)
	{
		console.log('ERROR : No config file for mal, exiting');
		process.exit();
	}
	else
	{
		config = JSON.parse(content.toString('utf8'))
		malCreditencial = config.mal;
		client.login(config.discordToken);
	}
});

setInterval(function() {
	boostMeter = boostMeter > 0 ? boostMeter - 1 : boostMeter;
}, 10000);

const instructionKeyWordsDictionary = {
	speedBoost : {
		name					: 'Induce speed boosting mechanics',
		primaryKeyWords			: ['speed', 'boost', 'fast', 'faster', 'phast', 'phastestest', 'sanic', 'sonic', 'bass'],
		secondaryKeyWords		: [],
		contextPointers			: null,
		dataExtractionFuntion	: null,
		treatmentFunction		: null,
		responseBuildingFunc	: formulateAnswerToSpeedBoosting,
		context					: 'speed'
	},
	searchWikipedia : {
		name					: 'SearchInWikipedia',
		primaryKeyWords  		: ['wikipedia', 'wiki'],
		secondaryKeyWords		: ['search', 'for', 'look', 'find'],
		contextPointers			: ['for', 'about'],
		dataExtractionFuntion	: dataExtractSearchAnime,
		treatmentFunction		: treatExtractedDataSearchWikipedia,
		responseBuildingFunc	: formulateAnswerToWikipediaSearch,
		context					: 'Wikipedia'
	},
	stopYoutube : {
		name					: 'StopYoutubeSong',
		primaryKeyWords  		: ['youtube', 'yt'],
		secondaryKeyWords		: ['stop', 'stfu', 'end'],
		contextPointers			: null,
		dataExtractionFuntion	: null,
		treatmentFunction		: treatExtractedDataStopYoutube,
		responseBuildingFunc	: null,
		context					: 'Music'
	},
	skipYoutube : {
		name					: 'skipYoutubeSong',
		primaryKeyWords  		: ['youtube', 'yt'],
		secondaryKeyWords		: ['next', 'skip'],
		contextPointers			: null,
		dataExtractionFuntion	: null,
		treatmentFunction		: treatExtractedDataSkipYoutube,
		responseBuildingFunc	: null,
		context					: 'Music'
	},
	streamSomeyoutube : {
		name					: 'queueYoutubeSong',
		primaryKeyWords			: ['youtube', 'yt'],
		secondaryKeyWords		: ['queue', 'add', 'list'],
		contextPointers			: null,
		dataExtractionFuntion	: dataExtractQueueYoutube,
		treatmentFunction		: treatExtractedDataQueueYoutube,
		responseBuildingFunc	: null,
		context					: 'Music'
	},
	seachforAnime	: {
		name					: 'seachforAnime',
		primaryKeyWords			: ['anime', 'animu'],
		secondaryKeyWords		: ['look', 'for', 'search', 'find'],
		contextPointers			: ['called', 'named', 'titled'],
		dataExtractionFuntion	: dataExtractSearchAnime,
		treatmentFunction		: treatExtractedDataSearchAnime,
		responseBuildingFunc	: formulateAnswerToAnimeSearch,
		context					: 'anime'
	},
	rateAnime		: {
		name					: 'rateAnime',
		primaryKeyWords			: ['anime', 'animu'],
		secondaryKeyWords		: ['rate', 'give', 'note'],
		dataExtractionFuntion	: null,
		treatmentFunction		: null,
		responseBuildingFunc	: null,
		context					: 'anime'
	},
	getWatch2Gether	: {
		name					: 'getWatch2Gether',
		primaryKeyWords			: ['watch together', 'w2g', 'watch2gether', 'watch 2 gether'],
		secondaryKeyWords		: ['link', 'page', 'room'],
		dataExtractionFuntion	: null,
		treatmentFunction		: null,
		responseBuildingFunc	: formulateAnswerToWatchTogether,
		context : 'watch2gether'
	},
	rollDice		: {
		name					: 'rollDice',
		primaryKeyWords			: ['roll', 'dice', 'rng'],
		secondaryKeyWords		: ['D4', 'D6', 'D8', 'D20'],
		dataExtractionFuntion	: dataExtractRollDice,
		treatmentFunction		: null,
		responseBuildingFunc	: formulateAnswerToRollDice,
	},
	stopTheLewd		: {
		name					: 'stopTheLewd',
		primaryKeyWords			: ['lewd'],
		secondaryKeyWords		: ['2lewd4me', '2lewd4meh', 'lewd', 'too much', 'too'],
		dataExtractionFuntion	: null,
		treatmentFunction		: null,
		responseBuildingFunc	: formulateAnswerToStopTheLewd,
	}
};
const uselessIntros = [
	"Hey ! Here's what I could muster up :",
	"Senpai !",
	"It's not like I asked to be your slave but here you go Senpai : ",
	"Onii-Chan, I found something for you : ",
	"Here is what you asked for Senpai : ",
	"Kyaa !! Found something : ",
	"My nema jeff now. And I found some stuff : ",
]
const lewdPicturesUrls = [
	'http://i.imgur.com/I3apoUB.gif',
	'http://i.imgur.com/um5vVcC.gif',
	'http://i.imgur.com/pTb7vbZ.gif',
	'http://i.imgur.com/vZnMTFn.gif',
	'http://i.imgur.com/Ftuig9v.gif',
	'http://i.imgur.com/PX5CIMe.gif',
	'http://i.imgur.com/Gygj9sg.gif',
	'http://i.imgur.com/pPVVu2b.gif',
	'http://i.imgur.com/CvEfdxB.gif',
	'http://i.imgur.com/7QCizTa.gif',
	'http://i.imgur.com/PS12w7X.gif',
	'http://i.imgur.com/6fzs6jV.gif',
	'http://i.imgur.com/eBjiGR9.gif',
	'http://i.imgur.com/C53hLD2.gif',
	'http://i.imgur.com/7KZ7hHy.gif',
	'http://i.imgur.com/hJP68mL.mp4',
	'http://i.imgur.com/VsMHoip.mp4',
	'http://i.imgur.com/xwohwtM.mp4',
	'http://i.imgur.com/qm3XDPQ.mp4',
	'http://i.imgur.com/A2UXxgv.mp4',
	'http://i.imgur.com/uq0F60x.mp4',
	'http://i.imgur.com/3XZZiUr.mp4',
	'http://i.imgur.com/tTmjndw.png',
	'http://i.imgur.com/tTmjndw.png',
	'http://i.imgur.com/wrEtvgS.png',
	'http://i.imgur.com/QPUh0zS.png',
	'http://i.imgur.com/IvID0Zh.png',
	'http://i.imgur.com/JHH8aBn.png',
	'http://i.imgur.com/CXP4mpX.png',
	'http://i.imgur.com/jAxS3Hn.png',
	'http://i.imgur.com/KPliWs5.jpg',
	'http://i.imgur.com/dlTVXkb.jpg',
	'http://i.imgur.com/5wYpja4.jpg',
	'http://i.imgur.com/WgC1hKx.jpg',
	'http://i.imgur.com/PoSjNSH.jpg',
	'http://i.imgur.com/RIXTyE0.jpg',
	'http://i.imgur.com/ZOJ9ReT.jpg',
	'http://i.imgur.com/ZEyLXl0.jpg',
	'http://i.imgur.com/pOYgVLZ.jpg',
	'http://i.imgur.com/F9f3Oys.jpg',
	'http://i.imgur.com/JAEsZU1.jpg',
	'http://i.imgur.com/kbj6Tik.jpg',
	'http://i.imgur.com/JODmv9F.jpg',
	'http://i.imgur.com/E7ghNgd.jpg',
	'http://i.imgur.com/hQQoeLz.jpg',
	'http://i.imgur.com/6wbztE4.jpg',
	'http://i.imgur.com/1gYiWKD.jpg',
	'http://i.imgur.com/jtCPOEn.jpg',
	'http://i.imgur.com/IbOTQv7.jpg',
]
let youtubeServerList = {}

client.on('ready', () => {
	console.log('akoChan is awake...')
});

client.on('message', (message) => {
	const triggerPart = message.content.substring(0, 5);

	if (triggerPart === '.ako?')
		akoLexorInit(message.content, message);
});

function formulateAnswerToSpeedBoosting(tryArr, instruction) {
	var bImgs	= [
		'https://i.imgur.com/eKmmyv1.mp4',
		'https://i.imgur.com/10P1alj.mp4',
		'https://i.imgur.com/EZQoAOA.mp4'
	]
	var img = boostMeter > bImgs.length - 1 ? bImgs[bImgs.length - 1] : bImgs[boostMeter]
	var speed	= '*spee';
	var boost	= '**:b:oo';
	var boostNb	= minMaxNum(0, 9);
	var speedNb	= minMaxNum(0, 9);
	
	while (boostNb > 0)
	{
		boost += 'o';
		boostNb--;
	}
	while (speedNb > 0)
	{
		speed += 'e';
		speedNb--;
	}
	boostMeter++;
	speed += 'd*\n';
	boost += 'st**\n';
	return ('Boost meter status : ' + boostMeter + '\n\n' + speed + boost + img)
}

function akoLexorInit(messageContent, messageObj) {
	const	msg = messageContent.substring(5);
	let		instructionSet = msg.split('and');

	for (let i = 0; i < instructionSet.length; i++)
		matchFromKWD(instructionSet[i], i, messageObj);
}

function matchFromKWD(instruction, entryNumber, messageObj) {
	let scoreTable = {};
	let selectedReaction = null;

	for (let reaction in instructionKeyWordsDictionary) {
		scoreTable[reaction] = 0;

		for (let word = 0; word < instructionKeyWordsDictionary[reaction].primaryKeyWords.length; word++) {
			if (instruction.toLowerCase().match(instructionKeyWordsDictionary[reaction].primaryKeyWords[word]) !== null)
				scoreTable[reaction] += 5;
		}
		for (let word = 0; word < instructionKeyWordsDictionary[reaction].secondaryKeyWords.length; word++) {
			if (instruction.toLowerCase().match(instructionKeyWordsDictionary[reaction].secondaryKeyWords[word]) !== null)
				scoreTable[reaction] += 1;
		}
	}
	for (let reaction in scoreTable) {
		if (selectedReaction === null)
			selectedReaction = reaction;
		else if (scoreTable[reaction] >= scoreTable[selectedReaction])
			selectedReaction = reaction;
	}
	selectedReaction = instructionKeyWordsDictionary[selectedReaction];
	if (selectedReaction.dataExtractionFuntion !== null)
	{
		selectedReaction.dataExtractionFuntion(instruction, selectedReaction, (tryArray) => {
			let scoredArray = []

			if (selectedReaction.treatmentFunction !== null) {
				selectedReaction.treatmentFunction(tryArray, (result) => {
					if (selectedReaction.responseBuildingFunc !== null)
						messageObj.reply(selectedReaction.responseBuildingFunc(result, instruction));
				}, messageObj);
			}
			else if (selectedReaction.responceBuildingFunc !== null)
				messageObj.reply(selectedReaction.responseBuildingFunc(tryArray, instruction));
		});
	}
	else
	{
		let scoredArray = []

		if (selectedReaction.treatmentFunction !== null) {
			selectedReaction.treatmentFunction((result) => {
				if (selectedReaction.responseBuildingFunc !== null)
					messageObj.reply(selectedReaction.responseBuildingFunc(result, instruction));
			}, messageObj);
		}
		else
		{
			if (selectedReaction.responseBuildingFunc !== null)
				messageObj.reply(selectedReaction.responseBuildingFunc(null, instruction));
		}
	}
}

function dataExtractGenerateRandomNumber(instruction, reaction, callback) {
	const fromPointer = instruction.match(/from\s*[0-9]*/i);
	const toPointer = instruction.match(/to\s*[0-9]*/i);

	//todo
}

function dataExtractQueueYoutube(instruction, reaction, callback) {
	const extractedLinkObj = instruction.match('https://');
	let link;

	if (extractedLinkObj !== null)
		link = extractedLinkObj.input.substring(extractedLinkObj.index);
	else
		link = null;
	callback(link)
}

function treatExtractedDataQueueYoutube(tryArray, callback, discordMessageObject) {
	const link = tryArray;
	const voiceChannel = discordMessageObject.member.voiceChannel;

	if (!discordMessageObject.member.voiceChannel) {
		discordMessageObject.channel.sendMessage('**GO IN A VOICE CHANNEL U DEADASS**');
		return ;
	}
	if (!youtubeServerList[discordMessageObject.guild.id])
		youtubeServerList[discordMessageObject.guild.id] = {'queue' : []};
	youtubeServerList[discordMessageObject.guild.id].queue.push(link);
	if (!discordMessageObject.guild.voiceConnection) {
		discordMessageObject.member.voiceChannel.join().then((connection) => {
			playYoutubeAudioStream(connection, discordMessageObject);
		}).catch((err) => {
			console.error(err);
		});
	}
}

function treatExtractedDataSkipYoutube(callback, discordMessageObject) {
	skipQueuedSong(discordMessageObject);
	callback(null);
}

function skipQueuedSong(discordMessageObject) {
	const server = youtubeServerList[discordMessageObject.guild.id];

	if (server.dispatcher)
		server.dispatcher.end();
}

function treatExtractedDataStopYoutube(callback, discordMessageObject) {
	stopYoutubeQueue(discordMessageObject);
	callback(null);
}

function stopYoutubeQueue(discordMessageObject) {
	const server = youtubeServerList[discordMessageObject.guild.id];

	console.info('akoChan Stoped playing for connection' + discordMessageObject.guild.voiceConnection);
	if (discordMessageObject.guild.voiceConnection)
	{
		for (k = 0; k < server.queue.length; k++)
		{
			server.queue.shift();
			server.dispatcher.end();
		}

	}
}

function playYoutubeAudioStream(connection, discordMessageObject) {
	const server = youtubeServerList[discordMessageObject.guild.id];

	server.dispatcher = connection.playStream(ytdl(server.queue[0], {filter : 'audioonly', 'volume' : 0.25}));
	server.queue.shift();
	server.dispatcher.on('end', () => {
		if (server.queue[0])
			playYoutubeAudioStream(connection, discordMessageObject);
		else
			connection.disconnect();
	});
}

function treatExtractedDataSearchWikipedia(tryArray, callback) {
	let result = null;
	let previousEntryLength;
	let k = 0;
	let callsEnded = 0;
	const callsNeeded = tryArray.length;

	while (k < tryArray.length) {
		searchOnWiki(tryArray[k], (bundle) => {
			callsEnded++;
			if (!bundle.error)
			{
				if (result === null)
				{
					previousEntryLength = bundle.query.searchinfo.totalhits;
					result = bundle.query.search[0];
				}
				else if (previousEntryLength < bundle.query.searchinfo.totalhits)
					result = bundle.query.search[0];
			}
			if (callsNeeded <= callsEnded)
				callback(result);
		});
		k++;
	}
}

function treatExtractedDataSearchAnime(tryArray, callback) {
	let result = null;
	let previousEntryLength;
	let k = 0;
	let callsEnded = 0;
	const callsNeeded = tryArray.length;

	while (k < tryArray.length) {
		searchForAnime(tryArray[k], (bundle) => {
			callsEnded++;
			if (bundle !== null)
			{
				if (result === null)
				{
					previousEntryLength = bundle.anime.entry.length;
					result = bundle.anime.entry[0]
				}
				else if (previousEntryLength > bundle.anime.entry.length)
					result = bundle.anime.entry[0]
			}
			if (callsEnded >= callsNeeded)
				callback(result);
		});
		k++;
	}
}

function formulateAnswerToRollDice(tryArray, message) {
	var reply = uselessIntros[minMaxNum(0, uselessIntros.length)] + '\n';
	var sum = 0;

	for (var ss = 0; ss < tryArray.length; ss++)
	{
		var num = minMaxNum(1, tryArray[ss]);

		reply += '**D' + tryArray[ss] + ' : **' + ' *' + num + '*\n';
		sum += Number(num);
	}
	if (tryArray.length > 1)
		reply += '**__TOTAL :__** ' + sum;
	return (reply);
}


function dataExtractRollDice(message, reaction, callback) {
	var dices		= message.match(/D\d+/gi);
	var retCieling	= [];

	console.log(dices);
	for (var ss = 0; ss < dices.length; ss++)
		retCieling.push(dices[ss].match(/(\d+)/gi)[0]);
	callback(retCieling);
}

function dataExtractSearchAnime(message, reaction, callback) {
	let name = null;
	let messageArray = message.toLowerCase().split(' ');
	let returnArray = []

	for (let cP = 0; cP < reaction.contextPointers.length; cP++) {
		let j = messageArray.indexOf(reaction.contextPointers[cP]);

		if (j !== -1)
		{
			let tempArray = [];
			let tempInstruction = messageArray.slice(j + 1, messageArray.length);
			let k = tempInstruction.length

			while (k >= 0) {
				tempArray.push(tempInstruction.join(' '))
				tempInstruction.splice(-1, 1);
				k--;
			}
			returnArray = returnArray.concat(tempArray);
		}
	}
	if (callback !== undefined)
		callback(returnArray);
	else
		return (returnArray);
}

function minMaxNum(min, max) {
	return (Math.floor(Math.random() * max) + min)
}

function formulateAnswerToWikipediaSearch(wikiBundle, instruction) {
	let answer = ''

	if (wikiBundle !== null)
	{
		return (uselessIntros[minMaxNum(0, uselessIntros.length)] + '\n' + 
			'https://en.wikipedia.org/wiki/' + wikiBundle.title
			);
	}
	else
		return (formulateNegativeUnderstanding(instruction));
}

function formulateAnswerToAnimeSearch(animeBundle, instruction) {
	let answer = '';

	if (animeBundle !== undefined)
	{
		return (uselessIntros[minMaxNum(0, uselessIntros.length)] + '\n' + 
			'**Link**: https://myanimelist.net/anime/' + animeBundle.id._text + '\n' +
			'**Episodes**: ' + animeBundle.episodes._text + '\n' +
			'**Score**: ' + animeBundle.score._text + '\n' +
			'**Status**: ' + animeBundle.status._text + '\n'
		);
	}
	else
		return (formulateNegativeUnderstanding(instruction));
}

function formulateAnswerToWatchTogether() {
	return (uselessIntros[minMaxNum(0, uselessIntros.length)] + '\n' +
		'w2g Room : https://www.watch2gether.com/rooms/puddleplaceroom-y2kvrxfbgqr9269g7e'
		);
}

function formulateNegativeUnderstanding(message) {
	return ("What the fuck are you talking about when you say : " + message);
}

function searchOnWiki(query, callback) {
	request.get('https://en.wikipedia.org/w//api.php?action=query&format=json&list=search&utf8=1&srsearch=' + query.replace(/ /g, '+'), (err, res, body) => {
		if (err)
			callback(null);
		else
			callback(JSON.parse(body));
	});
}

function searchForAnime(name, callback) {
	const auth = {
		'pass'				: malCreditencial.psw,
		'user'				: malCreditencial.usr,
		'sendImmediately'	: true
	}

	request.get('https://myanimelist.net/api/anime/search.xml?q=' + name.replace(/ /g, '+'), (err, res, body) => {
		if (err)
			callback(null); //returning null object
		else {
			let bundle = JSON.parse(xtjConverter.xml2json(body, {compact: true}));
			callback(bundle);
		}
	}).auth(malCreditencial.usr, malCreditencial.psw, true);
}

function formulateAnswerToStopTheLewd() {
	return (lewdPicturesUrls[minMaxNum(0, lewdPicturesUrls.length)]);
}
