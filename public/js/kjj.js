/*
 * kjj.js
 * ルート名前空間モジュール
 */
var kjj = (function () {
  'use strict';

  var initModule = function ( $container ) {
    kjj.model.initModule();
    kjj.shell.initModule($container);
  }

  return { initModule : initModule };
}());
