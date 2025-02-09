const url = require('url');
const path = require('path');
const fs = require('fs');
const Discord = require('discord.js');
const express = require('express');
const app = express();
const passport = require('passport');
const session = require('express-session');
const Strategy = require('passport-discord').Strategy;
const md = require('marked');
const morgan = require('morgan');
const moment = require('moment');
require('moment-duration-format');

module.exports = (client) => {

	const dataDir = path.resolve(`${process.cwd()}${path.sep}dashboard`);

	const templateDir = path.resolve(`${dataDir}${path.sep}templates`);

	app.set('trust proxy', 5); 
	app.use('/public', express.static(path.resolve(`${dataDir}${path.sep}public`), { maxAge: '10d' }));
	app.use(morgan('combined')); 

	passport.serializeUser((user, done) => {
		done(null, user);
	});
	passport.deserializeUser((obj, done) => {
		done(null, obj);
	});
	var protocol;

	if (client.config.dashboard.secure === 'true') {
		client.protocol = 'https://';
	} else {
		client.protocol = 'http://';
	}

	protocol = client.protocol;

	client.callbackURL = `${protocol}${client.config.dashboard.domain}/callback`;
  console.log(`Callback URL: ${client.callbackURL}`, 'INFO')
	passport.use(new Strategy({
		clientID: '1338076110021464064',
		clientSecret: client.config.dashboard.oauthSecret,
		callbackURL: client.callbackURL,
		scope: ['identify', 'guilds']
	},
	(accessToken, refreshToken, profile, done) => {
		process.nextTick(() => done(null, profile));
	}));

	app.use(session({
		secret: client.config.dashboard.sessionSecret,
		resave: false,
		saveUninitialized: false,
	}));

	app.use(passport.initialize());
	app.use(passport.session());

	app.locals.domain = client.config.dashboard.domain;

	app.engine('html', require('ejs').renderFile);
	app.set('view engine', 'html');

	var bodyParser = require('body-parser');
	app.use(bodyParser.json()); 
	app.use(bodyParser.urlencoded({ 
		extended: true
	}));


	function checkAuth(req, res, next) {
		if (req.isAuthenticated()) return next();
		req.session.backURL = req.url;
		res.redirect('/login');
	}

	function cAuth(req, res) {
		if (req.isAuthenticated()) return;
		req.session.backURL = req.url;
		res.redirect('/login');
	}

	function checkAdmin(req, res, next) {
		if (req.isAuthenticated() && req.user.id === client.config.ownerID) return next();
		req.session.backURL = req.originalURL;
		res.redirect('/');
	}
  
	app.get('/', (req, res) => {
		if (req.isAuthenticated()) {
			res.render(path.resolve(`${templateDir}${path.sep}index.ejs`), {
				bot: client,
				auth: true,
				user: req.user
			});
		} else {
			res.render(path.resolve(`${templateDir}${path.sep}index.ejs`), {
				bot: client,
				auth: false,
				user: null
			});
		}
	});
  
  app.get('/servers', checkAuth, (req, res) => {
		const perms = Discord.Permissions;
		res.render(path.resolve(`${templateDir}${path.sep}servers.ejs`), {
			perms: perms,
			bot: client,
			user: req.user,
			auth: true
		});
	});
  
 app.get('/manage/:guildID/settings', checkAuth, (req, res) => {
		const guild = client.guilds.cache.get(req.params.guildID);
		if (!guild) return res.status(404);
		const isManaged = guild && !!guild.member(req.user.id) ? guild.member(req.user.id).permissions.has('MANAGE_GUILD') : false;
	if (client.config.ownerID.includes(req.user.id)) {
			console.log(`Admin bypass for managing server: ${req.params.guildID}`);
		} else if (!isManaged) {
	 res.end() 
   res.redirect('/servers')
		}
   ( async ()=> {
   let prefix = await client.vdb.get(`prefix-${guild.id}`);
   if(prefix == null)prefix = '??'
		res.render(path.resolve(`${templateDir}${path.sep}settings.ejs`), {
			bot: client,
			guild: guild,
			user: req.user,
			auth: true,
      prefix: prefix
		});
 }) ()
	});
  
	app.get('/manage/:guildID', checkAuth, (req, res) => {
		const guild = client.guilds.cache.get(req.params.guildID);
		if (!guild) return res.status(404);
		(async () =>{
		let ownerid = guild.ownerID
		ownerid;
        let owner = await client.users.fetch(ownerid)
		const isManaged = guild && !!guild.member(req.user.id) ? guild.member(req.user.id).permissions.has('MANAGE_GUILD') : false;
		if (client.config.ownerID.includes(req.user.id)) {
			console.log(`Admin bypass for managing server: ${req.params.guildID}`);
		} else if (!isManaged) {
	 res.end() 
   res.redirect('/servers')
		}
		res.render(path.resolve(`${templateDir}${path.sep}manage.ejs`), {
			bot: client,
			guild: guild,
			user: req.user,
			auth: true,
			owner: owner.tag
		});
	})()
	});
  
  app.get('/stats', checkAuth, (req, res) => {
		const perms = Discord.Permissions;
		res.render(path.resolve(`${templateDir}${path.sep}stats.ejs`), {
			perms: perms,
			bot: client,
			user: req.user,
			auth: true
		});
	});
  
	app.post('/check', checkAuth, (req, res) => {
		const perms = Discord.Permissions;
		const newpref = req.body.fname;
		console.log(req.body.gid)
		console.log(newpref)
		client.vdb.set(`prefix-${req.body.gid}`,newpref)
		res.render(path.resolve(`${templateDir}${path.sep}index.ejs`), {
			perms: perms,
			bot: client,
			user: req.user,
			auth: true
		});
	});

  app.get('/admin', checkAuth, (req, res) => {
if (client.config.ownerID.includes(req.user.id)) {
const perms = Discord.Permissions;
		res.render(path.resolve(`${templateDir}${path.sep}admin.ejs`), {
			perms: perms,
			bot: client,
			user: req.user,
			auth: true
		});
} else{
  res.redirect('/')
}
	});    
         app.get('/profile', checkAuth, (req, res) => {
    client.db.collection('Userinfo').doc(req.user.id).get().then((q) => {
   let cash;
   let bank;
   let limit;
   let premium;
   if(q.exists){
     cash = q.data().cash
     bank = q.data().bank
     limit = q.data().limit
     premium = q.data().premium
   }
if(!cash) cash = 0
if(!bank) bank = 0
if(!limit) limit = 2000
if(!premium) premium = false 
		const perms = Discord.Permissions;
		res.render(path.resolve(`${templateDir}${path.sep}profile.ejs`), {
			perms: perms,
			bot: client,
			user: req.user,
			auth: true,
            bal: cash,
            bank: bank,
            limit: limit,
            premium: premium
		})   
	})
        
    })
  
          app.get('/premium', checkAuth, (req, res) => {
    client.db.collection('Userinfo').doc(req.user.id).get().then((q) => {
   let premium;
   if(q.exists){
     premium = q.data().premium
   }
if(!premium)premium = false 
		const perms = Discord.Permissions;
		res.render(path.resolve(`${templateDir}${path.sep}premium.ejs`), {
			perms: perms,
			bot: client,
			user: req.user,
			auth: true,
      premium: premium
		})   
	}) 
    })
  
    app.get('/upgrade', checkAuth, (req, res) => {
    client.db.collection('Userinfo').doc(req.user.id).get().then((q) => {
   let cash;
   if(q.exists){
     cash = q.data().cash
   }
if(!cash) cash = 0
if(cash < 50000){
 	const perms = Discord.Permissions;
		res.render(path.resolve(`${templateDir}${path.sep}perror.ejs`), {
			perms: perms,
			bot: client,
			user: req.user,
			auth: true,
		})   
}else{
   const key = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  client.db.collection('Userinfo').doc(req.user.id).update({
  'cash' : cash -=50000
})
          client.db.collection('Premiums').doc("Keys").get().then((a) => {
        if(!a.exists){
          client.db.collection('Premiums').doc("Keys").set({
            'Keys' : key
          })
        }
            if(a.exists){
                client.db.collection('Premiums').doc("Keys").update({
            'Keys' : client.FieldValue.arrayUnion(key)
                })
            }
          })
  	const perms = Discord.Permissions;
  	res.render(path.resolve(`${templateDir}${path.sep}upgrade.ejs`), {
			perms: perms,
			bot: client,
			user: req.user,
			auth: true,
      key:key
		}) 
  
} 
	}) 
    })
  
  app.get('/add/:guildID', checkAuth, (req, res) => {
		req.session.backURL = '/dashboard';
		var invitePerm = client.config.dashboard.invitePerm;
		var inviteURL = `https://discordapp.com/oauth2/authorize?client_id=${client.user.id}&permissions=${invitePerm}&scope=bot`;
		if (client.guilds.has(req.params.guildID)) {
			res.send('<p>The bot is already there... <script>setTimeout(function () { window.location="/dashboard"; }, 1000);</script><noscript><meta http-equiv="refresh" content="1; url=/dashboard" /></noscript>');
		} else {
			res.redirect(inviteURL);
		}
	});
  
	app.get('/login', (req, res, next) => {
		if (req.session.backURL) {
			req.session.backURL = req.session.backURL;
		} else if (req.headers.referer) {
			const parsed = url.parse(req.headers.referer);
			if (parsed.hostname === app.locals.domain) {
				req.session.backURL = parsed.path;
			}
		} else {
			req.session.backURL = '/';
		}
		next();
	},
	passport.authenticate('discord'));

	app.get('/callback', passport.authenticate('discord', {
		failureRedirect: '/'
	}), (req, res) => {
		if (req.session.backURL) {
			res.redirect(req.session.backURL);
			req.session.backURL = null;
		} else {
			res.redirect('/');
		}
	});

	app.get('/logout', function (req, res) {
		req.logout()
		res.render(path.resolve(`${templateDir}${path.sep}index.ejs`), {
				bot: client,
				auth: false,
				user: null
			});
	});

	app.get('*', function(req, res) { 
	 res.send('<p>404 File Not Found. Please wait...<p> <script>setTimeout(function () { window.location = "/"; }, 1000);</script><noscript><meta http-equiv="refresh" content="1; url=/" /></noscript>');
   
	});
  
	client.site = app.listen(client.config.dashboard.port, function() {
		console.log(`Dashboard running on port ${client.config.dashboard.port}`, 'INFO');
	}).on('error', (err) => {
		console.log('ERROR', `Error with starting dashboard: ${err.code}`);
		return process.exit(0);
	});
};