'use strict';

var mongoose = require('mongoose'),
    moment = require('moment'),
    Iconv = require('iconv').Iconv;

exports.unicodeToAscii = function(string) {
  // Create iconv object
  var iconv = new Iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE');
  // Set permalink
  return iconv.convert(string).toString();
};

exports.permalink = function(name) {
  // Return
  return exports.unicodeToAscii(name).toLowerCase().trim()
          .replace(/\s/g, '-')
          .replace(/[^A-Za-z0-9\-]/g, '');
};

exports.filename = function(filename) {
  // Return
  return exports.unicodeToAscii(filename).trim()
          .replace(/\s/g, '-')
          .replace(/[^A-Za-z0-9\-_]/g, '');
};

/**
 * Get model
 */
exports.getModel = function(rawModel) {
  // Select which raw model
  switch (rawModel) {
    case 'user': 
    case 'admin':
    case 'artist': return mongoose.model('User');
    case 'venue': return mongoose.model('Venue');
    case 'exhibition': return mongoose.model('Exhibition');
    case 'album': return mongoose.model('Album');
    case 'photo': return mongoose.model('Photo');
    case 'gallery': return mongoose.model('Gallery');
    case 'token': return mongoose.model('Token');
    case 'search': return mongoose.model('Search');
    case 'comment': return mongoose.model('Comment');
    case 'setting': return mongoose.model('Setting');
  }
};

/** 
 * Random number
 */
exports.number = function(low, high) {
  // Randomize
  return Math.floor(Math.random() * (high - low + 1) + low);
};

/**
 * Shuffle an array
 */
exports.shuffle = function(o){
  for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
  return o;
};

/**
 * Text
 */
exports.text = function(length, chars) {
  // If there's no chars
  if (!chars) {
    // Set default
    chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  }
  // Set text
  var text = '', len = chars.length, i = 0;
  // Loop through length
  for (; i < length; i++) {
    text += chars[exports.number(0, len - 1)];
  }
  // Return text
  return text;
};

/**
 * Genres
 */
exports.genres = function(length) {
  // Set genres
  var genres = [
    'body art',
    'ceramic art',
    'collage',
    'comics',
    'digital art',
    'drawing',
    'film',
    'games',
    'glass art',
    'graffiti',
    'illustration',
    'installation art',
    'land art',
    'media art',
    'painting',
    'performance art',
    'photography',
    'printmaking',
    'sculpture',
    'site specific',
    'textile',
    'video art',
    'other'
  ];
  // Shuffle
  exports.shuffle(genres);
  // If length
  if (length > genres.length) {
    length = genres.length;
  }
  if (length < 1) {
    length = 1;
  } 
  // Return
  return genres.slice(0, length).sort();
};

/**
 * First name
 */
