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
          + '<input type="file" id="kjj-itiran-fileSelect">'
          + '<button class="kjj-itiran-upload">アップロード</button>'
          + '<span class="kjj-itiran-wait">データ取得中</span>'
          + '<table class="kjj-itiran-table"></table>',
        gakunenList  : ['-', '中学', '高1', '高2', '高3'],
        tikuList     : ['地区A(1)', '地区B(2)', '地区C(3)'],
        csvHeader  : '中高,1年組,1年番,2年組,2年番,3年組,3年番,氏名,PTA地区番,住所\n',
        tableHeader  : '<tr><th>中高</th><th>学年</th><th>クラス</th><th>番号</th><th>氏名</th><th>PTA地区番</th><th>住所</th>',
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
      initLocal, onPreviousYear, onNextYear, onDownload, onUpload, uploadInner, 
      createTable, backToCalendar, setView;

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
      $fileSelect    : $container.find( '#kjj-itiran-fileSelect' ),
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
      const blob = new Blob([ bom, configMap.csvHeader + content ], { "type" : "text/csv" });

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

  // ほぼgeminiに教えてもらったコード
  onUpload = function ( ) {
    const fileInput = document.getElementById('kjj-itiran-fileSelect');
    const file = fileInput.files[0];

    if (file) {
      const reader = new FileReader();

      reader.onload = (event) => {
        const result = event.target.result;
        // 読み込んだファイルの内容を処理する
        uploadInner(result);
      };

      reader.onerror = () => {
        console.error('ファイルの読み込みに失敗しました');
      };

      // テキストファイルとして読み込む
      reader.readAsText(file);
    } else {
      console.error('ファイルが選択されていません');
    }
  }
/*
  onWakuSet = function ( ) {
    stateMap.waku = JSON.parse(jqueryMap.$waku.val());

    $.gevent.publish('verifyWaku', [{errStr:'日時の枠を設定しますか？なお、不整合を防ぐため、このクラスの予約情報は一旦全て削除されます'}]);
  }
*/
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

  uploadInner = function (str) {
    let i, j, obj, record, tyuukou,
      records = str.split('\n');

    for (i = 0; i < records.length; i++) {
      record = records[i].split(',');

      if (record[0] == '中') {
        tyuukou = 0;
      } else {
        tyuukou = 1;
      }

      obj = { tyuukou : tyuukou,
              shimei  : record[7],
              tikuban : record[8],
              address : record[9] };

      // 1年次のクラス、2年次クラス、3年次クラスを追加
      for (j = 0; j < record.length; j++) {
        if (record[0] == '中' || record[0] == '中学') {
          tyuukou = 0;
        } else {
          tyuukou = 1;
        }
	record[0]
	tyuukou
	obj = {}
        record[j];
      }
      console.log(records[i]);
    }
  }

  // kind 処理種別
  //      'csv'  : csv文字列を出力
  //      'html' : html文字列を出力
  createTable = function (kind) {
    let i, nenji1, nenji2, nenji3,
      str = "",
      seito = kjj.model.getSeito(),
      nendoF = function (nendo) {
        return function (target) {
          if ( target.nendo == nendo ) {
            return true;
          } else {
            return false;
          }
        }
      },
      gakunenF = function (gakunen) {
        return function (target) {
          if ( target.gakunen == gakunen ) {
            return true;
          } else {
            return false;
          }
        }
      };

    for (i = 0; i < seito.length; i++) {

      // 中高 中学:0, 高校:1
      if (kind == 'csv') {
        if (seito[i].tyuukou == 0) {
          str += '中,';
        } else {
          str += '高,';
        }
      } else if (kind == 'html'){
        if (seito[i].tyuukou == 0) {
          str += '<tr><td>中</td><td>';
        } else {
          str += '<tr><td>高</td><td>';
        }
      }

      // 学年、クラスの情報
      if (kind == 'csv') {
        // 一人の生徒のクラス情報を年度の降順にソート
        // (留年している生徒がいたら、新しい年度のデータを使うため)
        seito[i].clsinfo.sort((a, b) => b.nendo - a.nendo);

        // 1年時のデータ
        nenji1 = seito[i].clsinfo.find(gakunenF(1));

        if (nenji1 != null) {
          str += String(nenji1.cls) + ',' + String(nenji1.bangou) + ',';
        } else {
          str += ',,';
        }

        // 2年時のデータ
        nenji2 = seito[i].clsinfo.find(gakunenF(2));

        if (nenji2 != null) {
          str += String(nenji2.cls) + ',' + String(nenji2.bangou) + ',';
        } else {
          str += ',,';
        }

        // 3年時のデータ
        nenji3 = seito[i].clsinfo.find(gakunenF(3));

        if (nenji3 != null) {
          str += String(nenji3.cls) + ',' + String(nenji3.bangou) + ',';
        } else {
          str += ',,';
        }

      } else if (kind == 'html') {
        let kotoshi = seito[i].clsinfo.find(nendoF(configMap.targetNendo));
        str += String(kotoshi.gakunen) + '</td><td>' + String(kotoshi.cls) + '</td><td>' + String(kotoshi.bangou) + '</td><td>';
      }

      str += seito[i].shimei;

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
        jqueryMap.$fileSelect.remove();
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
