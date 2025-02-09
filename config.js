const config = {
  "ownerID": ["685506829228179515"],
  'token': 'MTMzODA3NjExMDAyMTQ2NDA2NA.GPxd-9.MOJZjR9WbokSgPxq2Bon1QIXg62sUkufdl4p8o', 
  'prefix': '..', 
  
   dashboard: {
		enabled: 'true',
		oauthSecret: 'yTfyxpgF6lcEuDXhd1TBBV7YFfCQoT-q',
		secure:'false', 
		sessionSecret: 'supersecretpass', 
		domain: 'localhost:3000', 
		port:  process.env.PORT || 3000, 
		invitePerm: '536079575', 
		protectStats: 'true', 
		borderedStats: 'true', 
  }

}

module.exports = config
