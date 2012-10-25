var fs = require('fs');

function prepareRequest(req, res) {
	req.socket.setTimeout(Infinity);

	res.statusCode = 200;
	res.setHeader('Content-Type', 'text/event-stream');
	res.setHeader('Cache-Control', 'no-cache');
	res.setHeader('Connection', 'keep-alive');
}

module.exports = function (options) {
	options = options || {};

	var messageCount = 0;
	var retry        = parseInt(options.retry, 10) || 3000;

	if (options.express) {
		fs.readFile('client.js', function (error, data) {
			var clientJs;

			if (error) {
				throw error;
			}

			clientJs = data.toString();

			options.express.get('/sse.js', function (req, res) {
				res.statusCode = 200;
				res.setHeader('Content-Type', 'text/javascript');
				res.send(clientJs);
			});
		});
	}

	return function (req, res, next) {
		prepareRequest(req, res);

		res.sse = function (event, data) {
			if (data === undefined) {
				data  = event;
				event = null;
			} else {
				this.write('event: ' + event + '\n');
			}

			this.write('id: ' + messageCount + '\n');
			this.write('retry: ' + retry + '\n');
			this.write('data: ' + JSON.stringify(data) + '\n\n');

			messageCount++;
		};

		if (typeof next === 'function') {
			next();
		}
	};
};