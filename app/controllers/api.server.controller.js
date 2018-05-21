'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash');

/**
 * Extend user's controller
 */
module.exports = _.extend(
  require('./api/authenticate.server.controller'),
  require('./api/register.server.controller'),
	require('./api/users.server.controller'),
	require('./api/artists.server.controller'),
  require('./api/venues.server.controller'),
  require('./api/exhibitions.server.controller'),
  require('./api/galleries.server.controller'),
	require('./api/faker.server.controller'),
	require('./api/upload.server.controller'),
  require('./api/search.server.controller'),
  require('./api/location.server.controller'),
  require('./api/help.server.controller'),
  require('./api/miscellaneous.server.controller'),
  require('./api/settings.server.controller')
);
