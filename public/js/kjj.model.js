/*
 * kjj.model.js
 * モデルモジュール
 */

kjj.model = (function () {
  'use strict';

  var initModule, login, logout, islogind, getAKey,
      initLocal, iskyouin, readySeito, getSeito, upload,//関数
      accessKey, userKind, name, seito; //モジュールスコープ変数

  initLocal = function () {
    accessKey   = {};
    userKind    = 0;
    name        = "";
    seito       = [];
  }

  initModule = function () {

    initLocal();

    kjj.data.initModule();

    kjj.data.registerReceive('loginResult', function (msg) {
      let eventName;
      // ログイン成功
      if ( msg.result == true ) {
        accessKey = { userId : msg.userId,
                      token  : msg.token};
        userKind  = msg.userKind;
        name      = msg.name;

        $.gevent.publish('loginSuccess', [{ name: name }]);

      // ログイン失敗
      } else {
        $.gevent.publish('loginFailure', [msg]);
      }
    });

    // 生徒個人情報　取得完了
    kjj.data.registerReceive('getSeitoResult', function (msg) {
      seito = msg.res;

      $.gevent.publish('getSeitoResult', [msg]);
    });

    // 登録成功
    kjj.data.registerReceive('uploadResult', function (msg) {
      // 余り行儀が良くない処理な気がする
      kjj.itiran.uploadFinish();
    });

    // 登録失敗
    kjj.data.registerReceive('updateReserveFailure', function (msg) {
      $.gevent.publish('updateReserveFailure', [{}]);
    });

    // 削除結果
    kjj.data.registerReceive('deleteReserveResult', function (msg) {
      $.gevent.publish('deleteReserveResult', [{}]);
    });

    // 削除失敗
    kjj.data.registerReceive('deleteReserveResultFailure', function (msg) {
      $.gevent.publish('deleteReserveResultFailure', [{}]);
    });


    kjj.data.registerReceive('logoutResult', function (msg) {
      let eventName;
      // ログアウト成功
      if ( msg.result == true ) {
        eventName = 'logoutSuccess';

        initLocal();
      // ログアウト失敗
      } else {
        // 失敗したとして、どうする？
        eventName = 'logoutFailure';
      }
      $.gevent.publish(eventName, [msg]);
    });

  };//initModule end


  login = function (queryObj) {
    kjj.data.sendToServer('tryLogin',queryObj);
  };

  logout = function () {
    console.log(accessKey);
    kjj.data.sendToServer('tryLogout',{userId : accessKey.userId,
                                       token  : accessKey.token});
  };

  islogind = function () {
    //accessKeyがtokenプロパティを持ち
    if ( Object.keys(accessKey).indexOf('token') !== -1 ) {
      //さらに空でない文字列が設定されていればログイン済
      if ( accessKey.token !== undefined ) {
        if (accessKey.token != "") {
          return true;
        }
      }
    }
    return false;
  };

  getAKey = function () {
    return accessKey;
  };

  // userKind : 教員   : 10
  //          : 保護者 : 20
  iskyouin = function () {

    if (userKind == 10) {
      return true;
    } else {
      return false;
    }
  }

  readySeito = function (nendo) {
    let queryObj = {AKey : accessKey,
                    SKey : {"clsinfo.nendo" : nendo}};
    kjj.data.sendToServer('getSeito',queryObj);
  }

  getSeito = function () {
    return seito;
  }

  upload = function (objs) {
    let queryObj = {AKey : accessKey,
                    upData : objs};
    kjj.data.sendToServer('upload',queryObj);
  }

  return { initModule      : initModule,
          login            : login,
          logout           : logout,
          islogind         : islogind,
          getAKey          : getAKey,
          iskyouin         : iskyouin,
          readySeito       : readySeito,
          getSeito         : getSeito,
          upload           : upload
        };
}());