exports.firstName = function() {
  // Set last names
  var firstNames = ['Aaron', 'Abel', 'Abraham', 'Adam', 'Adrian', 'Adrienne', 'Al', 'Alan', 'Alexander', 'Alfonso', 'Alfred', 'Alfredo', 'Alicia', 'Allen', 'Allison', 'Amy', 'Andrea', 'Andrew', 'Angel', 'Ann', 'Annette', 'Antoinette', 'Antonia', 'Antonio', 'Archie', 'Arlene', 'Audrey', 'Austin', 'Barbara', 'Beatrice', 'Belinda', 'Benjamin', 'Bennie', 'Bernard', 'Beth', 'Bethany', 'Betsy', 'Betty', 'Beulah', 'Beverly', 'Billie', 'Blanca', 'Blanche', 'Bobbie', 'Bonnie', 'Brad', 'Bradford', 'Brandon', 'Brenda', 'Brent', 'Brian', 'Bridget', 'Bruce', 'Bryan', 'Bryant', 'Camille', 'Candice', 'Carla', 'Carlos', 'Carlton', 'Carmen', 'Carol', 'Carole', 'Carolyn', 'Catherine', 'Cecil', 'Cedric', 'Charles', 'Chelsea', 'Chester', 'Christie', 'Christina', 'Christopher', 'Clark', 'Clay', 'Clinton', 'Colin', 'Colleen', 'Conrad', 'Constance', 'Cornelius', 'Courtney', 'Cynthia', 'Daisy', 'Dan', 'Dana', 'Daniel', 'Danielle', 'Darin', 'Darnell', 'Darrel', 'Darrell', 'Darren', 'Darryl', 'Dave', 'Dean', 'Della', 'Delores', 'Denise', 'Derrick', 'Dewey', 'Dexter', 'Diana', 'Diane', 'Dianna', 'Dolores', 'Dominic', 'Dominick', 'Donna', 'Dora', 'Doreen', 'Doris', 'Dorothy', 'Drew', 'Dustin', 'Earl', 'Earnest', 'Ebony', 'Eddie', 'Edgar', 'Edith', 'Eduardo', 'Elbert', 'Elijah', 'Elizabeth', 'Ellis', 'Elmer', 'Elsa', 'Emilio', 'Emily', 'Eric', 'Erick', 'Erma', 'Ernest', 'Ernestine', 'Estelle', 'Ethel', 'Eva', 'Everett', 'Faith', 'Fannie', 'Felipe', 'Flora', 'Floyd', 'Frances', 'Francis', 'Frank', 'Franklin', 'Fred', 'Frederick', 'Gail', 'Garrett', 'Gayle', 'Gene', 'George', 'Geraldine', 'Gerardo', 'Gertrude', 'Ginger', 'Glenn', 'Grant', 'Gregory', 'Gretchen', 'Guadalupe', 'Guillermo', 'Gwendolyn', 'Harry', 'Holly', 'Hope', 'Horace', 'Howard', 'Hubert', 'Ian', 'Ida', 'Inez', 'Ira', 'Iris', 'Irving', 'Isabel', 'Ismael', 'Israel', 'Ivan', 'Jack', 'Jaime', 'James', 'Jamie', 'Jana', 'Janice', 'Janis', 'Jared', 'Jason', 'Jay', 'Jean', 'Jeannette', 'Jeff', 'Jenny', 'Jerome', 'Jessie', 'Jill', 'Jim', 'Jimmy', 'Joan', 'Joel', 'John', 'Johnathan', 'Johnnie', 'Jon', 'Jonathon', 'Jose', 'Josefina', 'Julia', 'Kari', 'Karl', 'Katherine', 'Kathleen', 'Kathryn', 'Kathy', 'Katie', 'Katrina', 'Kay', 'Kelly', 'Ken', 'Kent', 'Kerry', 'Kim', 'Kristen', 'Kristopher', 'Kristy', 'Lana', 'Lance', 'Larry', 'Latoya', 'Lauren', 'Laurie', 'Laverne', 'Leah', 'Lee', 'Leon', 'Leonard', 'Leroy', 'Lester', 'Levi', 'Lila', 'Lindsay', 'Lindsey', 'Lionel', 'Lola', 'Loren', 'Lorenzo', 'Lowell', 'Lucas', 'Lucy', 'Lydia', 'Lyle', 'Lynda', 'Lynette', 'Lynn', 'Lynne', 'Mabel', 'Malcolm', 'Manuel', 'Marc', 'Marcella', 'Marco', 'Margaret', 'Margarita', 'Marguerite', 'Marian', 'Marianne', 'Marie', 'Marilyn', 'Marion', 'Marshall', 'Martha', 'Martin', 'Marty', 'Maryann', 'Mattie', 'Maureen', 'Maxine', 'Melanie', 'Melinda', 'Melissa', 'Melody', 'Melvin', 'Meredith', 'Merle', 'Michael', 'Micheal', 'Michele', 'Michelle', 'Miguel', 'Mindy', 'Miranda', 'Miriam', 'Misty', 'Mitchell', 'Molly', 'Mona', 'Monique', 'Moses', 'Myron', 'Nadine', 'Nathan', 'Nathaniel', 'Nicholas', 'Nichole', 'Nick', 'Nora', 'Norma', 'Olga', 'Ollie', 'Orlando', 'Orville', 'Otis', 'Pat', 'Patsy', 'Patty', 'Paula', 'Paulette', 'Penny', 'Perry', 'Pete', 'Peter', 'Phil', 'Philip', 'Priscilla', 'Rachael', 'Rafael', 'Ramiro', 'Ramona', 'Randolph', 'Raul', 'Ray', 'Raymond', 'Rebecca', 'Reginald', 'Rene', 'Renee', 'Rhonda', 'Richard', 'Roberta', 'Roberto', 'Robin', 'Roderick', 'Rogelio', 'Roman', 'Roosevelt', 'Rosemary', 'Ross', 'Roxanne', 'Ruben', 'Rudolph', 'Rudy', 'Russell', 'Sabrina', 'Salvatore', 'Sammy', 'Santiago', 'Sara', 'Sarah', 'Shari', 'Sharon', 'Shaun', 'Shelia', 'Shelley', 'Sherman', 'Simon', 'Sonja', 'Sonya', 'Sophie', 'Stacey', 'Stanley', 'Steve', 'Steven', 'Stewart', 'Susan', 'Tanya', 'Ted', 'Terence', 'Terrance', 'Terrence', 'Terri', 'Thelma', 'Timmy', 'Toby', 'Tom', 'Tommy', 'Tonya', 'Tracey', 'Trevor', 'Van', 'Vickie', 'Vincent', 'Violet', 'Virgil', 'Virginia', 'Wade', 'Walter', 'Wendy', 'Whitney', 'Wilbur', 'Willie', 'Winston', 'Woodrow', 'Yolanda', 'Yvette', 'Yvonne'];
  // Generate
  return firstNames[exports.number(0, firstNames.length - 1)];
};

