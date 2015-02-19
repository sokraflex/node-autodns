node-autodns
============

NodeJS client for AutoDNS 3 13.1


API
===

```var AutoDNS = require('autodns');

// 4 => context-id, received by the InternetX administration for the api endpoint
var autodns = new AutoDNS('Username', 'Password', 4, 'en', 'my-contact@mail-adress.net', 'https://gateway.autodns.com');

autodns.getDomain('mydomain.com', function(err, domain) {
	if (err) throw err;
	console.log(domain); // general information about the domain, like adminc, techc, ownerc, ...
});

autodns.transferDomainIn({name: 'mydomain.com', authinfo: 'faduigr73284zrodjsa89'}, function(err, result) {
	if (err) throw err;
	console.log(result);
});```