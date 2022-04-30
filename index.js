// require minimist (have installed)
const args = require('minimist')(process.argv.slice(2))
// define the help text
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