/**
 * Last name
 */
exports.lastName = function() {
  // Set last names
  var lastNames = ['Abbott', 'Adkins', 'Aguilar', 'Alexander', 'Allison', 'Alvarado', 'Alvarez', 'Anderson', 'Andrews', 'Armstrong', 'Arnold', 'Austin', 'Baker', 'Ball', 'Ballard', 'Banks', 'Barber', 'Barnes', 'Barnett', 'Barrett', 'Barton', 'Bass', 'Bates', 'Beck', 'Becker', 'Berry', 'Black', 'Blair', 'Boone', 'Bowers', 'Bowman', 'Boyd', 'Bradley', 'Bridges', 'Briggs', 'Brooks', 'Brown', 'Bryan', 'Bryant', 'Burgess', 'Burke', 'Burns', 'Bush', 'Caldwell', 'Campbell', 'Carlson', 'Carpenter', 'Carroll', 'Carson', 'Carter', 'Castro', 'Chandler', 'Chavez', 'Christensen', 'Clarke', 'Clayton', 'Cole', 'Coleman', 'Collier', 'Collins', 'Colon', 'Conner', 'Cook', 'Cooper', 'Copeland', 'Cox', 'Crawford', 'Cross', 'Cummings', 'Cunningham', 'Curry', 'Curtis', 'Daniels', 'Davidson', 'Davis', 'Dawson', 'Day', 'Dean', 'Diaz', 'Dixon', 'Douglas', 'Doyle', 'Drake', 'Duncan', 'Dunn', 'Edwards', 'Erickson', 'Estrada', 'Evans', 'Farmer', 'Ferguson', 'Fields', 'Figueroa', 'Fisher', 'Fitzgerald', 'Fleming', 'Fletcher', 'Flores', 'Floyd', 'Ford', 'Foster', 'Fowler', 'Francis', 'Franklin', 'Freeman', 'French', 'Fuller', 'Gardner', 'Garner', 'Garrett', 'Garza', 'George', 'Gilbert', 'Gill', 'Glover', 'Gomez', 'Goodman', 'Goodwin', 'Gordon', 'Graham', 'Grant', 'Green', 'Greene', 'Greer', 'Gregory', 'Griffin', 'Griffith', 'Gross', 'Guerrero', 'Gutierrez', 'Hansen', 'Hanson', 'Harmon', 'Harrington', 'Harrison', 'Hawkins', 'Hayes', 'Henderson', 'Henry', 'Hernandez', 'Herrera', 'Higgins', 'Hill', 'Hines', 'Hogan', 'Holloway', 'Holmes', 'Holt', 'Horton', 'Houston', 'Hubbard', 'Huff', 'Hunt', 'Jackson', 'Jefferson', 'Jenkins', 'Jennings', 'Jensen', 'Jimenez', 'Johnson', 'Johnston', 'Jones', 'Jordan', 'Keller', 'Kelley', 'Kim', 'King', 'Klein', 'Knight', 'Lamb', 'Lambert', 'Lane', 'Larson', 'Lawrence', 'Lawson', 'Lindsey', 'Lloyd', 'Logan', 'Long', 'Lopez', 'Love', 'Lucas', 'Luna', 'Lynch', 'Lyons', 'Mack', 'Maldonado', 'Mann', 'Marsh', 'Marshall', 'Martin', 'Martinez', 'Mason', 'Maxwell', 'May', 'Mcbride', 'Mccarthy', 'Mcgee', 'Mcguire', 'Mckinney', 'Mclaughlin', 'Medina', 'Mendez', 'Meyer', 'Miles', 'Miller', 'Montgomery', 'Moody', 'Morales', 'Moreno', 'Morgan', 'Morrison', 'Morton', 'Moss', 'Mullins', 'Munoz', 'Murray', 'Myers', 'Nash', 'Neal', 'Nelson', 'Newton', 'Norris', 'Norton', 'Obrien', 'Oliver', 'Olson', 'Ortega', 'Ortiz', 'Osborne', 'Owens', 'Palmer', 'Park', 'Parks', 'Patrick', 'Patterson', 'Patton', 'Paul', 'Pearson', 'Pena', 'Perkins', 'Perry', 'Peterson', 'Phelps', 'Phillips', 'Pierce', 'Pittman', 'Pope', 'Porter', 'Potter', 'Powers', 'Pratt', 'Price', 'Ramsey', 'Ray', 'Reed', 'Reese', 'Rhodes', 'Rice', 'Richardson', 'Riley', 'Rios', 'Robbins', 'Roberson', 'Robertson', 'Robinson', 'Rodriguez', 'Rodriquez', 'Rogers', 'Rose', 'Rowe', 'Roy', 'Ruiz', 'Salazar', 'Sanchez', 'Sanders', 'Sandoval', 'Santiago', 'Saunders', 'Schmidt', 'Schneider', 'Schultz', 'Schwartz', 'Scott', 'Sharp', 'Shaw', 'Sherman', 'Silva', 'Simmons', 'Simon', 'Sims', 'Snyder', 'Soto', 'Spencer', 'Stanley', 'Steele', 'Stephens', 'Stevens', 'Stokes', 'Strickland', 'Summers', 'Sutton', 'Tate', 'Taylor', 'Terry', 'Thomas', 'Thompson', 'Thornton', 'Todd', 'Torres', 'Townsend', 'Tran', 'Tucker', 'Turner', 'Underwood', 'Valdez', 'Vargas', 'Vaughn', 'Vega', 'Wade', 'Wagner', 'Walker', 'Wallace', 'Walters', 'Walton', 'Ward', 'Warner', 'Warren', 'Washington', 'Watkins', 'Watson', 'Weaver', 'Webb', 'Weber', 'Webster', 'Welch', 'White', 'Wilkerson', 'Wilkins', 'Williams', 'Williamson', 'Willis', 'Wilson', 'Wise', 'Wong', 'Wood', 'Woods', 'Young'];
  // Generate
  return lastNames[exports.number(0, lastNames.length - 1)];
};

