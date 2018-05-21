'use strict';

// Translations
angular.module('main').factory('translations', ['$rootScope', '$window', 'API', function($rootScope, $window, API) {
  // Return all translations
  var translations = [
        {
            'en': 'About & Terms',
            'fi': 'K\u00e4ytt\u00f6ehdot',
            'sv': 'Om Art Advisor och Villkor',
            'de': 'About + AGB'
        },
        {
            'en': 'About and terms',
            'fi': 'K\u00e4ytt\u00f6ehdot',
            'sv': 'Anv\u00e4ndarvillkor',
            'de': 'Bedingungen'
        },
        {
            'en': 'Additional content',
            'fi': 'Lis\u00e4tietoja',
            'sv': 'Ytterligare inneh\u00e5ll',
            'de': 'Zus\u00e4tzliche Inhalte'
        },
        {
            'en': 'Address',
            'fi': 'Osoite',
            'sv': 'Adress',
            'de': 'Adresse'
        },
        {
            'en': 'Admission',
            'fi': 'P\u00e4\u00e4symaksu',
            'sv': 'Biljetter',
            'de': 'Aufnahmegeb\u00fchr'
        },
        {
            'en': 'Admission fee',
            'fi': 'Sis\u00e4\u00e4np\u00e4\u00e4symaksu',
            'sv': 'Intr\u00e4desavgift',
            'de': 'Aufnahmegeb\u00fchr'
        },
        {
            'en': 'All Rights Reserved',
            'fi': 'Kaikki oikeudet pid\u00e4tet\u00e4\u00e4n',
            'sv': 'Alla r\u00e4ttigheter f\u00f6rbeh\u00e5llna.',
            'de': 'Alle Rechte vorbehalten'
        },
        {
            'en': 'Apr',
            'fi': 'Huhti',
            'sv': 'April',
            'de': 'April'
        },
        {
            'en': 'Art Cache',
            'fi': 'Taidek\u00e4tk\u00f6',
            'sv': 'Exklusiv konstsamling',
            'de': 'Kunst Cache'
        },
        {
            'en': 'Art Cache Helsinki',
            'fi': 'Art Cache Helsinki',
            'sv': 'Art Cache Helsinki',
            'de': 'Art Cache Helsinki'
        },
        {
            'en': 'Art Genres',
            'fi': 'Taidelajit',
            'sv': 'Konstformer',
            'de': 'Genre'
        },
        {
            'en': 'Art View',
            'fi': 'Taiden\u00e4kym\u00e4',
            'sv': 'Visa konst',
            'de': 'Kunst Anzeigen'
        },
        {
            'en': 'Art genre',
            'fi': 'Taidelaji',
            'sv': 'Konstform',
            'de': 'Art genre'
        },
        {
            'en': 'Art genre(s) represented',
            'fi': 'Edustetut taidelajit',
            'sv': 'Representerade konstformer',
            'de': 'Kunstgenre'
        },
        {
            'en': 'Art lover',
            'fi': 'Taiteen yst\u00e4v\u00e4',
            'sv': 'Konstv\u00e4n',
            'de': 'Kunstliebhaber'
        },
        {
            'en': 'Art museum',
            'fi': 'Taidemuseo',
            'sv': 'Konstmuseum',
            'de': 'Kunstmuseum'
        },
        {
            'en': 'Artist',
            'fi': 'Taiteilija',
            'sv': 'Konstn\u00e4r',
            'de': 'K\u00fcnstler'
        },
        {
            'en': 'Artist run',
            'fi': 'Taiteilijavetoinen',
            'sv': 'Konstn\u00e4rsdrivet',
            'de': 'Produzentengalerie \/ artist run'
        },
        {
            'en': 'Artist studio',
            'fi': 'Taiteilijan ty\u00f6huone',
            'sv': 'Konstn\u00e4rens arbetsrum',
            'de': 'K\u00fcnstleratelier'
        },
        {
            'en': 'Artist(s)',
            'fi': 'Taiteilija(t)',
            'sv': 'Konstn\u00e4r(er)',
            'de': 'K\u00fcnstler'
        },
        {
            'en': 'Artists',
            'fi': 'Taiteilijat',
            'sv': 'konstn\u00e4rer',
            'de': 'K\u00fcnstler'
        },
        {
            'en': 'Aug',
            'fi': 'Elo',
            'sv': 'Aug',
            'de': 'August'
        },
        {
            'en': 'By joining Art Advisor, you agree to our',
            'fi': 'Liittym\u00e4ll\u00e4 Art Advisor:iin, hyv\u00e4ksyt',
            'sv': 'Genom att g\u00e5 med i Art Advisor, godk\u00e4nner du v\u00e5ra',
            'de': 'Mit Ihrer Anmeldung auf Art Advisor erkl\u00e4ren Sie sich mit Unseren'
        },
        {
            'en': 'By joining ArtAdvisor, you agree to our Terms of Service and Privacy Policy',
            'fi': 'Liittym\u00e4ll\u00e4 ArtAdvisor:iin, hyv\u00e4ksyt k\u00e4ytt\u00f6ehdot ja tietosuojak\u00e4yt\u00e4nn\u00f6t',
            'sv': 'Genom att g\u00e5 med i ArtAdvisor, godk\u00e4nner du v\u00e5ra villkor och v\u00e5r sekretesspolicy',
            'de': 'Mit Ihrer Anmeldung auf ArtAdvisor erkl\u00e4ren Sie sich mit Unseren Servicebedingungen sowie unserer Datenschutzerkl\u00e4rung einverstanden.'
        },
        {
            'en': 'Calculating distance',
            'fi': 'Laskee et\u00e4isyyden',
            'sv': 'R\u00e4kna avst\u00e5nd',
            'de': 'Entfernung berechnen'
        },
        {
            'en': 'Cancel',
            'fi': 'Peru',
            'sv': '\u00c5ngra',
            'de': 'L\u00f6schen'
        },
        {
            'en': 'Ceramic art',
            'fi': 'Keramiikka',
            'sv': 'Keramik',
            'de': 'Keramik-Kunst'
        },
        {
            'en': 'Change language',
            'fi': 'Vaihda kieli',
            'sv': '\u00c4ndra spr\u00e5k',
            'de': 'Sprache \u00e4ndern'
        },
        {
            'en': 'Change password',
            'fi': 'Vaihda salasana',
            'sv': '\u00c4ndra l\u00f6senord',
            'de': 'Passwort \u00e4ndern'
        },
        {
            'en': 'Change user type',
            'fi': 'Vaihda k\u00e4ytt\u00e4j\u00e4n tyyppi',
            'sv': '\u00c4ndra anv\u00e4ndartyp',
            'de': '\u00c4ndere den Benutzer-Typ'
        },
        {
            'en': 'Choose an existing venue',
            'fi': 'Valitse olemassa oleva paikka',
            'sv': 'V\u00e4lj en existerande plats',
            'de': 'W\u00e4hle eine bereits bestehende Veranstaltung'
        },
        {
            'en': 'Choose existing venue',
            'fi': 'Valitse tapahtumapaikka',
            'sv': 'V\u00e4lj plats f\u00f6r evenemang',
            'de': 'W\u00e4hle einen Veranstaltungsort'
        },
        {
            'en': 'Cities',
            'fi': 'Kaupungit',
            'sv': 'St\u00e4der',
            'de': 'St\u00e4dte'
        },
        {
            'en': 'Close account',
            'fi': 'Sulje k\u00e4ytt\u00e4j\u00e4tili',
            'sv': 'St\u00e4ng anv\u00e4ndarkontot',
            'de': 'Konto schliessen'
        },
        {
            'en': 'Closed today',
            'fi': 'Suljettu t\u00e4n\u00e4\u00e4n',
            'sv': 'St\u00e4ngt idag',
            'de': 'Heute geschlossen'
        },
        {
            'en': 'Collage',
            'fi': 'Kollaasi',
            'sv': 'Kollage',
            'de': 'Collage'
        },
        {
            'en': 'Comics',
            'fi': 'Sarjakuvataide',
            'sv': 'Seriekonst',
            'de': 'Comics'
        },
        {
            'en': 'Comments',
            'fi': 'Kommentit',
            'sv': 'Kommentarer',
            'de': 'Kommentare'
        },
        {
            'en': 'Commercial',
            'fi': 'Kaupallinen',
            'sv': 'Kommersielt',
            'de': 'Kommerziell'
        },
        {
            'en': 'Completing password reset',
            'fi': 'Salasana on nyt uusittu',
            'sv': 'Ditt l\u00f6senord har f\u00f6rnyats',
            'de': 'Passwort-Zur\u00fccksetzung abschliesen'
        },
        {
            'en': 'Contact',
            'fi': 'Yhteystiedot',
            'sv': 'Kontakt',
            'de': 'Kontakt'
        },
        {
            'en': 'Contemporary',
            'fi': 'Nykytaide',
            'sv': 'Nutidskonst',
            'de': 'Zeitgen\u00f6ssisch'
        },
        {
            'en': 'Create event',
            'fi': 'Luo tapahtuma',
            'sv': 'Skapa evenemang',
            'de': 'Erstelle eine Veranstaltung'
        },
        {
            'en': 'Create new event',
            'fi': 'Luo uusi tapahtuma',
            'sv': 'Skapa nytt evenemang',
            'de': 'Neue Veranstaltung'
        },
        {
            'en': 'Create new venue',
            'fi': 'Luo uusi paikka',
            'sv': 'skapa ny lokal',
            'de': 'Neuer Verastallungsort'
        },
        {
            'en': 'Curated by',
            'fi': 'J\u00e4rjest\u00e4j\u00e4',
            'sv': 'Arrangerat av',
            'de': 'Kuratiert von'
        },
        {
            'en': 'Curator studio',
            'fi': 'Kuraattorin ty\u00f6huone',
            'sv': 'Kuratorns arbetsrum',
            'de': 'Kuratorenb\u00fcro'
        },
        {
            'en': 'Current city',
            'fi': 'Nykyinen kaupunki',
            'sv': 'Nuvarande stad',
            'de': 'Aktuelle Stadt'
        },
        {
            'en': 'Date',
            'fi': 'P\u00e4iv\u00e4',
            'sv': 'Datum',
            'de': 'Tag'
        },
        {
            'en': 'Days',
            'fi': 'P\u00e4iv\u00e4t',
            'sv': 'Dagar',
            'de': 'Tage'
        },
        {
            'en': 'Dec',
            'fi': 'Joulu',
            'sv': 'Dec',
            'de': 'Dezember'
        },
        {
            'en': 'Digital art',
            'fi': 'Digitaalinen taide',
            'sv': 'Digital konst',
            'de': 'Digital Art'
        },
        {
            'en': 'Drawing',
            'fi': 'Piirrustus',
            'sv': 'Teckning',
            'de': 'Zeichnung'
        },
        {
            'en': 'ENG',
            'fi': 'FIN',
            'sv': 'SWE',
            'de': 'DE'
        },
        {
            'en': 'Edit event',
            'fi': 'Muokkaa tapahtumaa',
            'sv': 'Redigera evenemang',
            'de': 'Veranstaltung bearbeiten'
        },
        {
            'en': 'Edit profile',
            'fi': 'Muokkaa profiilia',
            'sv': 'Redigera profil',
            'de': 'Profil bearbeiten'
        },
        {
            'en': 'Edit venue',
            'fi': 'Muokkaa paikkaa',
            'sv': 'redigera lokal',
            'de': 'Verastallungsort bearbeiten'
        },
        {
            'en': 'Email',
            'fi': 'E-mail',
            'sv': 'E-post',
            'de': 'Email'
        },
        {
            'en': 'Email a friend',
            'fi': 'Jaa yst\u00e4v\u00e4lle',
            'sv': 'Dela med v\u00e4n',
            'de': 'E-Mail an einen Freund'
        },
        {
            'en': 'Email already in use',
            'fi': 'S\u00e4hk\u00f6postiosoite on jo k\u00e4yt\u00f6ss\u00e4',
            'sv': 'Denna e-post \u00e4r redan i anv\u00e4ndning',
            'de': 'E-Mail-Adresse wird bereits benutzt'
        },
        {
            'en': 'Enter admission fee(s) currency',
            'fi': 'Valitse sis\u00e4\u00e4np\u00e4\u00e4symaksun valuutta',
            'sv': 'V\u00e4lj valuta f\u00f6r intr\u00e4desavgift',
            'de': 'W\u00e4hle die W\u00e4hrung der Eintrittszahlung'
        },
        {
            'en': 'Event',
            'fi': 'Tapahtuma',
            'sv': 'Evenemang',
            'de': 'Veranstaltung'
        },
        {
            'en': 'Event name',
            'fi': 'Tapahtuman nimi',
            'sv': 'Namn p\u00e5 evenemang',
            'de': 'Name des Veranstaltung'
        },
        {
            'en': 'Event organizer',
            'fi': 'Tapahtumaj\u00e4rjest\u00e4j\u00e4',
            'sv': 'Arrang\u00f6r',
            'de': 'Veranstalter'
        },
        {
            'en': 'Event successfully created',
            'fi': 'Tapahtuma onnistuneesti luotu',
            'sv': 'Evenemanget skapat lyckat',
            'de': 'Die Veranstaltung wurde erfolgreich erstellt'
        },
        {
            'en': 'Events',
            'fi': 'Tapahtumat',
            'sv': 'Evenemang',
            'de': 'Veranstaltungen'
        },
        {
            'en': 'Facebook',
            'fi': 'Facebook',
            'sv': 'Facebook',
            'de': 'Facebook'
        },
        {
            'en': 'Favorites',
            'fi': 'Suosikit',
            'sv': 'Favoriter',
            'de': 'Favoriten'
        },
        {
            'en': 'Favourites',
            'fi': 'Suosikit',
            'sv': 'Favoriter',
            'de': 'Favoriten'
        },
        {
            'en': 'Feb',
            'fi': 'Helmi',
            'sv': 'Feb',
            'de': 'Februar'
        },
        {
            'en': 'Feedback',
            'fi': 'Palaute',
            'sv': 'Feedback',
            'de': 'R\u00fcckmeldung'
        },
        {
            'en': 'Film',
            'fi': 'Elokuva',
            'sv': 'Film',
            'de': 'Film'
        },
        {
            'en': 'Forest',
            'fi': 'Mets\u00e4',
            'sv': 'Skog',
            'de': 'Wald'
        },
        {
            'en': 'Forgot password?',
            'fi': 'Unohditko salasanan?',
            'sv': 'Gl\u00f6mt l\u00f6senordet?',
            'de': 'Passwort vergessen?'
        },
        {
            'en': 'Fri',
            'fi': 'Pe',
            'sv': 'Fre',
            'de': 'Fr'
        },
        {
            'en': 'Friday',
            'fi': 'Perjantai',
            'sv': 'Fredag',
            'de': 'Freitag'
        },
        {
            'en': 'Gallery',
            'fi': 'Galleria',
            'sv': 'Galleri',
            'de': 'Galerie'
        },
        {
            'en': 'Games',
            'fi': 'Pelit',
            'sv': 'Spel',
            'de': 'Spiele'
        },
        {
            'en': 'Genre',
            'fi': 'Laji',
            'sv': 'Genre',
            'de': 'Genre'
        },
        {
            'en': 'Glass art',
            'fi': 'Lasitaide',
            'sv': 'Glaskonst',
            'de': 'Glaskunst'
        },
        {
            'en': 'Go to map page',
            'fi': 'Siirry karttasivulle',
            'sv': 'G\u00e5 till kartsida',
            'de': 'Gehe zur Kartendienst-Seite'
        },
        {
            'en': 'Google',
            'fi': 'Google',
            'sv': 'Google',
            'de': 'Google'
        },
        {
            'en': 'Guestbook',
            'fi': 'Vieraskirja',
            'sv': 'G\u00e4stbok',
            'de': 'G\u00e4stebuch'
        },
        {
            'en': 'Historical',
            'fi': 'Historiallinen',
            'sv': 'Historisk',
            'de': 'Historisch'
        },
        {
            'en': 'Illustration',
            'fi': 'Kuvitus',
            'sv': 'Illustration',
            'de': 'illustration'
        },
        {
            'en': 'Information',
            'fi': 'Tiedot',
            'sv': 'Beskrivning av evenemang',
            'de': 'Veranstaltungsbeschreibung'
        },
        {
            'en': 'Installation art',
            'fi': 'Installaatiotaide',
            'sv': 'Installationskonst',
            'de': 'Installationskunst'
        },
        {
            'en': 'International',
            'fi': 'Kansainv\u00e4linen',
            'sv': 'Internationell',
            'de': 'International'
        },
        {
            'en': 'Invite friends',
            'fi': 'Kutsu yst\u00e4vi\u00e4',
            'sv': 'Bjud in v\u00e4nner',
            'de': 'Freunde einladen'
        },
        {
            'en': 'Jan',
            'fi': 'Tammi',
            'sv': 'Jan',
            'de': 'Januar'
        },
        {
            'en': 'Join',
            'fi': 'Liity',
            'sv': 'G\u00e5 med',
            'de': 'beitreten-Anmelden'
        },
        {
            'en': 'Join with Facebook',
            'fi': 'Liity Facebook:in avulla',
            'sv': 'G\u00e5 med via Facebook',
            'de': 'Anmelden mit Facebook'
        },
        {
            'en': 'Join with Google+',
            'fi': 'Liity Google + avulla',
            'sv': 'G\u00e5 med via Google+',
            'de': 'Anmelden mit Google+'
        },
        {
            'en': 'Jul',
            'fi': 'Hein\u00e4',
            'sv': 'Juli',
            'de': 'Juli'
        },
        {
            'en': 'Jun',
            'fi': 'Kes\u00e4',
            'sv': 'Juni',
            'de': 'Juni'
        },
        {
            'en': 'Keywords',
            'fi': 'Hakusanat',
            'sv': 'Nyckelord',
            'de': 'Schl\u00fcsselw\u00f6rter'
        },
        {
            'en': 'Land art',
            'fi': 'Maataide',
            'sv': 'Jordkonst',
            'de': 'Land-Art'
        },
        {
            'en': 'Last Chance',
            'fi': 'Viel\u00e4 ehdit',
            'sv': 'Sista chansen',
            'de': 'Letzte Chance'
        },
        {
            'en': 'Lifestyle',
            'fi': 'Lifestyle',
            'sv': 'Livsstil',
            'de': 'Lifestyle'
        },
        {
            'en': 'Light art',
            'fi': 'Valotaide',
            'sv': 'Ljuskonst',
            'de': 'Licht-Kunst'
        },
        {
            'en': 'Linked accounts',
            'fi': 'Linkitetyt tilit',
            'sv': 'L\u00e4nkade konton',
            'de': 'Verkn\u00fcpfte Konten'
        },
        {
            'en': 'Links to other page',
            'fi': 'Linkit muille sivuille',
            'sv': 'L\u00e4nkar till andra sidor',
            'de': 'Links to other page'
        },
        {
            'en': 'Links to other pages',
            'fi': 'Linkit muille sivuille',
            'sv': 'L\u00e4nkar till andra sidor',
            'de': 'Links zu anderen Seiten'
        },
        {
            'en': 'Load images',
            'fi': 'Lataa kuvia',
            'sv': 'Ladda bilder',
            'de': 'Bilder laden'
        },
        {
            'en': 'Log in',
            'fi': 'Kirjaudu sis\u00e4\u00e4n',
            'sv': 'Logga in',
            'de': 'Log in'
        },
        {
            'en': 'Log in with Facebook',
            'fi': 'Kirjaudu Facebook:in avulla',
            'sv': 'Logga in med Facebook',
            'de': 'Log in mit Facebook'
        },
        {
            'en': 'Log in with Google+',
            'fi': 'Kirjaudu Google + avulla',
            'sv': 'Logga in med Google+',
            'de': 'Log in mit Google+'
        },
        {
            'en': 'Mar',
            'fi': 'Maalis',
            'sv': 'Mars',
            'de': 'M\u00e4rz'
        },
        {
            'en': 'May',
            'fi': 'Touko',
            'sv': 'Maj',
            'de': 'Mai'
        },
        {
            'en': 'Media art',
            'fi': 'Mediataide',
            'sv': 'Mediekonst',
            'de': 'Medienkunst'
        },
        {
            'en': 'Message',
            'fi': 'Viesti',
            'sv': 'Meddelande',
            'de': 'Nachricht'
        },
        {
            'en': 'Modern',
            'fi': 'Moderni',
            'sv': 'Modern',
            'de': 'Modern'
        },
        {
            'en': 'Mon',
            'fi': 'Ma',
            'sv': 'M\u00e5n',
            'de': 'Mo'
        },
        {
            'en': 'Monday',
            'fi': 'Maanantai',
            'sv': 'M\u00e5ndag',
            'de': 'Montag'
        },
        {
            'en': 'Months',
            'fi': 'Kuukaudet',
            'sv': 'M\u00e5nader',
            'de': 'Monate'
        },
        {
            'en': 'Museum',
            'fi': 'Museo',
            'sv': 'Museum',
            'de': 'Museum'
        },
        {
            'en': 'My events',
            'fi': 'Minun tapahtumat',
            'sv': 'Mina evenemang',
            'de': 'Meine Veranstaltung'
        },
        {
            'en': 'My searches',
            'fi': 'Omat hakuni',
            'sv': 'Mina s\u00f6kningar',
            'de': 'Meine Suchen'
        },
        {
            'en': 'My venues',
            'fi': 'Minun paikat',
            'sv': 'mina lokaler',
            'de': 'Mein Verastaltungsort'
        },
        {
            'en': 'New password',
            'fi': 'Uusi salasana',
            'sv': 'Nytt l\u00f6senord',
            'de': 'Neues Passwort'
        },
        {
            'en': 'New password again',
            'fi': 'Uusi salasana uudestaan',
            'sv': 'Nytt l\u00f6senord igen',
            'de': 'Altes Passwort wiederholen'
        },
        {
            'en': 'Next 7 days',
            'fi': 'Seuraavan viikon ajan',
            'sv': 'N\u00e4sta 7 dagar',
            'de': 'N\u00e4chste 7 Tage'
        },
        {
            'en': 'Next weekend',
            'fi': 'Ensi viikonloppuna',
            'sv': 'N\u00e4sta helg',
            'de': 'N\u00e4chstes Wochenende'
        },
        {
            'en': 'Notifications',
            'fi': 'Ilmoitukset',
            'sv': 'Meddelande',
            'de': 'Mitteilungen'
        },
        {
            'en': 'Nov',
            'fi': 'Marras',
            'sv': 'Nov',
            'de': 'November'
        },
        {
            'en': 'Now',
            'fi': 'Nyt',
            'sv': 'Nu',
            'de': 'Jetzt'
        },
        {
            'en': 'Now closed',
            'fi': 'Suljetut',
            'sv': 'St\u00e4ngt',
            'de': 'Jetzt Geschlossen.'
        },
        {
            'en': 'Now open',
            'fi': 'Avoimet',
            'sv': '\u00d6ppet',
            'de': 'Jetzt ge\u00f6ffnet'
        },
        {
            'en': 'Oct',
            'fi': 'Loka',
            'sv': 'Okt',
            'de': 'Oktober'
        },
        {
            'en': 'Off',
            'fi': 'Pois',
            'sv': 'Av',
            'de': 'Aus'
        },
        {
            'en': 'Old password',
            'fi': 'Vanha salasana',
            'sv': 'Gammalt l\u00f6senord',
            'de': 'Altes Passwort'
        },
        {
            'en': 'On',
            'fi': 'P\u00e4\u00e4ll\u00e4',
            'sv': 'P\u00e5',
            'de': 'Ein'
        },
        {
            'en': 'On \/ Off',
            'fi': 'P\u00e4\u00e4ll\u00e4 \/ Pois',
            'sv': 'P\u00e5 \/ Av',
            'de': 'Ein \/ Aus'
        },
        {
            'en': 'Open dates',
            'fi': 'Aukiolop\u00e4iv\u00e4t',
            'sv': '\u00d6ppetdagar',
            'de': '\u00d6ffnungstage'
        },
        {
            'en': 'Open hours',
            'fi': 'Aukioloajat',
            'sv': '\u00d6ppettider',
            'de': '\u00d6ffnungszeiten'
        },
        {
            'en': 'Open today from',
            'fi': 'Avoinna t\u00e4n\u00e4\u00e4n',
            'sv': '\u00d6ppet idag',
            'de': 'Heute ge\u00f6ffnet von'
        },
        {
            'en': 'Opening hours',
            'fi': 'Aukioloajat',
            'sv': '\u00d6ppettider',
            'de': '\u00d6ffungzeiten'
        },
        {
            'en': 'Opening hours (for every weekday separately + holidays + other exceptional opening hours)',
            'fi': 'Aukioloajat  (valitse kaikki viikonp\u00e4iv\u00e4t erikseen + lomat + muut poikkeavat aukioloajat)',
            'sv': '\u00d6ppettider',
            'de': '\u00d6ffungzeiten'
        },
        {
            'en': 'Other',
            'fi': 'Muu',
            'sv': 'Annat',
            'de': 'Sonstiges'
        },
        {
            'en': 'Painting',
            'fi': 'Maalaustaide',
            'sv': 'M\u00e5leri',
            'de': 'Malerei'
        },
        {
            'en': 'Park',
            'fi': 'Puisto',
            'sv': 'Park',
            'de': 'Park'
        },
        {
            'en': 'Password does not match',
            'fi': 'Salasana ei t\u00e4sm\u00e4\u00e4',
            'sv': 'L\u00f6senordet st\u00e4mmer ej',
            'de': 'Das Passwort stimmt nicht'
        },
        {
            'en': 'Performance art',
            'fi': 'Performanssitaide',
            'sv': 'Performanskonst',
            'de': 'Performance-Kunst'
        },
        {
            'en': 'Phone number',
            'fi': 'Puhelin',
            'sv': 'Telefonnummer',
            'de': 'Telefonnummer'
        },
        {
            'en': 'Photography',
            'fi': 'Valokuvataide',
            'sv': 'Fotografi',
            'de': 'Fotografie'
        },
        {
            'en': 'Please add admission fee',
            'fi': 'Lis\u00e4\u00e4 p\u00e4\u00e4symaksu',
            'sv': 'L\u00e4gg till intr\u00e4desavgift',
            'de': 'F\u00fcge den Eintrittspreis hinzu'
        },
        {
            'en': 'Please add event name',
            'fi': 'Lis\u00e4\u00e4 tapahtuman nimi',
            'sv': 'L\u00e4gg till namn p\u00e5 evenemang',
            'de': 'F\u00fcge den Veranstaltungsnamen hinzu'
        },
        {
            'en': 'Please add the basic information about the event',
            'fi': 'Lis\u00e4\u00e4 tapahtuman tiedot',
            'sv': 'L\u00e4gg till information f\u00f6r evenemanget',
            'de': 'Bitte f\u00fcge Grundinformationen \u00fcber die Veranstaltung hinzu'
        },
        {
            'en': 'Please check your email for our instructions',
            'fi': 'Tarkista s\u00e4hk\u00f6postistasi tarkemmat ohjeet',
            'sv': 'Kontrollera din e-post f\u00f6r v\u00e5ra instruktioner',
            'de': 'Schau bitte in deinem E-Mail-Eingang nach'
        },
        {
            'en': 'Please check your new email address for verification',
            'fi': 'Tarkista vahvistusviesti uudesta s\u00e4hk\u00f6postiosoitteesta',
            'sv': 'Kontrollera din nya e-post',
            'de': 'Bitte pr\u00fcfe deine neue E-Mail-Adresse'
        },
        {
            'en': 'Please choose at least one art genre',
            'fi': 'Valitse v\u00e4hint\u00e4\u00e4n yksi taidelaji',
            'sv': 'V\u00e4lj minst en konstform',
            'de': 'W\u00e4hle wenigstens eine Kunstgattung'
        },
        {
            'en': 'Please choose at least one venue type under gallery \/ public space \/ art museum \/ other',
            'fi': 'Valitse v\u00e4hint\u00e4\u00e4n yksi tarkentava paikkatyyppi n\u00e4iden alta Galleria \/ Taidemuseo \/ Julkinen tila \/ Muu',
            'sv': 'V\u00e4lj minst en specifierande platstyp fr\u00e5n Galleri \/ Konstmuseum \/ Allm\u00e4n plats \/ Annan',
            'de': 'W\u00e4hle wenigstens einen Veranstaltungstyp unter Galerie \/ Kunstmuseum \/ \u00d6ffentlicher Raum \/ Anderer'
        },
        {
            'en': 'Please load at least one as the banner image of the event',
            'fi': 'Lataa v\u00e4hint\u00e4\u00e4 yksi kuva tapahtuman bannerikuvaksi',
            'sv': 'V\u00e4lj minst en bild som banner-bild f\u00f6r evenemanget',
            'de': 'Lade wenigstens ein Bild der Veranstaltung als Banner-Bild'
        },
        {
            'en': 'Please select a venue',
            'fi': 'Valitse paikka',
            'sv': 'V\u00e4lj plats',
            'de': 'W\u00e4hle einen Ort'
        },
        {
            'en': 'Please select the artist(s)',
            'fi': 'Valitse taiteilija(t)',
            'sv': 'V\u00e4lj konstn\u00e4r(er)',
            'de': 'W\u00e4hle einen K\u00fcnstler'
        },
        {
            'en': 'Please specify the details of your report',
            'fi': 'Ole hyv\u00e4 ja kerro mit\u00e4 raportointisi koskee',
            'sv': 'Var sn\u00e4ll och ber\u00e4tta vad din anm\u00e4lan g\u00e4ller',
            'de': 'Bitte nenne die Details deines Reports'
        },
        {
            'en': 'Printmaking',
            'fi': 'Taidegrafiikka',
            'sv': 'Konstgrafik',
            'de': 'Druckgrafik'
        },
        {
            'en': 'Privacy policy',
            'fi': 'Tietosuojak\u00e4yt\u00e4nt\u00f6',
            'sv': 'Sekretesspolicy',
            'de': 'Datenschutzbestimmungen'
        },
        {
            'en': 'Private house',
            'fi': 'Yksityisasunto',
            'sv': 'Privat l\u00e4genhet',
            'de': 'Privatwohnung'
        },
        {
            'en': 'Processing request',
            'fi': 'Pyynt\u00f6\u00e4 k\u00e4sitell\u00e4\u00e4n',
            'sv': 'Behandlar beg\u00e4ran',
            'de': 'Verarbeitungsanforderung'
        },
        {
            'en': 'Public building',
            'fi': 'Julkinen rakennus',
            'sv': 'Allm\u00e4n byggnad',
            'de': '\u00d6ffentliches Geb\u00e4ude'
        },
        {
            'en': 'Public space',
            'fi': 'Julkinen tila',
            'sv': 'Allm\u00e4n plats',
            'de': '\u00d6ffentliches Gel\u00e4nde'
        },
        {
            'en': 'Recent cities',
            'fi': 'Viimeaikaiset kaupungit',
            'sv': 'Tidigare st\u00e4der',
            'de': 'Letzte Stadt'
        },
        {
            'en': 'Report',
            'fi': 'Raportoi',
            'sv': 'Anm\u00e4l',
            'de': 'Report'
        },
        {
            'en': 'Report artist',
            'fi': 'Raportoi tapahtuma',
            'sv': 'Rapportera konstn\u00e4r',
            'de': 'Artist Melden'
        },
        {
            'en': 'Report event',
            'fi': 'Raportoi tapahtuma',
            'sv': 'Rapportera evenemang',
            'de': 'Veranstaltungs'
        },
        {
            'en': 'Report event \/ venue \/ artist',
            'fi': 'Ilmianna tapahtuma \/ paikka \/ taiteilija',
            'sv': 'Anm\u00e4l evenemang \/ plats \/ konstn\u00e4r',
            'de': 'Veranstaltungen \/ Veranstaltungsorte \/ K\u00fcnstler melden'
        },
        {
            'en': 'Report this page',
            'fi': 'Ilmianna t\u00e4m\u00e4 sivu',
            'sv': 'Anm\u00e4l denna sida',
            'de': 'Seite melden'
        },
        {
            'en': 'Report venue',
            'fi': 'Raportoi tapahtuma',
            'sv': 'Rapportera lokal',
            'de': 'Veranstaltungsort'
        },
        {
            'en': 'SAVED',
            'fi': 'TALLENNETTU',
            'sv': 'SAVED',
            'de': 'SAVED'
        },
        {
            'en': 'Sat',
            'fi': 'La',
            'sv': 'L\u00f6r',
            'de': 'Sa'
        },
        {
            'en': 'Saturday',
            'fi': 'Lauantai',
            'sv': 'L\u00f6rdag',
            'de': 'Samstag'
        },
        {
            'en': 'Save',
            'fi': 'Tallenna',
            'sv': 'Spara',
            'de': 'Speichern'
        },
        {
            'en': 'Saved searches',
            'fi': 'Tallenetut haut',
            'sv': 'Sparade s\u00f6kningar',
            'de': 'Gespeicherte Suchanfragen'
        },
        {
            'en': 'Sculpture',
            'fi': 'Kuvanveisto',
            'sv': 'Skulptur',
            'de': 'Skulptur'
        },
        {
            'en': 'Search a city',
            'fi': 'Etsi kaupunkia',
            'sv': 'S\u00f6k p\u00e5 stad',
            'de': 'Stadt ausw\u00e4hlen'
        },
        {
            'en': 'Search events, artists, genres\u2026',
            'fi': 'Etsi tapahtumia, taiteilijoita, taidelajeja',
            'sv': 'S\u00f6k evenemang, artister, konstform',
            'de': 'Suche Veranstaltungen, artist, Genres ...'
        },
        {
            'en': 'Search keyword',
            'fi': 'Etsi tapahtumia, taiteilijoita, taidelajeja',
            'sv': 'S\u00f6k evenemang, artister, konstformer',
            'de': 'Suche Veranstaltungen, K\u00fcnstler, Genres ...'
        },
        {
            'en': 'Search keywords',
            'fi': 'Hakusana',
            'sv': 'S\u00f6kord',
            'de': 'Stichw\u00f6rter suchen'
        },
        {
            'en': 'Send this to email',
            'fi': 'Jaa s\u00e4hk\u00f6postilla',
            'sv': 'Dela med e-post',
            'de': 'Als E-Mail verschicken'
        },
        {
            'en': 'Sending invitation...',
            'fi': 'L\u00e4hett\u00e4\u00e4 kutsuja...',
            'sv': 'Skickar inbjudningar...',
            'de': 'Die Einladung wird versendet...'
        },
        {
            'en': 'Sep',
            'fi': 'Syys',
            'sv': 'Sept',
            'de': 'September'
        },
        {
            'en': 'Settings',
            'fi': 'Asetukset',
            'sv': 'Inst\u00e4llningar',
            'de': 'Einstellungen'
        },
        {
            'en': 'Share',
            'fi': 'Jaa',
            'sv': 'Dela',
            'de': 'Teilen'
        },
        {
            'en': 'Share this to Facebook',
            'fi': 'Jaa Facebookissa',
            'sv': 'Dela p\u00e5 Facebook',
            'de': 'Auf Facebook teilen'
        },
        {
            'en': 'Share this to Twitter',
            'fi': 'Jaa Twitteriss\u00e4',
            'sv': 'Dela p\u00e5 Twitter',
            'de': 'Auf Twitter teilen'
        },
        {
            'en': 'Short event',
            'fi': 'Lyhyt tapahtuma',
            'sv': 'Kort evenemang',
            'de': 'Kurzes Ereignis'
        },
        {
            'en': 'Short events',
            'fi': 'Lyhyet tapahtumat',
            'sv': 'Kortta evenemang',
            'de': 'Kurze Ereignisse'
        },
        {
            'en': 'Show more',
            'fi': 'N\u00e4yt\u00e4 lis\u00e4\u00e4',
            'sv': 'Visa mer',
            'de': 'Mehr anzeigen'
        },
        {
            'en': 'Show more events',
            'fi': 'N\u00e4yt\u00e4 lis\u00e4\u00e4 tapahtumia',
            'sv': 'Visa fler evenmang',
            'de': 'Mehr Veranstaltungen anzeigen'
        },
        {
            'en': 'Show more favorites',
            'fi': 'N\u00e4yt\u00e4 lis\u00e4\u00e4 suosikkeja',
            'sv': 'Visa fler favoriter',
            'de': 'Mehr Favoriten anzeigen'
        },
        {
            'en': 'Show more venues',
            'fi': 'N\u00e4yt\u00e4 lis\u00e4\u00e4 paikkoja',
            'sv': 'visa fler lokaler',
            'de': 'Mehr Verastallungsorte anzeigen'
        },
        {
            'en': 'Show past events',
            'fi': 'N\u00e4yt\u00e4 menneet tapahtumat',
            'sv': 'Visa tidigare evenemang',
            'de': 'Vergangene Veranstaltungen anzeigen'
        },
        {
            'en': 'Sign in',
            'fi': 'Kirjaudu sis\u00e4\u00e4n',
            'sv': 'Logga in',
            'de': 'Log in'
        },
        {
            'en': 'Sign in and curate your own art scene',
            'fi': 'Kirjaudu sis\u00e4\u00e4n ja kuratoi oma sis\u00e4lt\u00f6si',
            'sv': 'Logga in och ordna din egen konstscen',
            'de': 'Log in und kuratieren Sie Ihre eigene Kunstszene'
        },
        {
            'en': 'Sign out',
            'fi': 'Kirjaudu ulos',
            'sv': 'Logga ut',
            'de': 'Abmelden'
        },
        {
            'en': 'Site specific art',
            'fi': 'Paikkasidonnainen taide',
            'sv': 'Platsspecifik konst',
            'de': 'Ortsspezifische Kunst'
        },
        {
            'en': 'Sound art',
            'fi': '\u00c4\u00e4nitaide',
            'sv': 'Ljudkonst',
            'de': 'Klangkunst'
        },
        {
            'en': 'Special time',
            'fi': 'Muut aukioloajat',
            'sv': 'Speciella tider',
            'de': 'Sonderzeiten'
        },
        {
            'en': 'Specific genre (photography, design etc)',
            'fi': 'Taiteenlajiin erikoistunut (valokuva, design jne)',
            'sv': 'Specialicerad p\u00e5 konstform (fotografi, design, etc.)',
            'de': 'Genre (Fotografie, Design etc.)'
        },
        {
            'en': 'Street',
            'fi': 'Katu',
            'sv': 'Gata',
            'de': 'Strasse'
        },
        {
            'en': 'Street art',
            'fi': 'Katutaide',
            'sv': 'Gatukonst',
            'de': 'Street Art'
        },
        {
            'en': 'Subject',
            'fi': 'Aihe',
            'sv': '\u00c4mne',
            'de': 'Inhalt\/Thema'
        },
        {
            'en': 'Suggestions',
            'fi': 'Ehdotukset',
            'sv': 'F\u00f6rslag',
            'de': 'Vorschl\u00e4ge'
        },
        {
            'en': 'Sun',
            'fi': 'Su',
            'sv': 'S\u00f6n',
            'de': 'So'
        },
        {
            'en': 'Sunday',
            'fi': 'Sunnuntai',
            'sv': 'S\u00f6ndag',
            'de': 'Sonntag'
        },
        {
            'en': 'Terms of Service and Privacy Policy',
            'fi': 'k\u00e4ytt\u00f6ehdot ja tietosuojak\u00e4yt\u00e4nn\u00f6t',
            'sv': 'villkor och v\u00e5r sekretesspolicy',
            'de': 'Servicebedingungen sowie unserer Datenschutzerkl\u00e4rung einverstanden.'
        },
        {
            'en': 'Textile art',
            'fi': 'Tekstiilitaide',
            'sv': 'Textilkonst',
            'de': 'Textilkunst'
        },
        {
            'en': 'Thurs',
            'fi': 'To',
            'sv': 'Tors',
            'de': 'Do'
        },
        {
            'en': 'Thursday',
            'fi': 'Torstai',
            'sv': 'Torsdag',
            'de': 'Donnerstag'
        },
        {
            'en': 'Title',
            'fi': 'Otsikko',
            'sv': 'Rubrik',
            'de': 'Titel'
        },
        {
            'en': 'Today',
            'fi': 'T\u00e4n\u00e4\u00e4n',
            'sv': 'Idag',
            'de': 'Heute'
        },
        {
            'en': 'Top searches',
            'fi': 'Suosituimmat haut',
            'sv': 'Popul\u00e4raste s\u00f6kningar',
            'de': 'Beliebte Suchanfragen'
        },
        {
            'en': 'Tue',
            'fi': 'Ti',
            'sv': 'Tis',
            'de': 'Di'
        },
        {
            'en': 'Tuesday',
            'fi': 'Tiistai',
            'sv': 'Tisdag',
            'de': 'Dienstag'
        },
        {
            'en': 'Type artist name',
            'fi': 'Taiteilijan nimi',
            'sv': 'Konstn\u00e4rens namn',
            'de': 'Name des K\u00fcnstlers'
        },
        {
            'en': 'Type comment',
            'fi': 'Lis\u00e4\u00e4 merkint\u00e4',
            'sv': 'Kommentera',
            'de': 'Bemerkungen'
        },
        {
            'en': 'Type one email per line',
            'fi': 'Kirjoita yksi s\u00e4hk\u00f6postiosoite per rivi',
            'sv': 'Skriv en e-post adress per rad',
            'de': 'Eine E-Mail-Adresse pro Zeile eingeben'
        },
        {
            'en': 'Type your email address below. We will send you an instruction on how to reset your password',
            'fi': 'Kirjoita s\u00e4hk\u00f6postiosoitteesi alle. L\u00e4het\u00e4mme sinulle ohjeet kuinka voit luoda itsellesi uuden salasanan.',
            'sv': 'Skriv din e-post. Vi skickar instruktioner f\u00f6r \u00e5terst\u00e4llandet av ditt l\u00f6senord.',
            'de': 'E-Mail-Adresse bitte unten eingeben. Wir werden dann weitere Anweisungen zum Zur\u00fccksetzen des Passwortes senden.'
        },
        {
            'en': 'Type your friend\'s email address below and we\'ll send them an invitation',
            'fi': 'Kirjoita yst\u00e4viesi s\u00e4hk\u00f6postiosoitteet alle niin l\u00e4het\u00e4mme heille kutsut',
            'sv': 'Skriv dina v\u00e4nners e-post adresser nedan, s\u00e5 skickar vi dem en inbjudan',
            'de': 'Gib die E-Mail Adresse eines Freundes ein, um eine Einladung zu schicken'
        },
        {
            'en': 'URL',
            'fi': 'URL',
            'sv': 'URL',
            'de': 'URL'
        },
        {
            'en': 'Use as guest',
            'fi': 'Kirjaudu vierailijana',
            'sv': 'Anv\u00e4nd som g\u00e4st',
            'de': 'als Gast benutzen'
        },
        {
            'en': 'Username successfully changed',
            'fi': 'K\u00e4ytt\u00e4j\u00e4tunnus onnistuneesti vaihdettu',
            'sv': 'Username successfully changed',
            'de': 'Username successfully changed'
        },
        {
            'en': 'Username taken',
            'fi': 'K\u00e4ytt\u00e4j\u00e4tunnus on jo olemassa',
            'sv': 'Anv\u00e4ndarnamnet finns redan',
            'de': 'Der Benutzername wird schon verwendet'
        },
        {
            'en': 'Venue',
            'fi': 'Paikka',
            'sv': 'Lokal',
            'de': 'Veranstaltungsort'
        },
        {
            'en': 'Venue address',
            'fi': 'Osoite',
            'sv': 'Adress f\u00f6r plats',
            'de': 'Adresse des Veranstaltungsortes'
        },
        {
            'en': 'Venue city',
            'fi': 'Kaupunki',
            'sv': 'Stad',
            'de': 'Stadt in der die Veranstaltung stattfindet'
        },
        {
            'en': 'Venue description',
            'fi': 'Kuvaus',
            'sv': 'Beskrivning av plats',
            'de': 'Veranstaltungsort Beschreibung'
        },
        {
            'en': 'Venue name',
            'fi': 'Nimi',
            'sv': 'Namn p\u00e5 plats',
            'de': 'Name des Veranstaltungsortes'
        },
        {
            'en': 'Venue successfully created',
            'fi': 'Paikka onnistuneesti luotu',
            'sv': 'Platsen skapad lyckat',
            'de': 'Der Veranstaltungsort wurde erfolgreich erstellt'
        },
        {
            'en': 'Venue type (museum, gallery, public space, other)',
            'fi': 'Tyyppi (museo, galleria, julkinen tila, muu)',
            'sv': 'Typ av plats (museum, galleri, allm\u00e4n plats, annan)',
            'de': 'Typ des Veranstaltungsortes'
        },
        {
            'en': 'Venues',
            'fi': 'Paikat',
            'sv': 'Lokaler',
            'de': 'Verastaltungsortes'
        },
        {
            'en': 'Video art',
            'fi': 'Videotaide',
            'sv': 'Videokonst',
            'de': 'Videokunst'
        },
        {
            'en': 'Web',
            'fi': 'Web',
            'sv': 'Webb',
            'de': 'Webseite'
        },
        {
            'en': 'Website',
            'fi': 'www-sivut',
            'sv': 'Webbsida',
            'de': 'Website'
        },
        {
            'en': 'Wed',
            'fi': 'Ke',
            'sv': 'Ons',
            'de': 'Mi'
        },
        {
            'en': 'Wednesday',
            'fi': 'Keskiviikko',
            'sv': 'Onsdag',
            'de': 'Mittwoch'
        },
        {
            'en': 'When?',
            'fi': 'Koska?',
            'sv': 'N\u00e4r',
            'de': 'Wann?'
        },
        {
            'en': 'Where?',
            'fi': 'Miss\u00e4?',
            'sv': 'Var',
            'de': 'Wo?'
        },
        {
            'en': 'Written in media',
            'fi': 'Mediassa',
            'sv': 'Skrivet om i media',
            'de': 'In Medien geschrieben'
        },
        {
            'en': 'You are now being redirected to the event page in (%%) second(s)',
            'fi': 'siirryt automaattisesti luomasi tapahtuman sivulle muutaman sekunnin kuluttua',
            'sv': 'Du flyttas automatiskt till sidan f\u00f6r evenemanget du skapat om n\u00e5gra sekunder',
            'de': 'Sie werden jetzt automatisch zur Veranstaltungsseite weitergeleitet in (%%) Sekunde(n)'
        },
        {
            'en': 'You are now being redirected to the venue page in (%%) second(s)',
            'fi': 'Siirryt automaattisesti luomasi paikan sivulle muutaman sekunnin kuluttua',
            'sv': 'Du flyttas automatiskt till sidan f\u00f6r platsen du skapat om n\u00e5gra sekunder',
            'de': 'Sie werden jetzt automatisch zur Veranstaltungsseite weitergeleitet in (%%) Sekunde(n)'
        },
        {
            'en': 'Your email address',
            'fi': 'S\u00e4hk\u00f6postiosoitteesi',
            'sv': 'Din e-postadress',
            'de': 'E-Mail-Adresse eingeben'
        },
        {
            'en': 'Your invitation has been sent. Thank you',
            'fi': 'Kutsusi on nyt l\u00e4hetetty. Kiitos!',
            'sv': 'Dina inbjudningar har skickats. Tack!',
            'de': 'Die Einladung wurde gesendet. Danke!'
        },
        {
            'en': 'Your previous saved searches',
            'fi': 'Aiemmat tallennetut haut',
            'sv': 'Dina tidiagre sparade s\u00f6kningar',
            'de': 'Gespeicherte, fr\u00fchere Suchen'
        },
        {
            'en': 'Your previous searches',
            'fi': 'Viimeaikaiset haut',
            'sv': 'Dina tidigare s\u00f6kningar',
            'de': 'Ihre vorherigen Suchanfragen'
        },
        {
            'en': 'admission fee',
            'fi': 'Sis\u00e4\u00e4np\u00e4\u00e4symaksu',
            'sv': 'Intr\u00e4desavgift',
            'de': 'Aufnahmegeb\u00fchr'
        },
        {
            'en': 'always open',
            'fi': 'always open',
            'sv': 'always open',
            'de': 'always open'
        },
        {
            'en': 'and curate your own art scene',
            'fi': 'ja j\u00e4rjest\u00e4 oma taidekokoelmasi',
            'sv': 'och ordna din egen konstscen',
            'de': 'und kuratieren Sie Ihre eigene Kunstszene'
        },
        {
            'en': 'art genre(s)',
            'fi': 'Taidelajit',
            'sv': 'Konstgenre',
            'de': 'Repr\u00e4sentiertes Kunstgenre'
        },
        {
            'en': 'art genre(s) represented',
            'fi': 'Edustetut taidelajit',
            'sv': 'Konstgenre',
            'de': 'Kunstgenre'
        },
        {
            'en': 'art lover',
            'fi': 'Taiteen yst\u00e4v\u00e4',
            'sv': 'Konstv\u00e4n',
            'de': 'Kunstfreund'
        },
        {
            'en': 'artist',
            'fi': 'Taiteilijja',
            'sv': 'Konstn\u00e4r',
            'de': 'K\u00fcnstler'
        },
        {
            'en': 'artist(s)',
            'fi': 'Taiteilija(t)',
            'sv': 'Konstn\u00e4r\/konstn\u00e4rer',
            'de': 'Artist'
        },
        {
            'en': 'cancel',
            'fi': 'Peru',
            'sv': 'Avsluta',
            'de': 'L\u00f6schen'
        },
        {
            'en': 'ceramic art',
            'fi': 'keramiikka',
            'sv': 'keramik',
            'de': 'keramik-kunst'
        },
        {
            'en': 'collage',
            'fi': 'kollaasi',
            'sv': 'kollage',
            'de': 'collage'
        },
        {
            'en': 'comics',
            'fi': 'sarjakuvataide',
            'sv': 'seriekonst',
            'de': 'comics'
        },
        {
            'en': 'dates',
            'fi': 'P\u00e4iv\u00e4m\u00e4\u00e4r\u00e4',
            'sv': 'Datum',
            'de': 'Datum'
        },
        {
            'en': 'digital art',
            'fi': 'digitaalinen taide',
            'sv': 'digital konst',
            'de': 'digital art'
        },
        {
            'en': 'drawing',
            'fi': 'piirrustus',
            'sv': 'teckning',
            'de': 'zeichnung'
        },
        {
            'en': 'e-mail',
            'fi': 's\u00e4hk\u00f6posti',
            'sv': 'E-post',
            'de': 'E-Mail'
        },
        {
            'en': 'event description',
            'fi': 'Tapahtuman kuvaus',
            'sv': 'Beskrivning av evenemang',
            'de': 'Veranstaltungsbeschreibung'
        },
        {
            'en': 'event name',
            'fi': 'Tapahtuman nimi',
            'sv': 'Namn p\u00e5 evenemang',
            'de': 'Name des Veranstaltung'
        },
        {
            'en': 'event organizer (eg gallery, museum, art festval)',
            'fi': 'Tapahtumaj\u00e4rjest\u00e4j\u00e4 (esim. galleria, museo, taidefestivaali)',
            'sv': 'Arrang\u00f6r (t.ex. galleri, museum, konstfestival)',
            'de': 'Organisator (z.B. Galerie, Museum, Kunstfestival)'
        },
        {
            'en': 'film',
            'fi': 'elokuva',
            'sv': 'film',
            'de': 'film'
        },
        {
            'en': 'first name',
            'fi': 'Etunimi',
            'sv': 'F\u00f6rnamn',
            'de': 'Vorname'
        },
        {
            'en': 'free admission',
            'fi': 'Ilmainen',
            'sv': 'Fri entr\u00e9',
            'de': 'Freier Eintritt'
        },
        {
            'en': 'games',
            'fi': 'pelit',
            'sv': 'spel',
            'de': 'spiele'
        },
        {
            'en': 'glass art',
            'fi': 'lasitaide',
            'sv': 'glaskonst',
            'de': 'glaskunst'
        },
        {
            'en': 'illustration',
            'fi': 'kuvitus',
            'sv': 'illustration',
            'de': 'illustration'
        },
        {
            'en': 'installation art',
            'fi': 'installaatiotaide',
            'sv': 'installationskonst',
            'de': 'installationskunst'
        },
        {
            'en': 'land art',
            'fi': 'maataide',
            'sv': 'jordkonst',
            'de': 'land-art'
        },
        {
            'en': 'last chance',
            'fi': 'Viel\u00e4 ehdit',
            'sv': 'Sista chansen',
            'de': 'Letzte Chance'
        },
        {
            'en': 'last name',
            'fi': 'Sukunimi',
            'sv': 'Efternamn',
            'de': 'Nachname'
        },
        {
            'en': 'latest events',
            'fi': 'Uusimmat tapahtumat',
            'sv': 'Senaste evenemang',
            'de': 'Neuste Veranstaltungen'
        },
        {
            'en': 'light art',
            'fi': 'valotaide',
            'sv': 'light art',
            'de': 'light art'
        },
        {
            'en': 'load images',
            'fi': 'Lataa kuvia',
            'sv': 'Ladda bilder',
            'de': 'Bilder laden'
        },
        {
            'en': 'media art',
            'fi': 'mediataide',
            'sv': 'mediekonst',
            'de': 'medienkunst'
        },
        {
            'en': 'museum',
            'fi': 'Museo',
            'sv': 'Museum',
            'de': 'Museum'
        },
        {
            'en': 'opening hours',
            'fi': 'Aukioloajat',
            'sv': '\u00d6ppettider',
            'de': '\u00d6ffungzeiten'
        },
        {
            'en': 'other',
            'fi': 'muut',
            'sv': 'annat',
            'de': 'sonstige'
        },
        {
            'en': 'painting',
            'fi': 'maalaustaide',
            'sv': 'm\u00e5leri',
            'de': 'malerei'
        },
        {
            'en': 'password',
            'fi': 'Salasana',
            'sv': 'L\u00f6senord',
            'de': 'Passwort'
        },
        {
            'en': 'password again',
            'fi': 'Salasana uudelleen',
            'sv': 'Skriv in l\u00f6senordet igen',
            'de': 'Passwort erneut eingeben'
        },
        {
            'en': 'performance art',
            'fi': 'performanssitaide',
            'sv': 'performanskonst',
            'de': 'performance-kunst'
        },
        {
            'en': 'phone number',
            'fi': 'Puhelin',
            'sv': 'Telefonnummer',
            'de': 'Telefonnummer'
        },
        {
            'en': 'photography',
            'fi': 'valokuvataide',
            'sv': 'fotografi',
            'de': 'fotografie'
        },
        {
            'en': 'popular',
            'fi': 'Suosittu',
            'sv': 'Popul\u00e4rt',
            'de': 'Beliebt'
        },
        {
            'en': 'printmaking',
            'fi': 'taidegrafiikka',
            'sv': 'konstgrafik',
            'de': 'druckgrafik'
        },
        {
            'en': 'profile type',
            'fi': 'Profiilityyppi',
            'sv': 'Profiltyp',
            'de': 'Profiltyp'
        },
        {
            'en': 'public space',
            'fi': 'Julkinen tila',
            'sv': 'Allm\u00e4n plats',
            'de': '\u00d6ffentliches Gel\u00e4nde'
        },
        {
            'en': 'same as above but with already existing information',
            'fi': 'same as above but with already existing information',
            'sv': 'same as above but with already existing information',
            'de': 'same as above but with already existing information'
        },
        {
            'en': 'sculpture',
            'fi': 'kuvanveisto',
            'sv': 'skulptur',
            'de': 'skulptur'
        },
        {
            'en': 'search a city',
            'fi': 'Etsi kaupunkia',
            'sv': 'S\u00f6k p\u00e5 stad',
            'de': 'Stadt ausw\u00e4hlen'
        },
        {
            'en': 'search events, artists, genres\u2026',
            'fi': 'Etsi tapahtumia, taiteilijoita, taidelajeja',
            'sv': 'S\u00f6k evenemang, artister, genrer',
            'de': 'Suche Veranstaltungen, artist, Genres ...'
        },
        {
            'en': 'see text content on separate doc',
            'fi': 'see text content on separate doc',
            'sv': 'see text content on separate doc',
            'de': 'see text content on separate doc'
        },
        {
            'en': 'site specific art',
            'fi': 'paikkasidonnainen taide',
            'sv': 'platsspecifik konst',
            'de': 'ortsspezifische kunst'
        },
        {
            'en': 'sound art',
            'fi': '\u00e4\u00e4nitaide',
            'sv': 'sound art',
            'de': 'sound art'
        },
        {
            'en': 'street art',
            'fi': 'katutaide',
            'sv': 'gatukonst',
            'de': 'street art'
        },
        {
            'en': 'textile art',
            'fi': 'tekstiilitaide',
            'sv': 'textilkonst',
            'de': 'textilkunst'
        },
        {
            'en': 'venue',
            'fi': 'Paikka',
            'sv': 'Lokal',
            'de': 'Veranstaltungsort'
        },
        {
            'en': 'venue address',
            'fi': 'Osoite',
            'sv': 'Adress f\u00f6r lokal',
            'de': 'Veranstaltungsort adresse'
        },
        {
            'en': 'venue description',
            'fi': 'Kuvaus',
            'sv': 'Beskrivning av lokal',
            'de': 'Veranstaltungsort Beschreibung'
        },
        {
            'en': 'venue name',
            'fi': 'Nimi',
            'sv': 'Namn p\u00e5 lokal',
            'de': 'Veranstaltungsort name'
        },
        {
            'en': 'venue type (museum, gallery, public space, other)',
            'fi': 'Tyyppi',
            'sv': 'Typ av lokal (museum, galleri, allm\u00e4n plats, annan)',
            'de': 'Veranstaltungsort typ'
        },
        {
            'en': 'video art',
            'fi': 'videotaide',
            'sv': 'videokonst',
            'de': 'videokunst'
        },
        {
            'en': 'website',
            'fi': 'www-sivut',
            'sv': 'Webbsida',
            'de': 'Website'
        },
        {
            'en': 'written in media',
            'fi': 'Mediassa',
            'sv': 'Skrivet om i media',
            'de': 'in Medien geschrieben'
        },


        {
            'en': 'Page not found',
            'fi': 'Sivua ei löydetty',
            'sv': 'Sidan hittas inte',
            'de': 'Seite nicht gefunden'
        },
        {
            'en': 'The page you are looking for does not exist or may have been removed',
            'fi': 'Sivu etsit ei ole olemassa tai se on poistettu',
            'sv': 'Sidan du söker finns inte eller kan ha tagits bort',
            'de': 'Die Seite, die Sie suchen existiert nicht oder wurde möglicherweise entfernt'
        },
        {
            'en': 'Continue to home page',
            'fi': 'Jatka kotisivu',
            'sv': 'Fortsätt till startsidan',
            'de': 'Weiter zur Homepage'
        },
        {
            'en': 'Network error',
            'fi': 'Verkkovirhe',
            'sv': 'Netverksfel',
            'de': 'Netzwerkfehler'
        },
        {
            'en': 'No location available',
            'fi': 'Sijaintia ei ole saatavilla',
            'sv': 'Ingen plats tillgänglig',
            'de': 'Kein Standort verfügbar'
        },
        {
            'en': 'No events',
            'fi': 'Ei tapahtumia',
            'sv': 'Inga evenemang',
            'de': 'Keine Veranstaltungen'
        }
    ];

    var lastLength = translations.length,
        refresh = function() {
        // Reset length
        translations.length = lastLength;
        // Return
        return API.get('location/translations', {
            model: 'city'
        }).then(function(response) {
            // Append
            (response.data || []).forEach(function(translation) {
                // Append
                translations.push(translation);
            });
            return response.data || [];
        });
    };

    refresh();

    $rootScope.$on('updateTranslation', refresh);
    $rootScope.$on('updateCities', refresh);

    // Return
    return translations;
}]);
