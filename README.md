# Art Advisor

## Installation

Clone this repository first on your designated folder (e.g. /dev/luxus)
```
git clone https://github.com/LuxusInc/art-advisor.git
```
Make sure you are in the correct directory
```
cd art-advisor
```
Run NPM installation
```
npm install
```

## Running the app

Before running the app, to build resources, execute the following command first
```
grunt build
```

While in the art-advisor directory, simply execute the following command
```
grunt
```

## Halting the app

To halt the app, for Windows, press CTRL+C twice. For OSX, press Control+C

## Updating local files

Again, make sure you are in the correct directory
```
cd /dev/luxus/art-advisor
```
Or whichever directory you're setup


To update local files, pull files first from this repository
```
git pull
```
Make sure to update dependencies in npm and bower
```
npm update
bower update
```
Then you can run the app again using Grunt (under **Running the app**)

Setting up production
---------------------
	pm2 deploy ecosystem.json test setup
	pm2 deploy ecosystem.json test update

Updating production
-------------------
	pm2 deploy ecosystem.json test update