/** 
 * Random name
 */
exports.name = function() {
  // Return random name
  return {
    first: exports.firstName(),
    last: exports.lastName()
  };
};

/**
 * Contacts
 */
exports.contact = function() {
  // Generate random number
  return '(+358) ' + exports.number(1000000, 9999999);
};

/**
 * Generate multiple contacts
 */
exports.contacts = function(n) {
  var contacts = [], i = 0;
  // Loop
  for (; i < n; i++) {
    // Push to contacts
    contacts.push(exports.contact());
  }
  // Return
  return contacts;
};

/**
 * Address line
 */
exports.addressLine = function() {
  // Types
  var suffix = ['Ave.', 'St.', 'Rd.'];
  // Generate random and last name
  return exports.number(10, 999).toString() + ' ' + exports.lastName() + ' ' + suffix[exports.number(0, suffix.length - 1)];
};

/**
 * Coordinates
 */
exports.coordinates = function() {
  // Return random coordinates within Helsinki, Finland
  return {
    latitude: parseFloat('60.' + exports.number(1677742, 1788737).toString()),
    longitude: parseFloat('24.' + exports.number(9250174, 9570322).toString())
  };
};

/**
 * Establishment name
 */
exports.establishment = function() {
  // Common establishment names
  var common = ['Corner', 'Hall', 'Square', 'Garden', 'Nook'];
  // 30 percent chance it's a name of two
  if (exports.number(1, 10) <= 3) {
    // Return
    return exports.lastName() + ' and ' + exports.lastName();
  } else {
    // Return random name + common
    return exports.lastName() + ' ' + common[exports.number(0, common.length - 1)];
  }
};

