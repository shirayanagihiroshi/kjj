/*
 * kjj.data.js
 * モデルモジュール
 */

kjj.data = (function () {
  'use strict';

  // ソケットの通信はここに集約する。
  // (kjj.htmlでjs,cssを更新する処理のみ例外)
  const socket = io();
  var initModule, sendToServer, registerReceive;


  initModule      = function () {};
  sendToServer    = function (eventName, targetObj) {
    socket.emit(eventName, targetObj);
  };
  registerReceive = function (eventName, callback) {
    socket.on(eventName, callback);
  };

  return { initModule      : initModule,
           sendToServer    : sendToServer,
           registerReceive : registerReceive};
}());
