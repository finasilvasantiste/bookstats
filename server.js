// Require express and create an instance of it
var express = require('express');
var app = express();

// on the request to root (localhost:3000/)
app.get('/', function (req, res) {
    res.sendFile('index.html', { root: '.' })
});

// // On localhost:3000/welcome
// app.get('/welcome', function (req, res) {
//     res.send('<b>Hello</b> welcome to my http server made with express');
// });

app.use(express.static(__dirname + '/public'));

// Change the 404 message modifing the middleware
app.use(function(req, res, next) {
    res.status(404).send("Sorry, that route doesn't exist.");
});

// start the server in the port 3000 !
app.listen(3000, function () {
    console.log('Example app listening on port 3000.');
});