/**
 * Admission fee
 */
exports.admissionFee = function() {
  // Fees
  var fees = ['free', '1-6', '6-12', '12-18', '19+'];
  // Get
  return fees[exports.number(0, fees.length - 1)];
};

/**
 * Opening hours
 */
exports.openingHours = function() {
  return [
    {
      day: 0, hours: [{ start: '0800', end: '1700' }]
    },
    {
      day: 1, hours: [{ start: '0800', end: '1700' }]
    },
    {
      day: 2, hours: [{ start: '0800', end: '1700' }]
    },
    {
      day: 3, hours: [{ start: '0800', end: '1700' }]
    },
    {
      day: 4, hours: [{ start: '0800', end: '1700' }]
    },
    {
      day: 5, hours: [{ start: '0800', end: '1700' }]
    },
    {
      day: 6, hours: [{ start: '', end: '' }]
    }
  ];
};

/**
 * Special hours
 */
exports.specialHours = function() {
  return [
    {
      date: '', startHour: '', endHour: ''
    }
  ];
};

/** 
 * Username based on name
 */
exports.username = function(name) {
  // Return
  return name.first.toLowerCase() + '.' + name.last.toLowerCase();
};

/**
 * Website based on name
 */
exports.website = function(name) {
  // Domain
  var domains = ['com', 'net', 'org', 'info'];
  // Return
  return 'http://www.' + name.first.toLowerCase() + name.last.toLowerCase() + '.' + domains[exports.number(0, domains.length - 1)];
};

/**
 * Email based on name
 */
exports.email = function(name) {
  // Mail providers
  var mails = ['gmail', 'yahoo', 'hotmail', 'lycos'];
  // Return
  return exports.username(name) + '@' + mails[exports.number(0, mails.length - 1)] + '.com';
};

/**
 * Lorem ipsum
 */
exports.lorem = function(words) {
  // Set
  var lorem = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras hendrerit tempor magna ac sodales. Nullam bibendum congue ipsum et euismod. Phasellus euismod et quam sit amet dictum. Vestibulum a iaculis ligula. Vestibulum feugiat sed eros et vulputate. Maecenas hendrerit auctor ligula in rutrum. Mauris vitae mollis turpis, vitae faucibus libero. Pellentesque eu nisl venenatis, tempor nulla ut, ultricies magna. Pellentesque sagittis enim non lorem aliquet finibus. Integer nec tincidunt dolor. Nullam tristique elit nec libero accumsan, et efficitur dolor dictum. Phasellus vitae leo eu tortor fringilla vulputate. Sed mollis, augue id blandit cursus, libero metus consectetur nunc, a pharetra turpis tortor eget ligula. Integer mollis justo in fermentum venenatis. Nulla malesuada, ipsum ac hendrerit tristique, orci dui commodo mi, at aliquam ligula felis non sapien. Etiam id est diam. Mauris a sapien tincidunt, varius sem ut, malesuada nulla. Ut ex nisi, posuere non tempus eget, molestie non sem. Integer interdum mi arcu, vitae tincidunt ligula dictum ac. Aliquam imperdiet ipsum ex, ultricies tempus nisi sagittis sed. Pellentesque orci tortor, ultricies sit amet iaculis vel, dignissim sit amet felis. Duis tempus nisl non mi luctus, ac dapibus enim semper. Fusce malesuada eros leo, sit amet volutpat justo sodales eu. Morbi interdum urna sit amet luctus fermentum. Duis vehicula ante nec erat dapibus lobortis. Donec eleifend eget metus in tincidunt. Maecenas pellentesque lobortis urna sodales tempus. Quisque viverra vel sapien quis gravida.';
  // Split by space
  var arrLorem = lorem.split(' '), len = arrLorem.length, 
      start = exports.number(0, Math.floor(len / 2)), 
      end = exports.number(start + Math.floor(len / 4), len - 1);
  // New lorem
  var newLorem = arrLorem.slice(start, words ? (start + words) : (end + 1)).join(' ');
  // Set first character as uppercase
  return newLorem.substr(0, 1).toUpperCase() + newLorem.substr(1);
};

