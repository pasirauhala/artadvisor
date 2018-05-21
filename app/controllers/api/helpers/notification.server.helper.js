'use strict';

var mandrill = require('mandrill-api/mandrill'),
    mandrillClient = new mandrill.Mandrill('0y5MaNkCtH_6yf1EeHhiSw'),
    str = require('./str.server.helper'),
    approot = require('app-root-path'),

    nodemailer = require('nodemailer'),
    transporter = nodemailer.createTransport();

var translateRecipients = function(recipients) {
  // Set to
  var to = [];

  if (typeof recipients === 'string') {
    // Extract email
    var arr = recipients.split('<');

    // If no 1
    if (typeof arr[1] === 'undefined') {
      // To is only email
      to.push({
        email: arr[0],
        type: 'to'
      });
    } else {
      // Get email and name
      to.push({
        email: arr[1].split('>')[0],
        name: arr[0].trim(),
        type: 'to'
      });
    }
  } else if (typeof recipients === 'object') {
    // Check if array
    if (recipients instanceof Array) {
      // Loop
      for (var i in recipients) {
        // Translated
        var translated = translateRecipients(recipients[i]);
        // Loop
        for (var j in translated) {
          // Push
          to.push(translated[j]);
        }
      }
    } else {
      // Check for email and name
      var recipient = {
        email: recipients.email || null,
        type: 'to'
      };
      if (recipients.name) {
        recipient.name = recipients.name;
      }
      // If there's no email
      if (!recipient.email) {
        return [];
      }
      // Push
      to.push(recipient);
    }
  } else {
    return [];
  }
  // Return
  return to;
};

var replaceArgs = function(content, args) {
  // Loop through args
  if (args) {
    for (var i in args) {
      // Replace
      content = str.str_replace('{{ ' + i + ' }}', args[i], content);
    }
  }
  // Return
  return content;
};

var createSafeArgs = function(args) {
  // Add safe
  if (args) {
    // Safe
    var raw = {}, safe = {};
    // Loop through args
    for (var i in args) {
      // If there's no _
      if (i.charAt(0) !== '_') {
        // Add to args
        safe['_' + i] = str.htmlentities(args[i]);
        raw[i] = args[i];
      } else {
        // Add to safe (overwrite)
        safe[i] = args[i];
      }
    }
    // Empty args
    args = {};
    // Loop through raw and safe
    if (safe) {
      for (var j in safe) {
        args[j] = safe[j];
      }
    }
    if (raw) {
      for (var k in raw) {
        args[k] = raw[k];
      }
    }
  }
  return args;
};

exports.template = function(name, args) {
  // Safe args
  var safeArgs = createSafeArgs(args);

  // Return
  return {
    html: replaceArgs(str.file_get_contents(approot.path + '/app/controllers/api/templates/email/' + name + '.html'), safeArgs),
    text: replaceArgs(str.file_get_contents(approot.path + '/app/controllers/api/templates/email/' + name + '.txt'), safeArgs)
  };
};

exports.email = function(recipients, subject, content, done) {

  var to = translateRecipients(recipients);
  // If nothing
  if (!to || !to.length) {
    // Error
    if (done) {
      done('Invalid recipient/s');
    }
    return false;
  }

  /*
  // Create message
  var message = {
    html: content.html || content.text || content,
    text: content.text || content,
    subject: subject,
    from_name: 'Art Advisor',
    from_email: 'support@artadvisor.fi',
    to: to
  };

  // Send message
  mandrillClient.messages.send({
    message: message
  }, function(result) {
    if (done) {
      done(null, result);
    }
  }, function(error) {
    if (done) {
      done(error);
    }
  });
  */

  var recipientToString = function(recips) {
    // The stirng
    var arrStr = [];
    // Loop 
    recips.forEach(function(recip) {
      // Add 
      var str = recip.email;
      // If there's name
      if (recip.name) {
        // Prepend name
        str = recip.name + ' <' + str + '>';
      }
      // Append to arrStr
      arrStr.push(str);
    });
    // Return
    return arrStr.join(', ');
  };

  // Set message
  var message = {
    html: content.html || content.text || content,
    text: content.text || content,
    subject: subject,
    from: 'Art Advisor <support@artadvisor.fi>',
    to: recipientToString(to)
  };

  transporter.sendMail(message, function(error, info) {
    // If there's error
    if (error) {
      // Send only error
      done(error);
    } else {
      // Send info
      done(null, info);
    }
  });

};