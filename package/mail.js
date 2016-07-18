var nodemailer = require('nodemailer');

module.exports = function(from, to, subject, msg, callback) {
	var transporter = nodemailer.createTransport('smtps://user%40gmail.com:pass@smtp.gmail.com');

	// setup e-mail data with unicode symbols
	var mailOptions = {
		'from': from,
		'to': to,
		'subject': subject,
		'text': msg
	};

	// send mail with defined transport object
	transporter.sendMail(mailOptions, function(error, info){
		callback(error, info);
	});
};
