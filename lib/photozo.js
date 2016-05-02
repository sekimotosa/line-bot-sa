const request = require('request');

// フォト蔵APIへの負荷軽減のためすこしずつアクセスを行う
var requestQuere = [];
setTimeout(function loop() {
    if (requestQuere.length) {
        get(requestQuere.shift());
    }
    setTimeout(loop, 1500);
}, 1500);

module.exports.search = function(keyword) {
    return new Promise((resolve) => {
        var tmp = encodeURIComponent(keyword);
        const url = `https://api.photozou.jp/rest/search_public.json?keyword=${tmp}`;
        requestQuere.push({
            resolve,
            url
        });
    });
};

function get(data) {
    var url = data.url;
    var resolve = data.resolve;

    console.log(`access: ${url}`);
    request.get({url, json: true}, (err, res, body) => {
        if (err || res.statusCode != 200) {
            console.error('接続エラー');
            console.error(url);
            console.error(err);
            console.error(body);
            resolve();
        } else {
            resolve(select(body));
        }
    });
}

function select(body) {
    var num = body.info.photo_num;
    if (!num) {
        return;
    }
    var idx = Math.floor(Math.random() * num);
    return body.info.photo[idx];
}