/**
 * Find a random document
 */
exports.doc = function(rawModel, found, exclude, steps) {
  // Get model
  var Model = exports.getModel(rawModel);
  // Find a random model first to own the venue
  Model.count().exec(function(err, count) {
    // Get random
    var skip = exports.number(0, count - 1);
    // Get model
    Model.findOne().skip(skip).exec(function(err, model) {
      // If err
      if (err) {
        // Set error
        found(null, 'Insufficient users/artists. Create users or artists first');
        // Return
        return false;
      }
      // If model is in
      if (exclude && exclude.length) {
        // Loop through exclude
        for (var i in exclude) {
          if (exclude._id === model._id) {
            // If there's no steps
            if (!steps) steps = 0;
            // If steps reach 5 (this is alarming, stop recursion)
            if (steps >= 5) {
              // Call error
              found(null, 'Failed to find random artist. Create more artists');
              return false;
            }
            // Find another artist
            exports.doc(rawModel, found, exclude, steps + 1);
            // Do not continue
            return false;
          }
        }
      }
      // Found
      found(model);
    });
  });
};

/**
 * Find random documents
 */
exports.docs = function(rawModel, found, n, docs) {
  // If no docs
  if (!docs) {
    // Set empty
    docs = [];
  }
  // If there's no n
  if (!n) {
    // Return
    return false;
  }
  // Find one
  exports.doc(rawModel, function(model, message) {
    // If there's model found
    if (model) {
      // Add to docs
      docs.push(model);
      // Decrement n
      n--;
      // If there's no more n
      if (n <= 0) {
        // Call found
        found(docs);
      } else {
        // Recurse to docs
        exports.docs(rawModel, found, n, docs);
      }
    } else {
      // There's an error
      found(null, message);
    }
  }, docs);
};

/**
 * Random artist
 */
exports.artist = function(found, exclude, steps) {
  // Use exports.doc
  exports.doc('user', found, exclude, steps);
};

/**
 * Find multiple artists
 */
exports.artists = function(found, n, artists) {
  // Use docs
  exports.docs('user', found, n, artists);
};

/**
 * Concat artists
 */
exports.concatArtists = function(artists) {
  // Concatenated
  var concat = '';
  // Get length
  var len = artists.length, i = 0;
  // Loop
  for (; i < len; i++) {
    // If there's no concat
    if (!concat) {
      // Append normally
      concat += artists[i].name.full;
    } else {
      // If already last
      if (i === len - 1) {
        // If length is more than 2
        if (len > 2) {
          // Append last comma
          concat += ',';
        }
        // Append with 'and'
        concat += ' and ' + artists[i].name.full;
      } else {
        // Append with comma
        concat += ', ' + artists[i].name.full;
      }
    }
  }
  // Return concat
  return concat;
};

/**
 * Generate exhibition name out of artists
 */
exports.exhibitionName = function(artists) {
  // Set primary
  var primary = '', secondary = '';
  // If there's only 1 artist
  if (artists.length === 1) {
    // Set as primary
    primary = artists[0].name.full;
  } else {
    // If there's more
    // 70% chance primary is first artist
    if (exports.number(1, 10) <= 3) {
      primary = artists[0].name.full;
      // Concatenate the rest
      secondary = exports.concatArtists(artists.slice(1));
    } else {
      // Primary is name of first 2 artists
      primary = exports.concatArtists(artists.slice(0, 2));
      // Secondary is concatenated rest of the artists
      if (artists.length > 2) {
        secondary = exports.concatArtists(artists.slice(2));
      }
    }
  }
  // Return
  return {
    primary: primary,
    secondary: secondary
  };
};

