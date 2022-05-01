const express = require('express')
const app = express()
app.use(express.json())

const argument = require('minimist')(process.argv.slice(2))
const fs = require('fs')
const morgan = require('morgan')
const logdb = require('./src/services/database.js')

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

// If --help or -h, echo help text to STDOUT and exit
if (argument.help || argument.h) {
    console.log(help)
    process.exit(0)
}

// Server port
const port = argument.port || argument.p || process.env.PORT || 5000

// If --log=false then do not create a log file
if (argument.log == 'false') {
    console.log("NOTICE: not creating file access.log")
} 
else {
    if (!fs.existsSync('./log/'))
        fs.mkdirSync('./log/');
    const accessLog = fs.createWriteStream( './log/access.log', { flags: 'a' })
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
    
    next();
})

// Flip one coin
function coinFlip() {
    let coin = Math.floor(2*Math.random());
    if (coin == 0)
      return "heads";
    else
      return "tails";
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

if (argument.debug || argument.d) {
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