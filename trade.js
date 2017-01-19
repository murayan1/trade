const Promise = require('bluebird');
const crypto = require('crypto');
const request = require('request');

//bitfrlyer key
const key = '';
const secret = '';

//値の初期化
var bitflyer_bid = 0;
var zaif_bid  = 0;
var bitflyer_ask = 0;
var zaif_ask  = 0;
var buy_count = 0;
var buy_price = 0;
var sell_count = 0;
var sell_price = 0;


//bitflyer zaifからjson取得
var bitflyer = function  (zaif) {
var path = '/v1/getticker';
var query = '';
var url = 'https://api.bitflyer.jp' + path + query;
//request関数実行後にやりたい処理を第二引数のcallbackの中に書く
request(url, function (err, response, payload) {
        if (err === null) {
                    try {
        // エラーじゃなければJSONをパース
        var obj = JSON.parse(payload);
        //オブジェクトから買い気配取り出し

        //買い価格
        bitflyer_bid = obj.best_bid;
        bitflyer_bid_size = obj.best_bid_size;
        //売り価格
        bitflyer_ask = obj.best_ask;
        bitflyer_ask_size = obj.best_ask_size;

        }
            catch (e) {
                       err = e;
                    }
    	}

    	if (err) {
    		console.log(err);
    	}

        zaif();

     });
   };

//zaifからjson取得
var zaif = function () {
var path = '/api/1/depth/btc_jpy';
var query = '';
var url = 'https://api.zaif.jp' + path + query;
    request(url, function (err, response, payload) {
        if (err === null) {
       try {
                // エラーじゃなければJSONをパース
                // 「JSON 文字列」から「JavaScript のオブジェクト」に変換する
                obj = JSON.parse(payload);
                //買い価格
                zaif_bid = obj.bids[0][0];
                zaif_bid_size = obj.bids[0][1];
                //売り価格
                zaif_ask = obj.asks[0][0];
                zaif_ask_size = obj.asks[0][1];


                zaif_price = zaif_bid;

           }
            catch (e) {
                        err = e;
                       }
    	}

    	if (err) {
                    console.log(err);
                 }
    });
};

//注文処理
setInterval (function(){

            bitflyer(zaif);
            //買い注文
        if(buy_count === 0 && zaif_ask !== 0 && bitflyer_ask !== 0 && zaif_ask - bitflyer_ask >= 20){

               try {
                  console.log("買い"+bitflyer_ask);
                    var timestamp = Date.now().toString();
                    var method = 'POST';
                    var path = '/v1/me/sendchildorder';
                    var body = JSON.stringify({
                      "product_code": "BTC_JPY",
                      "child_order_type": "LIMIT",//MARKET or LIMIT
                      "side": "BUY",
                      "price": bitflyer_ask,
                      "size": 0.045,
                      "minute_to_expire": 10000,
                      "time_in_force": "GTC"
                    });

                    var text = timestamp + method + path + body;
                    var sign = crypto.createHmac('sha256', secret).update(text).digest('hex');

                    var options = {
                        url: 'https://api.bitflyer.jp' + path,
                        method: method,
                        body: body,
                        headers: {
                            'ACCESS-KEY': key,
                            'ACCESS-TIMESTAMP': timestamp,
                            'ACCESS-SIGN': sign,
                            'Content-Type': 'application/json'
                        }
                    };
                    request(options, function (err, response, payload) {
                        console.log(payload);
                    });

                    //購入価格の保存
                    buy_price = bitflyer_ask;
                    buy_count++;

                }


                  catch (e) {
                        err = e;
                       }
        }

        //買い決済処理
       else if(buy_count ===1&& buy_price < bitflyer_bid ){
             try {

                    console.log("買い決済（売り）"+bitflyer_bid);
                    var timestamp = Date.now().toString();
                    var method = 'POST';
                    var path = '/v1/me/sendchildorder';
                    var body = JSON.stringify({
                      "product_code": "BTC_JPY",
                      "child_order_type": "LIMIT",
                      "side": "SELL",
                      "price": bitflyer_bid,
                      "size": 0.045,
                      "minute_to_expire": 10000,
                      "time_in_force": "GTC"
                    });

                    var text = timestamp + method + path + body;
                    var sign = crypto.createHmac('sha256', secret).update(text).digest('hex');

                    var options = {
                        url: 'https://api.bitflyer.jp' + path,
                        method: method,
                        body: body,
                        headers: {
                            'ACCESS-KEY': key,
                            'ACCESS-TIMESTAMP': timestamp,
                            'ACCESS-SIGN': sign,
                            'Content-Type': 'application/json'
                        }
                    };
                    request(options, function (err, response, payload) {
                        console.log(payload);
                    });
                    buy_count--;
                    buy_price = 0;
             }
              catch (e) {
                        err = e;
                       }

       }

        //売り注文
         if(sell_count === 0 && zaif_bid !== 0 && bitflyer_bid !== 0 && bitflyer_bid - zaif_bid >= 20){

               try {
                   console.log("売り"+bitflyer_bid);
                    var timestamp = Date.now().toString();
                    var method = 'POST';
                    var path = '/v1/me/sendchildorder';
                    var body = JSON.stringify({
                      "product_code": "BTC_JPY",
                      "child_order_type": "LIMIT",
                      "side": "SELL",
                      "price": bitflyer_bid,
                      "size": 0.045,
                      "minute_to_expire": 10000,
                      "time_in_force": "GTC"
                    });

                    var text = timestamp + method + path + body;
                    var sign = crypto.createHmac('sha256', secret).update(text).digest('hex');

                    var options = {
                        url: 'https://api.bitflyer.jp' + path,
                        method: method,
                        body: body,
                        headers: {
                            'ACCESS-KEY': key,
                            'ACCESS-TIMESTAMP': timestamp,
                            'ACCESS-SIGN': sign,
                            'Content-Type': 'application/json'
                        }
                    };
                    request(options, function (err, response, payload) {
                        console.log(payload);
                    });

                    //売却価格の保存
                    sell_price = bitflyer_bid;
                    sell_count++;

                }


                  catch (e) {
                        err = e;
                       }
        }

        //売り決済処理
       else if(sell_count ===1 && bitflyer_ask < sell_price){
            try {

                    console.log("売り決済（買い）"+bitflyer_ask);
                    var timestamp = Date.now().toString();
                    var method = 'POST';
                    var path = '/v1/me/sendchildorder';
                    var body = JSON.stringify({
                      "product_code": "BTC_JPY",
                      "child_order_type": "LIMIT",
                      "side": "BUY",
                      "price": bitflyer_ask,
                      "size": 0.045,
                      "minute_to_expire": 10000,
                      "time_in_force": "GTC"
                    });

                    var text = timestamp + method + path + body;
                    var sign = crypto.createHmac('sha256', secret).update(text).digest('hex');

                    var options = {
                        url: 'https://api.bitflyer.jp' + path,
                        method: method,
                        body: body,
                        headers: {
                            'ACCESS-KEY': key,
                            'ACCESS-TIMESTAMP': timestamp,
                            'ACCESS-SIGN': sign,
                            'Content-Type': 'application/json'
                        }
                    };
                    request(options, function (err, response, payload) {
                        console.log(payload);
                    });
                    sell_price = 0;
                    sell_count --;
                }

                 catch (e) {
                        err = e;
                       }
}
//終わり

 },200);
