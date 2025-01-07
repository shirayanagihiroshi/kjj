/*
 * kjj.dialog.js
 * ログインダイアログモジュール
 */
kjj.dialog = (function () {
  'use strict';

  //---モジュールスコープ変数---
  var configMap = {
        main_html : String()
        + '<div class="kjj-dialog">'
          + '<div class="kjj-dialog-head">'
            + '<h1>ログインする？</h1>'
            + '<div class="kjj-dialog-head-closer">'
              + '<p>x</p>'
            + '</div>'
          + '</div>'
          + '<div class="kjj-dialog-main">'
            + '<div class="kjj-dialog-main-username-title">'
              + '<p>ユーザID</p>'
            + '</div>'
            + '<input type="text" class="kjj-dialog-main-username-textbox">'
            + '<div class="kjj-dialog-main-passward-title">'
              + '<p>password</p>'
            + '</div>'
            + '<input type="password" class="kjj-dialog-main-passward-textbox">'
            + '<button class="kjj-dialog-main-button-ok">'
              + '<p>ok</p>'
            + '</button>'
            + '<button class="kjj-dialog-main-button-cancel">'
              + '<p>cancel</p>'
            + '</button>'
          + '</div>'
        + '<div>',
        settable_map : {}
      },
      stateMap = {
        $append_target : null
      },
      jqueryMap = {},
      setJqueryMap, configModule, initModule, removeDialog, onClose, onOK;

  //---DOMメソッド---
  setJqueryMap = function () {
    var $append_target = stateMap.$append_target,
        $dialog = $append_target.find( '.kjj-dialog' );
    jqueryMap = {
      $dialog          : $dialog,
      $closer          : $dialog.find( '.kjj-dialog-head-closer' ),
      $usernameTitle   : $dialog.find( '.kjj-dialog-main-username-title' ),
      $usernameTextbox : $dialog.find( '.kjj-dialog-main-username-textbox' ),
      $PasswordTitle   : $dialog.find( '.kjj-dialog-main-passward-title' ),
      $PasswordTextbox : $dialog.find( '.kjj-dialog-main-passward-textbox' ),
      $buttonOK        : $dialog.find( '.kjj-dialog-main-button-ok' ),
      $buttonCancel    : $dialog.find( '.kjj-dialog-main-button-cancel' )
    };
  }

  //---イベントハンドラ---
  onClose = function () {
    $.gevent.publish('cancelDialog', [{}]);
    return false;
  }

  onOK = function () {
    // console.log(jqueryMap.$usernameTextbox.val());
    // console.log(jqueryMap.$PasswordTextbox.val());

    kjj.model.login({userId:jqueryMap.$usernameTextbox.val(),
                     passWord:jqueryMap.$PasswordTextbox.val()});
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

    jqueryMap.$buttonOK
      .click( onOK );
    jqueryMap.$closer
      .click( onClose );
    jqueryMap.$buttonCancel
      .click( onClose );

    return true;
  }

  return {
    configModule : configModule,
    initModule   : initModule,
    removeDialog : removeDialog
  };
}());
