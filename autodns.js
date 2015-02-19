var async = require('async'),
	https = require('https'),
	js2xmlparser = require('js2xmlparser'),
	url = require('url'),
	xml2js = require('xml2js');

var autodns = function(user, password, context, language, email, baseUrl) {
	this.user = user;
	this.password = password;
	this.context = context;
	this.language = language || 'en';
	this.email = email;
	this.baseUrl = baseUrl || 'https://gateway.autodns.com';
};

/**
 * Methods giving you data.
 */
autodns.prototype.getDefaultNameservers = function() {
	return [
		{name: 'a.ns14.net'},
		{name: 'b.ns14.net'},
		{name: 'c.ns14.net'},
		{name: 'd.ns14.net'}
	];
};

/**
 * API Methods.
 */

/** DOMAINS **/
autodns.prototype.getDomain = function(options, callback) {
	if (typeof options === 'string') options = {name: options};
	if (Array.isArray(options)) return this.getDomains(options, callback);

	var data = this._sign('0105', 'domain', options);
	this._request(data, function(err, response) {
		if (err) return callback(err);
		callback(false, response.data.domain);
	});
};

autodns.prototype.transferDomainIn = function(defaults, options, callback) {
	if (!callback) {
		callback = options;
		options = defaults;
		defaults = null;
	}
	if (!Array.isArray(options)) options = [options];

	var data = this._sign('0104', 'domain', options, defaults, {replyTo: true});
	this._request(data, function(err, response) {
		if (err) return callback(err);
		callback(false, response.status);
	});
};

/**
 * Convenience methods, making all things a little bit easier for users.
 */
autodns.prototype.getDomains = function(domains, callback) {
	var results = [];
	async.each(domains, function(domain, next) {
		this.getDomain(domain, function(err, data) {
			if (err) results.push(err);
			else results.push(data);
			next();
		});
	}.bind(this), function(err) {
		if (err) return callback(err);
		callback(false, results);
	});
};

/** ZONES **/
autodns.prototype.createZone = function(defaults, data, callback) {
	if (!callback) {callback = data; data = defaults; defaults = null;}

	var data = this._sign('0201', 'zone', data, defaults);
	this._request(data, function(err, response) {
		if (err) return callback(err);
		callback(false, response.status);
	})
};

autodns.prototype.deleteZone = function(data, callback) {
	if (typeof data === 'string') data = {name: data};

	var data = this._sign('0203', 'zone', data);
	this._request(data, function(err, response) {
		if (err) return callback(err);
		callback(false, response.status);
	})
};

autodns.prototype.getZone = function(data, callback) {
	if (typeof data === 'string') data = {name: data};

	var data = this._sign('0205', 'zone', data);
	this._request(data, function(err, response) {
		if (err) return callback(err);
		callback(false, response.data.zone);
	})
};

autodns.prototype.listZones = function(viewOptions, whereOptions, keys, callback) {
	var data = this._sign({code: '0205', view: viewOptions, where: whereOptions, key: keys});
	this._request(data, function(err, response) {
		if (err) return callback(err);
		callback(false, response.data.zone);
	})
}

autodns.prototype.updateZone = function(defaults, data, callback) {
	if (!callback) {callback = data; data = defaults; defaults = null;}

	var data = this._sign('0202', 'zone', data, defaults);
	this._request(data, function(err, response) {
		if (err) return callback(err);
		callback(false, response.status);
	})
};

/**
 * Internal methods
 * Only for our private use, just to make this whole thing work and easy for us to develop
 */
autodns.prototype._sign = function(code, objectType, data, defaults, options) {
	if (!options) options = {};

	var request = {
		auth: this._getAuth(),
		language: this.language,
		task: {
			code: code
		}
	};
	if (!(typeof code === 'string')) request.task = code;	
	if (defaults) request.task['default'] = defaults;
	if (objectType) request.task[objectType] = data;

	if (options.replyTo) request.task.reply_to = this.email;
	return js2xmlparser('request', request);
}

autodns.prototype._getAuth = function() {
	return {
		user: this.user,
		password: this.password,
		context: this.context
	};
}

/**
 * Executes the actual https requests.
 * Give the request data to this method (as a string containing a valid xml document).
 * It will call the callback when done.
 * callback(err, data)
 *	err => either some error from the http client
 		or the erronous part of the response from AutoDNS, formatted as an Object, starting in the <response><result>-Tag.
 			Contains "msg" and "status". For more see AutoDNS documentation.
 	data => response from AutoDNS, formatted as an Object, starting in the <response><result><data><domain_or_contact_or_...>-Tag
 */
autodns.prototype._request = function(data, callback) {
	var options = url.parse(this.baseUrl, false);
	options.method = 'POST';
	var request = https.request(options, function(res) {
			res.setEncoding('UTF-8');
			var response = '';
			res.on('end', function(err) {
				if (err) return callback(err);

				console.log(response);
				xml2js.parseString(response, {explicitArray: false}, function(err, result) {
					if (err) return callback(err, result);

					if (result.response.result.status.code.charAt(0) == 'E') return callback(result.response.result);
					callback(false, result.response.result);
				});
			});
			res.on('data', function(chunk) {
				response += chunk;
			});
		});
	request.write(data);
	request.end();
}

module.exports = autodns;