/**
 * Generate admission fee
exports.admissionFee = function() {
  // There's 30% chance admission is free
  if (exports.number(1, 10) <= 3) {
    // Return 0
    return 0;
  } else {
    // Return multiples of 10
    return exports.number(1, 50) * 10;
  }
};
 */

/**
 * Get random venue
 */
exports.venue = function(found) {
  // Get Venue model
  var Venue = exports.getModel('venue');
  // Find a random user first to own the venue
  Venue.count().exec(function(err, count) {
    // Get random
    var skip = exports.number(0, count - 1);
    // Get user
    Venue.findOne().skip(skip).exec(function(err, venue) {
      // If err
      if (err) {
        // Set error
        found(null, 'Insufficient venues. Create venues first');
        // Return
        return false;
      }
      // Found
      found(venue);
    });
  });
};

/**
 * Find a photo
 */
exports.photo = function(found, exclude, steps) {
  // Use doc
  exports.doc('photo', found, exclude, steps);
};

/**
 * Find photos
 */
exports.photos = function(found, n, photos) {
  // Use doc
  exports.docs('photo', found, n, photos);
};

/**
 * Generate date range
 */
exports.dateRange = function() {
  // Set start
  var start = moment().utc().startOf('day');
  var end = start.clone().add(exports.number(5, 12), 'days');
  // Return
  return {
    startDate: start,
    // Duration can be 5 to 12 days
    endDate: end
  };
};

/**
 * Generate model
 */
