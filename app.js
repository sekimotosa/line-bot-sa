const koa = require('koa'),
    app = koa();
const co = require('co');
const parse = require('co-body');
const Router = require('koa-router');

const EventEmitter = require('events').EventEmitter;
const ev = new EventEmitter();

var router = new Router();
app.use(router.routes());

var LineBot = require('./lib/line-bot');
var bot = new LineBot({
    channelId: process.env.LINE_CHANNEL_ID,
    channelSecret: process.env.LINE_CHANNEL_SECRET,
    mid: process.env.LINE_CHANNEL_MID
});

// エンドポイント
var reqEv = ev.emit.bind(ev, 'request');
router.post('/linebot', function*() {
    var data = yield parse.json(this);
    (data.result || []).forEach(reqEv);
    this.body = 'ok';
});

ev.on('request', (item) => {
    var keyword = item.content.text || '';
    var to = item.content.from;
    if(!users[to]) {
        ev.emit('save.user', to);
    }
    if (!keyword) {
        bot.send(to, bot.message('どうも'), sendCallback);
        return;
    }
    co(function*() {
        bot.send(to, bot.message(`『${keyword}』ですね。\n少々お待ちください`));
        var img = yield searchImage(keyword);
        bot.send(to, img ? [
            bot.message('こちらなどいかがでしょう'),
            bot.image(img.url, img.thumb)
        ] : bot.message('画像が見つかりませんでした'), sendCallback);
    });
});

// send のコールバック
var sendCallback = (err, res, body) => {
    if (err || res.statusCode != 200) {
        console.error(err);
        console.error(body);
    }
};

var photozo = require('./lib/photozo');

function* searchImage(keyword) {
    var img = yield photozo.search(keyword);
    return img ? {
        url: img.original_image_url,
        thumb: img.thumbnail_image_url
    } : 0;
}
var users = {};

ev.on('save.user', (mid) => {
    co(function *() {
        var user = yield bot.profile(mid);
        users[mid] = user.contacts[0];
    });
});

router.get('/mids', function *() {
    console.log(users);
    this.body = JSON.stringify(Object.keys(users).map((mid) => {
        return {
            displayName: users[mid].displayName,
            pictureUrl: users[mid].pictureUrl,
            statusMessage: users[mid].statusMessage
        };
    }));
});


app.listen(process.env.PORT || 3000);
