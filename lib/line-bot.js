const request = require('request');
var util = require('util');

var LineBot = function(data) {
    this.header = {
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Line-ChannelID': data.channelId,
        'X-Line-ChannelSecret': data.channelSecret,
        'X-Line-Trusted-User-With-ACL': data.mid
    };
};

LineBot.prototype.message = (text) => {
    return {
        contentType: 1,
        toType: 1,
        text: text
    };
};

LineBot.prototype.image = (orig, prev) => {
    return {
        contentType: 2,
        toType: 1,
        originalContentUrl: orig,
        previewImageUrl: prev
    };
};

LineBot.prototype.send = function(to, message, callback) {
    var isMulti = message instanceof Array;
    new (isMulti ? SendingMultipleMessages : SendingMessages)(
        this.header,
        to,
        message
    ).send(callback);
};

LineBot.prototype.profile = function(mids) {
    if(mids instanceof Array) {
        mids = mids.join(',');
    }
    var self = this;
    return new Promise((resolve, reject) => {
        request.get({
            url: `https://trialbot-api.line.me/v1/profiles?mids=${mids}`,
            headers: self.header,
            json: true
        }, (err, res, body) => {
            if(err || res.statusCode != 200) {
                reject(err);
                console.log(err);
                console.log(body);
            } else {
                resolve(body);
            }
        });
    });
};

module.exports = LineBot;

var MessageBase = function(param) {
    this.header = param.header;
    this.to = [param.to];
    this.toChannel = param.channel;
    this.eventType = param.eventType;
    this.content = param.content;
};

MessageBase.prototype.send = function(callback) {
    var self = this;
    var opts = {
        url: 'https://trialbot-api.line.me/v1/events',
        headers: self.header,
        json: true,
        body: {
            to: self.to,
            toChannel: self.toChannel,
            eventType: self.eventType,
            content: self.content
        }
    };
    console.log(JSON.stringify(opts));
    request.post(opts, callback);
};

var SendingMessages = function(header, to, content) {
    MessageBase.call(this, {
        header,
        to,
        channel: '1383378250',
        eventType: '138311608800106203',
        content: content
    });
};

var SendingMultipleMessages = function(header, to, messages) {
    MessageBase.call(this, {
        header,
        to,
        channel: '1383378250',
        eventType: '140177271400161403',
        content: {
            messageNotified: 0,
            messages
        }
    });
};

util.inherits(SendingMessages, MessageBase);
util.inherits(SendingMultipleMessages, MessageBase);