exports.model = function(rawModel, limit, done) {
  // If limit is reduced to 0
  if (limit <= 0) {
    // Callback
    done(true);
    // Exit
    return false;
  }
  // Get model
  var Model = exports.getModel(rawModel);
  // Switch model
  switch (rawModel) {
    // Generate admin
    case 'admin':
      // Create user
      var admin = new Model({
        profileType:  'artlover',
        name:         { first: 'Art Advisor', last: 'Admin' },
        organization: 'Art Advisor',
        genres:       exports.genres(exports.number(1, 5)),
        description:  exports.lorem(),
        websites:     ['http://artadvisor.fi'],
        email:        'admin@artadvisor.fi',
        username:     'admin',
        password:     'password',
        roles:        ['member', 'admin']
      });
      // Save
      admin.save(function(err, user) {
        // If there's error
        if (err) {
          console.log(err);
        }
        // Proceed but with decremented limit
        exports.model(rawModel, limit - 1, done);
      });
      break;
    // Artist
    case 'artist':
      // Generate name
      var artistName = exports.name();
      // Generate username
      var userName = exports.username(artistName);
      // Find user
      Model.find({ username: userName }, function(err, docs) {
        // If there are any
        if (docs.length) {
          // Proceed
          exports.model(rawModel, limit, done);
        } else {
          // Create user
          var userModel = new Model({
            profileType:  'artist',
            name:         artistName,
            organization: exports.lastName() + ' ' + exports.lastName(),
            genres:       exports.genres(exports.number(1, 5)),
            description:  exports.lorem(),
            websites:     [exports.website(artistName)],
            email:        exports.email(artistName),
            username:     userName,
            password:     'password',
            roles:        ['member']
          });
          // Save
          userModel.save(function(err, user) {
            // If there's error
            if (err) {
              console.log(err);
            }
            // Proceed but with decremented limit
            exports.model(rawModel, limit - 1, done);
          });
        }
      });
      break;
    // Venue
    case 'venue':
      // Get random artist
      exports.artist(function(user, message) {
        // If not successful
        if (!user) {
          // Call done
          done(false, message);
        } else {
          // Get name
          var name = exports.establishment();

          // Generate permalink
          Model.generatePermalink(name, function(permalink, permalinkSafe) {
            // Create new venue
            var venue = new Model({
              venueTypes: ['gallery'],
              name: name,
              permalink: permalink,
              permalinkSafe: permalinkSafe,
              description: exports.lorem(),
              admissionFee: exports.admissionFee(),
              address: {
                line1: exports.addressLine(),
                city: exports.lastName() + ' City',
                // full: exports.addressLine() + ', ' + exports.lastName() + ' City',
                coordinates: exports.coordinates()
              },
              phone: exports.contact(),
              websites: [exports.website(user.name)],
              openingHours: exports.openingHours(),
              owner: user
            }); 
            // Save
            venue.save(function(err, venue) {
              // If there's error
              if (err) {
                console.log(err);
              }
              // Proceed with decremented limit
              exports.model(rawModel, limit - 1, done);
            });
          });

        }
      });
      break;
    // Exhibition
    case 'exhibition':
      // Get random users
      var artistCount = 1;
      // 70% chance there's more artists
      if (exports.number(1, 10) > 3) {
        // Maximum of 5
        artistCount = exports.number(2, 5);
      }
      // Get artists
      exports.artists(function(artists, message) {
        // If no artists found
        if (!artists) {
          // Call done
          done(false, message);
        } else {
          // Find venue first
          exports.venue(function(venue, message) {
            // If there's no venue
            if (!venue) {
              // Call error
              done(false, message);
            } else {
              // Get name
              var name = exports.exhibitionName(artists);
              // Set date range
              var date = exports.dateRange();

              // Set now many photos
              var photoCount = exports.number(12, 30);
              // Create a gallery here
              // Get photos
              exports.photos(function(photos, message) {
                // If there are no photos
                if (!photos) {
                  // Call done
                  done(false, message);
                } else {
                  // Create photos list
                  var photosList = [];
                  // Loop through photos
                  for (var i in photos) {
                    // Append to photos
                    photosList.push({
                      photo: photos[i],
                      caption: exports.lorem(exports.number(3, 8)),
                      artists: [artists[exports.number(0, artists.length - 1)]],
                      order: i
                    });
                  }
                  // Create new gallery
                  var Gallery = exports.getModel('gallery');
                  var gallery = new Gallery({
                    title: exports.lorem(exports.number(5, 12)),
                    photos: photosList
                  });

                  // Final artists
                  var finalArtists = [];
                  // Loop
                  for (var n in artists) {
                    finalArtists.push({
                      user: artists[n],
                      nonUser: {
                        fullname: ''
                      }
                    });
                  }

                  // Save gallery
                  gallery.save(function(err, gallery) {
                    // If there's error
                    if (err) {
                      console.log(err);
                    }
                    // Generate a permalink
                    Model.generatePermalink(name.primary, function(permalink, permalinkSafe) {
                      // Create new
                      var exhibition = new Model({
                        name: name.primary,
                        permalink: permalink,
                        permalinkSafe: permalinkSafe,
                        secondaryName: name.secondary,
                        admissionFee: exports.admissionFee(),
                        description: exports.lorem(),
                        openingHours: venue.openingHours,
                        specialHours: exports.specialHours(),
                        startDate: date.startDate,
                        endDate: date.endDate,
                        artists: finalArtists,
                        gallery: gallery,
                        genres: exports.genres(exports.number(1, 5)),
                        venue: venue,
                        owner: artists[0]
                      });
                      // Save
                      exhibition.save(function(err, exhibition) {
                        // If there's error
                        if (err) {
                          console.log(err);
                        }
                        // After saving, update gallery
                        gallery.exhibition = exhibition._id;
                        gallery.save(function(err, gallery) {
                          // Proceed with decremented limit
                          exports.model(rawModel, limit - 1, done);
                        });
                      });
                    });
                  });

                }
              }, photoCount);
            }
          });
        }
      }, artistCount);
      break;
    // Photo
    case 'photo':
      // Get photo
      var Photo = exports.getModel('photo');
      // Generate random number from 1 to 21
      var number = exports.number(1, 21);
      // Create new photo
      var photo = new Photo({
        title: exports.lorem(exports.number(5, 10)),
        order: 0,
        source: '/images/art/art-' + number.toString() + '.png'
      });
      // Save
      photo.save(function(err, photo) {
        // If there's error
        if (err) {
          console.log(err);
        }
        // Proceed with decremented limit
        exports.model(rawModel, limit - 1, done);
      });
      break;
    // Default
    default:
      // Not supported
      done(false, 'Generation not supported');
      break;
  }
};