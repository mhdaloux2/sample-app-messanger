var express = require('express');  
var bodyParser = require('body-parser');  
var request = require('request');  
var app = express();

app.use(bodyParser.urlencoded({extended: false}));  
app.use(bodyParser.json());  
app.listen((process.env.PORT || 3000));

// Server frontpage
app.get('/', function (req, res) {  
    res.send('This is TestBot Server');
});

// Facebook Webhook
app.get('/webhook', function (req, res) {  
    if (req.query['hub.verify_token'] === 'ABCDEFG1234567') {
        res.send(req.query['hub.challenge']);
    } else {
        res.send('Invalid verify token');
    }
});

// generic function sending messages
function sendMessage(recipientId, message) {  
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
        method: 'POST',
        json: {
            recipient: {id: recipientId},
            message: message,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
};

// handler receiving messages
app.post('/webhook', function (req, res) {  
    var events = req.body.entry[0].messaging;
    for (i = 0; i < events.length; i++) {
        var event = events[i];
        if (event.message && event.message.text) {
            request({
                url: 'https://graph.facebook.com/v2.6/' + event.sender.id,
                method: 'GET',
                qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
                json: {
                    fields: 'first_name,last_name,profile_pic,locale,timezone,gender'
                }
            }, function(error, response, body) {
                if (error) {
                    console.log('Error sending message: ', error);
                    return false;
                } else if (response.body.error) {
                    console.log('Error: ', response.body.error);
                    return false;
                } else {
                    // Send Profile Image
                    sendMessage(event.sender.id, {
                        attachment: {
                            type: "image",
                            payload: {
                                url: response.body.profile_pic,
                                is_reusable: false
                            }
                        }
                    });
                    // Send Text Message
                    sendMessage(event.sender.id, {
                        text: `Hello `+ (response.body.gender == "male" ? "Mr. " : "Mm.") +`${response.body.first_name} ${response.body.last_name}, Your message was "${event.message.text}"`
                    });
                }
            });
        }
    }
    res.sendStatus(200);
});
