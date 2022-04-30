// Require minimist module (make sure you install this one via npm).
// Require minimist module
const args = require('minimist')(process.argv.slice(2))
// See what is stored in the object produced by minimist
//console.log('Command line arguments: ', args)
// Store help text 
const help = (`
server.js [options]
--port, -p	Set the port number for the server to listen on. Must be an integer
            between 1 and 65535.
--debug, -d If set to true, creates endlpoints /app/log/access/ which returns
            a JSON access log from the database and /app/error which throws 
            an error with the message "Error test successful." Defaults to 
            false.
--log		If set to false, no log files are written. Defaults to true.
            Logs are always written to database.
--help, -h	Return this message and exit.
`)
// If --help, echo help text and exit
if (args.help || args.h) {
    console.log(help)
    process.exit(0)
}
// Define app using express
var express = require('express')
var app = express()
// Require fs
const fs = require('fs')
// Require morgan
const morgan = require('morgan')
// Require database SCRIPT file
const logdb = require('./src/services/database.js')
// Make Express use its own built-in body parser
// Allow urlencoded body messages
//app.use(express.urlencoded({ extended: true }));
// Allow json body messages
app.use(express.json());
// Server port
const port = args.port || args.p || process.env.PORT || 5000
// If --log=false then do not create a log file
if (args.log == 'false') {
    console.log("NOTICE: not creating file access.log")
} else {
// Use morgan for logging to files
    const logdir = './log/';

    if (!fs.existsSync(logdir)){
        fs.mkdirSync(logdir);
    }
// Create a write stream to append to an access.log file
    const accessLog = fs.createWriteStream( logdir+'access.log', { flags: 'a' })
// Set up the access logging middleware
    app.use(morgan('combined', { stream: accessLog }))
}
// Always log to database
app.use((req, res, next) => {
    let logdata = {
        remoteaddr: req.ip,
        remoteuser: req.user,
        time: Date.now(),
        method: req.method,
        url: req.url,
        protocol: req.protocol,
        httpversion: req.httpVersion,
        status: res.statusCode,
        referrer: req.headers['referer'],
        useragent: req.headers['user-agent']
    };
    const stmt = logdb.prepare('INSERT INTO accesslog (remoteaddr, remoteuser, time, method, url, protocol, httpversion, status, referrer, useragent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    const info = stmt.run(logdata.remoteaddr, logdata.remoteuser, logdata.time, logdata.method, logdata.url, logdata.protocol, logdata.httpversion, logdata.status, logdata.referrer, logdata.useragent)
    //console.log(info)
    next();
})

// Flip one coin
function coinFlip() {
    return (Math.floor(Math.random() * 2) == 0) ? 'heads' : 'tails';
}
// Flip many coins
function coinFlips(flips) {
    let array = [];
    for (let i = 1; i <= flips; i++) {
        array.push(coinFlip());
    }
    return array;
}
// Count coin flips
function countFlips(array) {
    let counter = {};
    array.forEach(item => {
        if (counter[item]) {
            counter[item]++;
        } else {
            counter[item] = 1;
        }
    });
    return counter;
}
// Call a coin flip
function flipACoin(call) {
    let flip = coinFlip();
    let result;
    if ( flip == call ) {
        result = 'win'
    } else {
        result = 'lose'
    }
    let game = {
        call: call,
        flip: flip,
        result: result
    }
    return game
}

// Serve static HTML public directory
app.use(express.static('./public'))

// READ (HTTP method GET) at root endpoint /app/
app.get("/app/", (req, res, next) => {
    res.json({"message":"Your API works! (200)"});
	res.status(200);
});

// Endpoint /app/flip/ that returns JSON {"flip":"heads"} or {"flip":"tails"} 
// corresponding to the results of the random coin flip.
app.get('/app/flip/', (req, res) => {
    const flip = coinFlip()
    res.status(200).json({ "flip" : flip })
});

app.post('/app/flip/coins/', (req, res, next) => {
    const flips = coinFlips(req.body.number)
    const count = countFlips(flips)
    res.status(200).json({"raw":flips,"summary":count})
})

app.get('/app/flips/:number', (req, res, next) => {
    const flips = coinFlips(req.params.number)
    const count = countFlips(flips)
    res.status(200).json({"raw":flips,"summary":count})
});

app.post('/app/flip/call/', (req, res, next) => {
    const game = flipACoin(req.body.guess)
    res.status(200).json(game)
})

app.get('/app/flip/call/:guess(heads|tails)/', (req, res, next) => {
    const game = flipACoin(req.params.guess)
    res.status(200).json(game)
})

if (args.debug || args.d) {
    app.get('/app/log/access/', (req, res, next) => {
        const stmt = logdb.prepare("SELECT * FROM accesslog").all();
	    res.status(200).json(stmt);
    })

    app.get('/app/error/', (req, res, next) => {
        throw new Error('Error test works.')
    })
}

// Default API endpoint that returns 404 Not found for any endpoints that are not defined.
app.use(function(req, res){
    const statusCode = 404
    const statusMessage = 'NOT FOUND'
    res.status(statusCode).end(statusCode+ ' ' +statusMessage)
});

// Start server
const server = app.listen(port, () => {
    console.log("Server running on port %PORT%".replace("%PORT%",port))
});
// Tell STDOUT that the server is stopped
process.on('SIGINT', () => {
    server.close(() => {
		console.log('\nApp stopped.');
	});
});