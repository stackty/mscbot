var builder = require('botbuilder');
var restify = require('restify');
var http = require('http');
var commandconnector = new builder.ConsoleConnector().listen();// for command line testing
var connector = new builder.ChatConnector({
	appId: '43e62488-4345-40fb-bfc5-b27c2d971688',
	appPassword: 'sQ0obOE8SKJpAC378S23Wvp'
});//for connecting to other platforms*/
console.log(connector);
var bot = new builder.UniversalBot(connector);

var model = 'https://api.projectoxford.ai/luis/v1/application?id=89663372-7a2a-4a40-b4d5-43ab37173df3&subscription-key=1ae1efdab0a54c389e5ec2fc0e74c738'
var recognizer = new builder.LuisRecognizer(model);
var cbotmodel = 'https://api.projectoxford.ai/luis/v1/application?id=292e773e-3c56-4545-a08d-6cb0708c5921&subscription-key=3e3f5b21d2064d7188ed8c5a55522c50'
var cbotrecognizer = new builder.LuisRecognizer(cbotmodel);
var dialog = new builder.IntentDialog({recognizers: [recognizer,cbotrecognizer]});

//server creation
var server = restify.createServer();

server.listen(process.env.port||process.env.PORT||3978, function(){
	console.log('%s listening to %s',server.name,server.url);
});
server.post('/api/messages/',connector.listen());//*/


bot.dialog('/',dialog);
dialog.onBegin(function(session, args,next){
	if(!session.userData.firstRun){
		session.userData.firstRun = true;
		session.replaceDialog('/firstRun');
	}else{
		next();
	}
});
dialog.matches('change',[function(session,args,next){
	if(args.entities.length<1){
		session.send("You did not say what you want to change");
	}else {
		args.entities.forEach(function(item){
			if (item.entity == 'name'){
				session.replaceDialog('/getName');
			}else if (item.entity == 'email'){
				session.replaceDialog('/getEmail');
			}else if (item.entity == 'age'){
				session.replaceDialog('/getAge');
			}
		});
	}
}]);
dialog.matches('delete', [function(session,args,next){
	session.send('got here');
	session.userData = [];
	session.replaceDialog('/');
}]);
dialog.matches('end',[function(session){
	session.endConversation('Thank you for your time!');
}]);
dialog.onDefault(function(session){
	if (!session.userData.name){
		session.replaceDialog('/getName');
	} else if(!session.userData.age){
		session.send('Hi nice to meet you %s!', session.userData.name);
	}
	if(!session.userData.age && session.userData.name){
		session.replaceDialog('/getAge');
	}
	if(!session.userData.email&&session.userData.name && session.userData.age){
		session.replaceDialog('/getEmail');
	}
	if(session.userData.email&&session.userData.name && session.userData.age){
		var user = session.userData.name+' \n Age: '+session.userData.age+' \n Email: '+session.userData.email;
		session.send('The Values you have entered are \nName: '+ user);
	}
});	
//Inital greeting
bot.dialog('/firstRun',function (session){
		session.send('Welcome to the bot.');
		session.send({attachments: [{contenttype: 'image/jpg', contenturl: 'http://www.muellerinc.com/gallery/building/image?view=image&format=raw&type=orig&id=708'}]});
		session.beginDialog('/');
});
//prompting user for their name
bot.dialog('/getName',[function(session){
	builder.Prompts.text(session, "Please enter your name");
}, function(session, results){
	session.userData.name = results.response;
	session.replaceDialog('/');
}
]);
// prompting user for their age (will reject anything that is not a number)
bot.dialog('/getAge', [function(session){
	builder.Prompts.number(session, 'Please enter your age:');
}, function (session, results){
	session.userData.age = results.response;
	session.replaceDialog('/');
}]);
//prompting user for their email (can be improved by requiring an @ and . to ensure it is an email address)
bot.dialog('/getEmail', [function(session){
	builder.Prompts.text(session, 'Please enter your email address.');
}, function (session, results){
	session.userData.email = results.response;
	session.replaceDialog('/');
}]);