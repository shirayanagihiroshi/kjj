/*
 * kjj.dialogOkCancel.js
 * OK Cancel ダイアログ部モジュール
 */
kjj.dialogOkCancel = (function () {
  'use strict';

  //---モジュールスコープ変数---
  var configMap = {
        main_html : String()
        + '<div class="kjj-dialogOkCancel">'
          + '<div class="kjj-dialogOkCancel-main">'
            + '<div class="kjj-dialogOkCancel-main-title">'
            + '</div>'
            + '<button class="kjj-dialogOkCancel-main-button-ok">'
              + '<p>ok</p>'
            + '</button>'
            + '<button class="kjj-dialogOkCancel-main-button-cancel">'
              + '<p>cancel</p>'
            + '</button>'
          + '</div>'
        + '<div>',
        settable_map : {showStr : true,
                        okFunc  : true,
                        ngFunc  : true},
        showStr : "",
        okFunc  : function () {},
        ngFunc  : function () {}
      },
      stateMap = {
        $append_target : null
      },
      jqueryMap = {},
      setJqueryMap, configModule, initModule, removeDialog, onCancel, closeMe, onOK;

  //---DOMメソッド---
  setJqueryMap = function () {
    var $append_target = stateMap.$append_target,
        $dialog = $append_target.find( '.kjj-dialogOkCancel' );
    jqueryMap = {
      $dialog          : $dialog,
      $title           : $dialog.find( '.kjj-dialogOkCancel-main-title' ),
      $buttonOK        : $dialog.find( '.kjj-dialogOkCancel-main-button-ok' ),
      $buttonCancel    : $dialog.find( '.kjj-dialogOkCancel-main-button-cancel' )
    };
  }

  //---イベントハンドラ---
  onCancel = function () {
    //こっちも設定可能にする
    configMap.ngFunc();
    return false;
  }

  closeMe = function () {
    $.gevent.publish('cancelDialog', [{}]);
  }

  onOK = function () {
    //いろいろな機能を受け持つので、configModuleで指定しておく
    configMap.okFunc();
    return false;
  }

  //---パブリックメソッド---
  configModule = function ( input_map ) {
    kjj.util.setConfigMap({
      input_map : input_map,
      settable_map : configMap.settable_map,
      config_map : configMap
    });
    return true;
  }

  removeDialog = function ( ) {
    //初期化と状態の解除
    if ( jqueryMap != null ) {
      if ( jqueryMap.$dialog ) {
        jqueryMap.$dialog.remove();
        jqueryMap = null;
      }
    }
    stateMap.$append_target = null;
    return true;
  }

  initModule = function ( $append_target ) {
    // $container.html( configMap.main_html );
    // じゃなくて、appendするパターン
    // shellでコンテナを用意すると、dialog側を消してもコンテナが残っちゃう。
    $append_target.append( configMap.main_html );
    stateMap.$append_target = $append_target;
    setJqueryMap();

    jqueryMap.$title.html( configMap.showStr );

    jqueryMap.$buttonOK
      .click( onOK );
    jqueryMap.$buttonCancel
      .click( onCancel );

    return true;
  }

  return {
    configModule : configModule,
    initModule   : initModule,
    removeDialog : removeDialog,
    closeMe      : closeMe
  };
}());
