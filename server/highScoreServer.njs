const https = require('https');
const fs = require('fs');

const PORT=8888;
const fileName = 'highScore.json';
const allowed = [
    'https://rialgar.de',
    'https://www.rialgar.de',
    'https://rialgar.de:'+PORT,
    'https://www.rialgar.de:'+PORT
];


var highScore = [];
if(!fs.existsSync(fileName)){
    fs.writeFileSync(fileName, JSON.stringify(highScore));
} else {
    highScore = JSON.parse(fs.readFileSync(fileName));
}

const config = {
    key: fs.readFileSync('*redacted*'),
    cert: fs.readFileSync('*redacted*')
};

https.createServer(config,(request, response) => {
    var origin = request.headers["Origin"] || request.headers["ORIGIN"] || request.headers["origin"];
    if(allowed.indexOf(origin) < 0) {
        response.writeHead(405, {'Content-Type': 'text/plain'});
        response.end();
    } else if(request.method === 'OPTIONS') {
        response.writeHead(200,
            {
                'ALLOW': 'GET, POST',
                'Access-Control-Allow-Origin': origin,
                'Access-Control-Allow-Methods': 'GET, POST',
                'Content-Length': '0'
            });
        response.end();
    } else  if (request.method === 'POST') {
        response.setHeader('Access-Control-Allow-Origin', origin);
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST');
        var body = [];
        request.on('data', function (chunk) {
            body.push(chunk);
        }).on('end', function () {
            body = Buffer.concat(body).toString();
            try {
                var newHS = JSON.parse(body);
                if (typeof(newHS.score) === 'number' && typeof(newHS.name) === 'string') {
                    newHS.score = Math.floor(newHS.score);
                    var i;
                    for (i = highScore.length; i > 0; i--) {
                        if (highScore[i - 1].score > newHS.score) {
                            break;
                        }
                    }
                    if (i < 20) {
                        highScore.splice(i, 0, {
                            score: newHS.score,
                            name: newHS.name
                        });
                        fs.writeFile(fileName, JSON.stringify(highScore), (err) => {
                            if (err) {
                                var log = '[' + new Date().toISOString() + '] Error on file write: ' + err +
                                    '\n================================================================================\n\n';
                                fs.appendFile('error.log', log);
                            }
                        });
                    }
                    while (highScore.length > 20) {
                        highScore.shift();
                    }
                }
            } catch (e) {
                var log = '[' + new Date().toISOString() + '] Error on post: ' + e.toString() + '\n' + e.stack + '\nbody was: ' + body +
                    '\n================================================================================\n\n';
                fs.appendFile('error.log', log);
            } finally {
                response.setHeader('Content-Type', 'application/json');
                response.end(JSON.stringify(highScore));
            }
        });
    } else if (request.method === 'GET'){
        response.setHeader('Access-Control-Allow-Origin', origin);
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST');
        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify(highScore));
    } else {
        response.writeHead(405, {'Content-Type': 'text/plain'});
        response.end();
    }
}).listen(PORT, 'rialgar.de', function(){
    console.log("Server listening on: https://rialgar.de:%s", PORT);
});