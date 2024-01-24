// ==UserScript==
// @name        联合早报页面助手
// @namespace   Violentmonkey Scripts
// @match       https://www.zaobao.com/*
// @version     1.0
// @license     MIT
// @author      LX
// @description 2024/1/23 21:08:54
// ==/UserScript==

/**
 * 主要原理是页面中文章的段落<p>标签，带有data-s属性，按data-s属性排序，重新拼接即可。
 * 其中data-s属性去掉开头三个字符后，按base32解码，即为顺序号。
 * 此外，保留了原有延伸阅读部分的内容，并拼接至文末。
 */

(function () {
  "use strict";
  var Element_ps = document.querySelectorAll("p[data-s]");
  var frd = "";
  if (document.getElementsByClassName("further-reading")) {
    frd = document.getElementsByClassName("further-reading")[0].outerHTML;
  }
  let res = {};
  for (var i = 0; i < Element_ps.length; i++) {
    let item = Element_ps[i];
    let ranking = base32Decode(item.getAttribute("data-s").slice(3)).padStart(
      5,
      "0"
    );
    let txt = item.innerHTML;
    res[ranking] = txt;
  }
  let newkey = Object.keys(res).sort();
  var webtxt = "";
  for (var i = 0; i < newkey.length; i++) {
    let swebtxt = res[newkey[i]];
    if (swebtxt.trim()) {
      webtxt += "<p>" + res[newkey[i]] + "</p>";
    }
  }
  document.getElementById("article-body").innerHTML = webtxt + frd;
  console.log("转换成功！");
})();

/**
 * base32解码
 * @param {string} encodedStr
 */
function base32Decode(encodedStr) {
  encodedStr = encodedStr.replace(/\=+?$/g, "");
  var base32Table = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
  ];
  var intCode = function (chr) {
    return base32Table.indexOf(chr.toUpperCase());
  };
  var toBinary = function (dec) {
    return dec.toString(2);
  };
  var toDec = function (binStr) {
    return parseInt(binStr, 2);
  };

  var strlen = encodedStr.length,
    pos = 0;
  var binStr = "",
    bytes = [];

  while (pos < strlen) {
    binStr += toBinary(intCode(encodedStr[pos])).padStart(5, "0"); //将索引转为二进制串,补足5位。
    pos++;
    if (binStr.length < 8) {
      //小于8位长度则继续往下拼接。
      continue;
    }
    bytes.push(toDec(binStr.substring(0, 8))); //取8位二进制字符串转为整数。
    binStr = binStr.substring(8); //余下的二进制串作为下一次拼接的开始串。
  }
  var toAsciiStr = function (bytesArray) {
    //Only for ASCII characters converting.
    var str = "";
    while (bytesArray.length > 0) {
      //String.fromCharCode() parameters sequence should be less than 65535
      str += String.fromCharCode.apply(null, bytesArray.splice(0, 65535));
    }
    return str;
  };
  //return toAsciiStr(bytes);
  return stringFromUTF8Array(bytes);
}

function stringFromUTF8Array(data) {
  var extraByteMap = [1, 1, 1, 1, 2, 2, 3, 0];
  var count = data.length;
  var str = "";

  for (var index = 0; index < count; ) {
    var ch = data[index++];
    if (ch & 0x80) {
      var extra = extraByteMap[(ch >> 3) & 0x07];
      if (!(ch & 0x40) || !extra || index + extra > count) return null;
      ch = ch & (0x3f >> extra);
      for (; extra > 0; extra -= 1) {
        var chx = data[index++];
        if ((chx & 0xc0) != 0x80) return null;
        ch = (ch << 6) | (chx & 0x3f);
      }
    }
    str += String.fromCharCode(ch);
  }
  return str;
}
