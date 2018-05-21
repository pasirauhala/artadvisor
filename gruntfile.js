'use strict';

// Use polyfilll
require('es6-promise').polyfill();

var fs = require('fs');


module.exports = function(grunt) {
	// Unified Watch Object
	var watchFiles = {
		serverViews: ['app/views/**/*.*'],
		serverJS: ['gruntfile.js', 'server.js', 'config/**/*.js', 'app/**/*.js', '!app/tests/'],
		clientViews: ['public/modules/**/views/**/*.html'],

		clientJS: {
      admin: ['public/js/*.js', 'public/modules/admin/**/*.js'],
      main: ['public/js/*.js', 'public/modules/main/**/*.js']
    },
		clientCSS: ['public/modules/**/*.css'],
		sass: {
      admin: ['src/sass/admin/**/*.scss'],
      main: ['src/sass/main/**/*.scss']
    },

		mochaTests: ['app/tests/**/*.js']
	};

	// Project Configuration
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		watch: {
			serverViews: {
				files: watchFiles.serverViews/*,
				options: {
					livereload: true
				}*/
			},
			serverJS: {
				files: watchFiles.serverJS,
				tasks: ['jshint']/*,
				options: {
					livereload: true
				}*/
			},
			clientViews: {
				files: watchFiles.clientViews/*,
				options: {
					livereload: true
				}*/
			},
			clientJSAdmin: {
        files: watchFiles.clientJS.admin,
        tasks: ['jshint', 'concat:jsAdmin', 'uglify:jsAdmin']/*,
        options: {
          livereload: true
        }*/
      },
      clientJSMain: {
        files: watchFiles.clientJS.main,
        tasks: ['jshint', 'concat:jsMain', 'uglify:jsMain']/*,
        options: {
          livereload: true
        }*/
      },
      /**
       * Do not watch this since Sass is used for CSS
       *
			clientCSS: {
				files: watchFiles.clientCSS,
				tasks: ['csslint'],
				options: {
					livereload: true
				}
			},
      */
			sassAdmin: {
        files: watchFiles.sass.admin,
        tasks: ['sass:admin', 'cssmin:cssAdmin', 'postcss:admin']/*,
        options: {
          livereload: true
        }*/
      },
      sassMain: {
        files: watchFiles.sass.main,
        tasks: ['sass:main', 'cssmin:cssMain', 'postcss:main']/*,
        options: {
          livereload: true
        }*/
			},

			mochaTests: {
				files: watchFiles.mochaTests,
				tasks: ['test:server'],
			}
		},
		jshint: {
			all: {
				src: watchFiles.clientJS.admin.concat(watchFiles.clientJS.main).concat(watchFiles.serverJS),
				options: {
					jshintrc: true
				}
			}
		},
		csslint: {
			options: {
				csslintrc: '.csslintrc'
			},
			all: {
				src: watchFiles.clientCSS
			}
		},

    /*
		uglify: {
			production: {
				options: {
					mangle: false
				},
				files: {
					'public/dist/application.min.js': 'public/dist/application.js'
				}
			}
		},
		cssmin: {
			combine: {
				files: {
					'public/dist/application.min.css': '<%= applicationCSSFiles %>'
				}
			}
		},
    */

    copy: {
      localConfig: {
        src: 'config/env/local.example.js',
        dest: 'config/env/local.js',
        filter: function() {
          return !fs.existsSync('config/env/local.js');
        }
      },

      main: {
        files: [
          /*
          // Copy style images
          {
            expand: true,
            cwd: 'css/',
            src: ['images/*.*'],
            dest: '../../public/'
          },
          */
          // Fonts from bootstrap
          {
            expand: true,
            cwd: 'public/lib/bootstrap/dist/fonts/',
            src: ['*.*'],
            dest: 'public/style/fonts/'
          },
          // Fonts from font-awesome
          {
            expand: true,
            cwd: 'public/lib/font-awesome/fonts/',
            src: ['*.*'],
            dest: 'public/style/fonts/'
          },
          // Fonts from ionicons
          {
            expand: true,
            cwd: 'public/lib/ionicons/fonts/',
            src: ['*.*'],
            dest: 'public/style/fonts/'
          }
        ]
      }
    },

    /**
     * Sass files
     */
    sass: {
      admin: {
        files: [
          {
            expand: true,
            cwd: 'src/sass/admin',
            src: ['main.scss'],
            dest: 'public/style/admin',
            ext: '.css'
          }
        ]
      },
      main: {
        files: [
          {
            expand: true,
            cwd: 'src/sass/main',
            src: ['main.scss'],
            dest: 'public/style/main',
            ext: '.css'
          }
        ]
      }
    },

    concat: {

    	cssAdminVendor: {
        nonull: true,
    		src: [
    			'public/lib/bootstrap/dist/css/bootstrap.css',
    			'public/lib/bootstrap/dist/css/bootstrap-theme.css',
    			'public/lib/font-awesome/css/font-awesome.css',
    			'public/lib/ng-table/dist/ng-table.css',
    		],
    		dest: 'public/style/admin/vendor.css'
    	},
    	/**
       * Leave blank since this is handled by Sass
       *
    	cssAdmin: {

    	},
    	*/

    	cssMainVendor: {
        nonull: true,
    		src: [
    			'public/lib/font-awesome/css/font-awesome.css',
    			'public/lib/ionicons/css/ionicons.css'
    		],
    		dest: 'public/style/main/vendor.css'
    	},
      /**
       * Leave blank since this is handled by Sass
       *
    	cssMain: {

    	},
    	*/

    	jsAdminVendor: {
        nonull: true,
    		src: [
          'public/lib/jquery/dist/jquery.js',
    			'public/lib/angular/angular.js',
    			'public/lib/lodash/lodash.js',
    			'public/lib/angular-resource/angular-resource.js',
    			'public/lib/angular-animate/angular-animate.js',
    			'public/lib/angular-ui-router/release/angular-ui-router.js',
    			'public/lib/angular-ui-utils/ui-utils.js',
    			'public/lib/angular-bootstrap/ui-bootstrap-tpls.js',
    			'public/lib/ng-table/dist/ng-table.js',
    			'public/lib/ng-file-upload/ng-file-upload-all.js',
          'public/lib/moment/moment.js',
          'public/lib/angular-moment/angular-moment.js'
    		],
    		dest: 'public/script/admin/vendor.js'
    	},
    	jsAdmin: {
        nonull: true,
        src: [
          'public/modules/admin/config.js',
          'public/application.js',
          'public/modules/admin/admin.client.module.js',
          'public/modules/admin/config/admin.client.routes.js',

          'public/modules/admin/services/api.client.service.js',
          'public/modules/admin/services/authentication.client.service.js',

          'public/modules/admin/controllers/header.client.controller.js',
          'public/modules/admin/controllers/dashboard.client.controller.js',
          'public/modules/admin/controllers/users.client.controller.js',
          'public/modules/admin/controllers/artists.client.controller.js',
          'public/modules/admin/controllers/venues.client.controller.js',
          'public/modules/admin/controllers/venue.client.controller.js',
          'public/modules/admin/controllers/exhibitions.client.controller.js',
          'public/modules/admin/controllers/faker.client.controller.js'
        ],
        dest: 'public/script/admin/main.js'
    	},
    	jsMainVendor: {
        nonull: true,
    		src: [
    			'public/lib/jquery/dist/jquery.js',
    			'public/lib/angular/angular.js',
    			'public/lib/lodash/lodash.js',
    			'public/lib/angular-resource/angular-resource.js',
    			'public/lib/angular-animate/angular-animate.js',
          'public/lib/angular-google-maps/dist/angular-google-maps.js',
    			'public/lib/angular-ui-router/release/angular-ui-router.js',
    			'public/lib/angular-ui-utils/ui-utils.js',
    			'public/lib/moment/moment.js',
    			'public/lib/angular-moment/angular-moment.js',
    			'public/lib/angular-scroll/angular-scroll.js',
    			'public/lib/ngInfiniteScroll/build/ng-infinite-scroll.js',
    			'public/lib/jquery-bridget/jquery.bridget.js',
    			'public/lib/get-style-property/get-style-property.js',
    			'public/lib/get-size/get-size.js',
    			'public/lib/eventie/eventie.js',
    			'public/lib/doc-ready/doc-ready.js',
    			'public/lib/matches-selector/matches-selector.js',
    			'public/lib/fizzy-ui-utils/utils.js',
    			'public/lib/eventEmitter/EventEmitter.js',
    			'public/lib/outlayer/item.js',
    			'public/lib/outlayer/outlayer.js',
    			'public/lib/imagesloaded/imagesloaded.js',
    			'public/lib/masonry/masonry.js',
    			'public/lib/angular-masonry/angular-masonry.js',
    			'public/lib/hammerjs/hammer.js',
    			'public/lib/angular-hammer/angular-hammer.js',
          'public/lib/checklist-model/checklist-model.js',
          'public/lib/ng-file-upload/ng-file-upload-all.js',
          'public/lib/ng-tags-input/ng-tags-input.js',
          'public/lib/angular-mask/dist/ngMask.js',
          'public/lib/angularjs-geolocation/dist/angularjs-geolocation.min.js',
          'public/lib/angular-datepicker/dist/angular-datepicker.min.js',
          'public/lib/angular-tooltips/dist/angular-tooltips.min.js',
          'public/lib/angular-socialshare/dist/angular-socialshare.min.js',
          'public/lib/sly/dist/sly.js',
          'public/lib/jquery.cookie/jquery.cookie.js',
          'public/lib/offline/offline.js'
    		],
    		dest: 'public/script/main/vendor.js'
    	},
    	jsMain: {
        nonull: true,
        src: [
          'public/modules/main/config.js',
          'public/application.js',
          'public/modules/main/main.client.module.js',

          'public/modules/main/services/authentication.client.service.js',
          'public/modules/main/services/lang.client.service.js',
          'public/modules/main/services/middleware.client.service.js',
          'public/modules/main/services/api.client.service.js',
          'public/modules/main/services/location.client.provider.js',
          'public/modules/main/services/calendar.client.directive.js',
          'public/modules/main/services/comments.client.directive.js',
          'public/modules/main/services/redirector.client.directive.js',
          'public/modules/main/services/confirm.client.directive.js',
          'public/modules/main/services/popup.client.directive.js',
          'public/modules/main/services/photo.client.directive.js',

          'public/modules/main/services/carousel.client.directive.js',

          'public/modules/main/services/genres.client.factory.js',
          'public/modules/main/services/translations.client.factory.js',
          'public/modules/main/services/link.client.filter.js',
          'public/modules/main/services/lang.client.filter.js',
          'public/modules/main/services/money.client.filter.js',
          'public/modules/main/services/time.client.filter.js',
          'public/modules/main/services/distance.client.filter.js',
          'public/modules/main/services/openinghours.client.filter.js',
          'public/modules/main/services/openstatus.client.filter.js',
          'public/modules/main/services/escape.client.filter.js',

          'public/modules/main/services/main.client.filters.js',
          'public/modules/main/services/break.client.filter.js',

          'public/modules/main/services/thumb.client.filter.js',

          'public/modules/main/services/main.client.touch.js',
          'public/modules/main/services/maps.client.directive.js',
          'public/modules/main/services/maps.client.options.js',
          'public/modules/main/services/maps.client.responsive.js',
          'public/modules/main/services/modal.client.directive.js',
          'public/modules/main/services/share.client.directive.js',

          'public/modules/main/directives/slidingmenu.client.directive.js',
          'public/modules/main/services/offline.client.directive.js',
          'public/modules/main/services/location.client.directive.js',

          'public/modules/main/controllers/menu.client.controller.js',
          'public/modules/main/controllers/footer.client.controller.js',
          'public/modules/main/controllers/splash.client.controller.js',
          'public/modules/main/controllers/authentication.client.controller.js',
          'public/modules/main/controllers/feedback.client.controller.js',
          'public/modules/main/controllers/report.client.controller.js',
          'public/modules/main/controllers/invite.client.controller.js',
          'public/modules/main/controllers/forgot-password.client.controller.js',
          'public/modules/main/controllers/settings.client.controller.js',
          'public/modules/main/controllers/about-terms.client.controller.js',
          'public/modules/main/controllers/privacy-policy.client.controller.js',
          'public/modules/main/controllers/profile.client.controller.js',
          'public/modules/main/controllers/artcache.client.controller.js',
          'public/modules/main/controllers/landing/artview.client.controller.js',
          'public/modules/main/controllers/landing/artcache.client.controller.js',
          'public/modules/main/controllers/landing/now.client.controller.js',
          'public/modules/main/controllers/landing/favorites.client.controller.js',
          'public/modules/main/controllers/landing/lastchance.client.controller.js',

          'public/modules/main/controllers/venue.client.controller.js',
          'public/modules/main/controllers/venue/create.client.controller.js',
          'public/modules/main/controllers/venue/edit.client.controller.js',

          'public/modules/main/controllers/exhibition.client.controller.js',
          'public/modules/main/controllers/exhibition/create.client.controller.js',
          'public/modules/main/controllers/exhibition/edit.client.controller.js',

          'public/modules/main/controllers/artist.client.controller.js',
          'public/modules/main/controllers/search.client.controller.js',
          'public/modules/main/controllers/map.client.controller.js',

          'public/modules/main/config/main.client.routes.js' // Load this last
        ],
        dest: 'public/script/main/main.js'
    	}
    },

    postcss: {
      options: {
        map: {
          inline: false
        },
        processors: [
          require('pixrem')(), // add fallbacks for rem units
          require('autoprefixer')({
            browsers: '> 1%, last 2 versions, Firefox ESR, ios 7'
          })
        ]
      },
      admin: {
        src: 'public/style/admin/main.css'
      },
      main: {
        src: 'public/style/main/main.css'
      }
    },

    cssmin: {
      cssAdminVendor: {
        src: 'public/style/admin/vendor.css',
        dest: 'public/style/admin/vendor.min.css'
      },
      cssAdmin: {
        src: 'public/style/admin/main.css',
        dest: 'public/style/admin/main.min.css'
      },
      cssMainVendor: {
        src: 'public/style/main/vendor.css',
        dest: 'public/style/main/vendor.min.css'
      },
      cssMain: {
        src: 'public/style/main/main.css',
        dest: 'public/style/main/main.min.css'
      }
    },
    uglify: {
      jsAdminVendor: {
        files: {
          'public/script/admin/vendor.min.js': ['public/script/admin/vendor.js']
        }
      },
      jsAdmin: {
        files: {
          'public/script/admin/main.min.js': ['public/script/admin/main.js']
        }
      },
      jsMainVendor: {
        files: {
          'public/script/main/vendor.min.js': ['public/script/main/vendor.js']
        }
      },
      jsMain: {
        files: {
          'public/script/main/main.min.js': ['public/script/main/main.js']
        }
      }
    },

		nodemon: {
			dev: {
				script: 'server.js',
				options: {
					nodeArgs: ['--debug'],
					ext: 'js,html',
					watch: /*watchFiles.serverViews.concat(*/watchFiles.serverJS/*)*/
				}
			}
		},

		'node-inspector': {
			custom: {
				options: {
					'web-port': 1337,
					'web-host': 'localhost',
					'debug-port': 5858,
					'save-live-edit': true,
					'no-preload': true,
					'stack-trace-limit': 50,
					'hidden': []
				}
			}
		},
		ngAnnotate: {
			production: {
				files: {
					'public/dist/application.js': '<%= applicationJavaScriptFiles %>'
				}
			}
		},
		concurrent: {
			default: ['nodemon', 'watch'],
			debug: ['nodemon', 'watch', 'node-inspector'],
			options: {
				logConcurrentOutput: true,
				limit: 10
			}
		},
		env: {
			test: {
				NODE_ENV: 'test'
			},
			secure: {
				NODE_ENV: 'secure'
			}
		},
		mochaTest: {
			src: watchFiles.mochaTests,
			options: {
				reporter: 'spec',
				require: 'server.js'
			}
		},
		karma: {
			unit: {
				configFile: 'karma.conf.js'
			}
		}
	});

	// Load NPM tasks
	require('load-grunt-tasks')(grunt);
	// Load grunt contrib sass
	grunt.loadNpmTasks('grunt-contrib-sass');
	// Make sure to load these
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-copy');

  //grunt.loadNpmTasks('grunt-contrib-cssmin');
  //grunt.loadNpmTasks('grunt-contrib-uglify');
  //grunt.loadNpmTasks('grunt-contrib-watch');

	// Making grunt default to force in order not to break the project.
	grunt.option('force', true);

	// A Task for loading the configuration object
	grunt.task.registerTask('loadConfig', 'Task that loads the config into a grunt option.', function() {
		var init = require('./config/init')();
		var config = require('./config/config');

		grunt.config.set('applicationJavaScriptFiles', config.assets.js);
		grunt.config.set('applicationCSSFiles', config.assets.css);
	});

	// Default task(s).
	grunt.registerTask('default', [
		'lint',
		'copy:localConfig',
		'concurrent:default'
	]);

	// Debug task.
	grunt.registerTask('debug', ['lint', 'copy:localConfig', 'concurrent:debug']);

	// Secure task(s).
	grunt.registerTask('secure', ['env:secure', 'lint', 'copy:localConfig', 'concurrent:default']);

	// Lint task(s).
	grunt.registerTask('lint', ['jshint', 'csslint']);

	// Build task(s).
	grunt.registerTask('build', [
    'lint',
    'loadConfig',
    //'ngAnnotate',
    'copy:main',
    'sass',
    'postcss',
    'concat',
    'cssmin',
    'uglify'
  ]);

	// Test task.
	grunt.registerTask('test', ['copy:localConfig', 'test:server', 'test:client']);
	grunt.registerTask('test:server', ['env:test', 'mochaTest']);
	grunt.registerTask('test:client', ['env:test', 'karma:unit']);
};
