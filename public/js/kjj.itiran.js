/*
 * kjj.itiran.js
 * 個人情報一覧画面
 */
kjj.itiran = (function () {
  'use strict';

  //---モジュールスコープ変数---
  let configMap = {
        main_html : String()
          + '<span class="kjj-itiran-previous-year"> &lt; </span>'
          + '<span class="kjj-itiran-nendo"></span>'
          + '<span class="kjj-itiran-next-year"> &gt; </span>'
          + '<select class="kjj-itiran-gakunenSelect"></select>'
          + '<select class="kjj-itiran-tikuSelect"></select>'
          + '<button class="kjj-itiran-download">ダウンロード</button>'
          + '<button class="kjj-itiran-upload">アップロード</button>'
          + '<span class="kjj-itiran-wait">データ取得中</span>'
          + '<table class="kjj-itiran-table"></table>',
        gakunenList  : ['-', '中1', '中2', '中3', '高1', '高2', '高3'],
        tikuList     : ['地区A(1)', '地区B(2)', '地区C(3)'],
        tableHeader  : '<tr><th>学年</th><th>クラス</th><th>番号</th><th>氏名</th><th>PTA地区番</th><th>住所</th>',
        downloadFileName : 'kojinjyouhou_',
        settable_map : { targetNendo : true },
        targetNendo  : 0,
      },
      stateMap = {
        $container : null,
        downloading : true,
        waku : []
      },
      jqueryMap = {},
      setJqueryMap, configModule, initModule, downloadFinish, removeItiran,
      initLocal, onPreviousYear, onNextYear, onDownload, onUpload,
      createTable, backToCalendar, onWakuSet, setView;

  //---DOMメソッド---
  setJqueryMap = function () {
    var $container = stateMap.$container;
    jqueryMap = {
      $container     : $container,
      $previousYear  : $container.find( '.kjj-itiran-previous-year' ),
      $nendo         : $container.find( '.kjj-itiran-nendo' ),
      $nextYear      : $container.find( '.kjj-itiran-next-year' ),
      $gakunenSelect : $container.find( '.kjj-itiran-gakunenSelect' ),
      $tikuSelect    : $container.find( '.kjj-itiran-tikuSelect' ),
      $download      : $container.find( '.kjj-itiran-download' ),
      $upload        : $container.find( '.kjj-itiran-upload' ),
      $wait          : $container.find( '.kjj-itiran-wait' ),
      $table         : $container.find( '.kjj-itiran-table' )
    };
  }

  //---イベントハンドラ---
  downloadFinish = function ( ) {
    let str = configMap.tableHeader + createTable('html');

    jqueryMap.$table.append(str);

    jqueryMap.$wait.css('display', 'none');

    stateMap.downloading = false;
  }

  // 表示年度を変えるときはアンカーを残さずに処理する。
  // つまり、このモジュール内の初期化処理を部分的にやり直す
  onPreviousYear = function ( ) {
    if (stateMap.downloading == false) {
      initLocal(-1);
    }
  }
  onNextYear = function ( ) {
    if (stateMap.downloading == false) {
      initLocal(1);
    }
  }

  onDownload = function ( ) {
    if (stateMap.downloading == false) {
      const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
      const content = createTable('csv');
      const blob = new Blob([ bom, content ], { "type" : "text/csv" });

      // https://javascript.keicode.com/newjs/download-files.php#2-1
      // 上記参照
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      document.body.appendChild(a);
      a.download = configMap.downloadFileName + String(configMap.targetNendo) + '.csv';
      a.href = url;
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }
  }

  onUpload = function ( ) {

  }

  onWakuSet = function ( ) {
    stateMap.waku = JSON.parse(jqueryMap.$waku.val());

    $.gevent.publish('verifyWaku', [{errStr:'日時の枠を設定しますか？なお、不整合を防ぐため、このクラスの予約情報は一旦全て削除されます'}]);
  }

  //---ユーティリティメソッド---
  // 初期化時と表示年度を変えるときに呼ばれる
  initLocal = function (sabun) {
    configMap.targetNendo = configMap.targetNendo + sabun;

    // 年度の表示を更新し
    jqueryMap.$nendo.html(String(configMap.targetNendo) + '年度');

    // ダウンロード中フラグをたてて
    stateMap.downloading = true;

    // ダウンロード中表示をし
    jqueryMap.$wait.css('display', 'block');

    // テーブルを初期化して
    jqueryMap.$table.html('');

    // データ取得開始
    kjj.model.readySeito(configMap.targetNendo);
  }

  // kind 処理種別
  //      'csv'  : csv文字列を出力
  //      'html' : html文字列を出力
  createTable = function (kind) {
    let i,
      str = "",
      seito = kjj.model.getSeito(),
      f = function (nendo) {
            return function (target) {
              if ( target.nendo == nendo ) {
                return true;
              } else {
                return false;
              }
            }
          };

    for (i = 0; i < seito.length; i++) {
      let clsinfo = seito[i].clsinfo.find(f(configMap.targetNendo));

      if (kind == 'csv') {
      } else if (kind == 'html') {
        str += '<tr><td>';
      }

      str += String(clsinfo.gakunen);

      if (kind == 'csv') {
        str += ',';
      } else if (kind == 'html') {
        str += '</td><td>';
      }

      str += String(clsinfo.cls);

      if (kind == 'csv') {
        str += ',';
      } else if (kind == 'html') {
        str += '</td><td>';
      }

      str += String(clsinfo.bangou);

      if (kind == 'csv') {
        str += ',';
      } else if (kind == 'html') {
        str += '</td><td>';
      }

      str += seito[i].name;

      if (kind == 'csv') {
        str += ',';
      } else if (kind == 'html') {
        str += '</td><td>';
      }

      str += String(seito[i].tikuban);

      if (kind == 'csv') {
        str += ',';
      } else if (kind == 'html') {
        str += '</td><td>';
      }

      str += seito[i].address;

      if (kind == 'csv') {
        str += '\n';
      } else if (kind == 'html') {
        str += '</td></tr>';
      }
    }
    return str;
  }

  setView = function () {
    /*
    let i, j,
      propDate = [],
      str      = "",
      myclsWaku = yoyaku.model.getWaku(),

    let str, waku = kjj.model.getWaku();

    // 日時枠が未設定なら
    if (waku.length == 0) {
      jqueryMap.$usableButton.css('display', 'none');

      jqueryMap.$usable1.css('display', 'none');
      jqueryMap.$usable2.css('display', 'none');
    } else {

    // 日時枠が設定済なら
      jqueryMap.$usableButton.css('display', 'block');

      if (waku[0].nowusable == true) {
        jqueryMap.$usable2.css('display', 'none');
        jqueryMap.$usable3.css('display', 'none');
        str = '無効にする';
      } else {
        jqueryMap.$usable1.css('display', 'none');
        jqueryMap.$usable3.css('display', 'none');
        str = '有効にする';
      }

      jqueryMap.$usableButton.html(str);
    }
    */
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

  initModule = function ( $container ) {
    $container.html( configMap.main_html );
    stateMap.$container = $container;
    setJqueryMap();

    jqueryMap.$nendo.html(String(configMap.targetNendo) + '年度');

    let i, obj;

    for (i = 0; i < configMap.gakunenList.length; i++) {
      obj = document.createElement('option');
      obj.value = configMap.gakunenList[i];
      obj.text = configMap.gakunenList[i];
      jqueryMap.$gakunenSelect.append(obj);
    }

    for (i = 0; i < configMap.tikuList.length; i++) {
      obj = document.createElement('option');
      obj.value = configMap.tikuList[i];
      obj.text = configMap.tikuList[i];
      jqueryMap.$tikuSelect.append(obj);
    }

    // データ取得開始
    initLocal(0);

    jqueryMap.$previousYear
      .click( onPreviousYear );
    jqueryMap.$nextYear
      .click( onNextYear );
    jqueryMap.$download
      .click( onDownload );
    jqueryMap.$upload
      .click( onUpload );

    return true;
  }

  removeItiran = function ( ) {
    //初期化と状態の解除
    if ( jqueryMap != null ) {
      if ( jqueryMap.$container ) {
        jqueryMap.$previousYear.remove();
        jqueryMap.$nendo.remove();
        jqueryMap.$nextYear.remove();
        jqueryMap.$gakunenSelect.remove();
        jqueryMap.$tikuSelect.remove();
        jqueryMap.$download.remove();
        jqueryMap.$upload.remove();
        jqueryMap.$wait.remove();
        jqueryMap.$table.remove();
      }
    }
    return true;
  }

  return {
    configModule   : configModule,
    initModule     : initModule,
    downloadFinish : downloadFinish,
    removeItiran   : removeItiran
  };
}());
