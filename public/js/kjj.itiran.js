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
          + '<span class="kjj-itiran-wait">通信中</span>'
          + '<table class="kjj-itiran-table"></table>',
        gakunenList  : ['-', '中学', '高1', '高2', '高3'],
        tikuList     : ['地区A(1)', '地区B(2)', '地区C(3)'],
        csvHeader    : 'DBID,中高,1年組,1年番,2年組,2年番,3年組,3年番,氏名,PTA地区番,住所',
        kaigyou      : '\r\n',
        tableHeader  : '<tr><th>中高</th><th>学年</th><th>クラス</th><th>番号</th><th>氏名</th><th>PTA地区番</th><th>住所</th>',
        downloadFileName : 'kojinjyouhou_',
        settable_map : { targetNendo : true },
        targetNendo  : 0,
      },
      stateMap = {
        $container : null,
        downloading : true,
        changeNendo : 0
      },
      jqueryMap = {},
      setJqueryMap, configModule, initModule, downloadFinish, changeNendo,
      upload, uploadFinish, removeItiran, initLocal, onPreviousYear,
      onNextYear, onDownload, onUpload, uploadInner, createTable;

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

  uploadFinish = function ( ) {
    // データ取得開始
    kjj.model.readySeito(configMap.targetNendo);
  }

  // 表示年度を変えるときは初回表示時と同じようにする
  onPreviousYear = function ( ) {
    stateMap.changeNendo = configMap.targetNendo - 1;
    $.gevent.publish('verifyChange', [{errStr:String(stateMap.changeNendo) + '年度の情報に切り替えますか？'}]);
  }

  onNextYear = function ( ) {
    stateMap.changeNendo = configMap.targetNendo + 1;
    $.gevent.publish('verifyChange', [{errStr:String(stateMap.changeNendo) + '年度の情報に切り替えますか？'}]);
  }

  onDownload = function ( ) {
    if (stateMap.downloading == false) {
      const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
      const content = createTable('csv');
      const blob = new Blob([ bom, configMap.csvHeader + configMap.kaigyou + content ], { "type" : "text/csv" });

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
    $.gevent.publish('verifyUpload', [{errStr:String(configMap.targetNendo) + '年度のデータとして登録しますか？'}]);
  }

  // ほぼgeminiに教えてもらったコード
  upload = function ( ) {
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

  //---ユーティリティメソッド---
  initLocal = function () {
    // ダウンロード中フラグをたてて
    stateMap.downloading = true;

    // ダウンロード中表示をし
    jqueryMap.$wait.css('display', 'block');

    // テーブルを初期化して
    jqueryMap.$table.html('');
  }

  uploadInner = function (str) {
    let i, obj, objPerson, record, tyuukou, clsinfo,
      records = str.split( configMap.kaigyou ),
      objs = [];

    // 0行目は項目名
    for (i = 1; i < records.length; i++) {
      // 最後は無効な行かもしれない
      if (records[i].length == 0) {
        continue;
      }

      record = records[i].split(',');

      if (record[0] == '中' || record[0] == '中学' || record[0] == '中学校') {
        tyuukou = 0;
      } else {
        tyuukou = 1;
      }
      objPerson = { shimei  : record[8],
                    tikuban : record[9],
                    address : record[10] };

      // 1年次のクラス、2年次クラス、3年次クラスを追加
      clsinfo = [];
      // 2年と3年が空欄なら1年生
      if (record[4].length == 0 && record[5].length == 0 &&
          record[6].length == 0 && record[7].length == 0) {
        clsinfo.push({nendo   : configMap.targetNendo,
                      gakunen : 1                    ,
                      cls     : Number(record[2])    ,
                      bangou  : Number(record[3])     });
      // そうでなく、3年が空欄なら2年生
      } else if (record[6].length == 0 && record[7].length == 0) {
        clsinfo.push({nendo   : configMap.targetNendo - 1,
                      gakunen : 1                        ,
                      cls     : Number(record[2])        ,
                      bangou  : Number(record[3])         });
        clsinfo.push({nendo   : configMap.targetNendo    ,
                      gakunen : 2                        ,
                      cls     : Number(record[4])        ,
                      bangou  : Number(record[5])         });
      // そうでなければ3年生
      } else {
        clsinfo.push({nendo   : configMap.targetNendo - 2,
                      gakunen : 1                        ,
                      cls     : Number(record[2])        ,
                      bangou  : Number(record[3])         });
        clsinfo.push({nendo   : configMap.targetNendo - 1,
                      gakunen : 2                        ,
                      cls     : Number(record[4])        ,
                      bangou  : Number(record[5])         });
        clsinfo.push({nendo   : configMap.targetNendo    ,
                      gakunen : 3                        ,
                      cls     : Number(record[6])        ,
                      bangou  : Number(record[7])         });
      }
      objPerson.clsinfo = clsinfo;

      obj = {updateOne:{filter: { _id  : record[0] },
                        update: { $set : objPerson },
                        upsert: true                }};
      console.log(obj);
      objs.push(obj);
    }
    // アップロード処理
    kjj.model.upload(objs);
    $.gevent.publish('cancelDialog', [{}]);
    initLocal();
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

      // uploadのときにIDが必要
      if (kind == 'csv') {
        str += seito[i]._id + ',';
      }

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
        str += configMap.kaigyou;
      } else if (kind == 'html') {
        str += '</td></tr>';
      }
    }
    return str;
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

    initLocal();

    // データ取得開始
    kjj.model.readySeito(configMap.targetNendo);

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

  changeNendo  = function ( ) {
    $.gevent.publish('changeNendo', [{nendo : stateMap.changeNendo}]);
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
    changeNendo    : changeNendo,
    upload         : upload,
    uploadFinish   : uploadFinish,
    removeItiran   : removeItiran
  };
}());
