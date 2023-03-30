"use strict";
var area, txt;
var fontsize = 18;
var s = {
  INIT: 1,
  PLAY: 2,
  PAUSED: 3,
  END: 4,
};
var iplay,
  previplay,
  playstate = s.INIT;
var start, end;
var msg = null;
var imsg;
var voices = [];
var voiceindex = 3;
var volume;
$(document).ready(function () {
  try {
    eval('"use strict"; class foo {}');
  } catch (e) {
    alert(
      "Speech synthesis is not supported in this browser!\nPlease use Chrome browser."
    );
  }
  SpeechSynth.init();
  SpeechForm.init();
});

class SpeechForm {
  static init() {
    playstate = s.INIT;
    $("#back").prop("disabled", false);
    $("#play").prop("disabled", false);
    $("#forw").prop("disabled", false);
    txt = $("#area").val();
    txt = txt.replace(/\t/g, "");
    $("#area").val(txt);
    SpeechForm.populateVoiceList();
  }
  static populateVoiceList() {
    var voices = SpeechSynth.getvoices();
    if (voices == null) return;
    //if( voices.length>21 ) voices.length=21;
    for (var i = 0; i < voices.length; i++) {
      var textContent = voices[i].name + " (" + voices[i].lang + ")";
      if (textContent.substring(0, 6) == "Google")
        textContent = textContent.substring(7, textContent.length);
      if (textContent.substring(0, 9) == "Microsoft")
        textContent = textContent.substring(10, textContent.length);
      $("#voiceselect").append("<option>" + textContent + "</option>");
    }
    i = 1;
    if (voices.length >= 4) i = 1;
    $("#voiceselect option:nth-child(" + i + ")").prop("selected", true);
    SpeechSynth.setvoice(i - 1);
  }
  static copy() {
    $("#area").select();
    document.execCommand("copy");
  }

  static voicechange() {
    var i = $("#voiceselect")[0].selectedIndex;
    SpeechSynth.setvoice(i);
  }
  static volumebtn() {}
  static volchange() {
    var v = $("#volumerange").val();
    SpeechSynth.setvolume(v);
  }
  static resetform() {
    SpeechSynth.stop();
    playstate = s.END;
    $("#area").val("");
    $("#area").focus();
  }
  static stopbtn() {
    SpeechSynth.stop();
    if (playstate == s.INIT) {
      playstate = s.END;
      SpeechForm.playmng();
    } else playstate = s.END;
  }
  static setselect() {
    $("#area")[0].selectionStart = start;
    $("#area")[0].selectionEnd = end;
    $("#area").focus();
  }
  static playbtn() {
    if (playstate == s.END) playstate = s.INIT;

    if (playstate == s.INIT) {
      $("#play").html("Pause");
      SpeechForm.playmng();
    } else if (playstate == s.PLAY) {
      $("#play").html("Play");
      playstate = s.PAUSED;
      SpeechSynth.stop();
      SpeechForm.setselect();
    } else if (playstate == s.PAUSED) {
      $("#play").html("Pause");
      playstate = s.PLAY;
      iplay--;
      SpeechForm.playmng();
      SpeechForm.setselect();
    }
  }
  static playmng() {
    switch (playstate) {
      case s.INIT:
        SpeechSynth.stop();
        area = $("#area").val();
        if (area == "") {
          $("#play").html("Play");
          return;
        }
        txt = area.replace(/([.?!:,\r\n])\s*/g, "$1|").split("|");
        if (txt == null || txt.length == 0) {
          $("#play").html("Play");
          return;
        }
        iplay = start = end = 0;
        previplay = -1;
        playstate = s.PLAY;
      case s.PLAY:
        var t = txt[iplay].replace(/[\"\'\’\‘]/gi, "");
        SpeechSynth.play(t);
        if (previplay != iplay) {
          previplay = iplay;
          start = area.indexOf(txt[iplay], end);
          end = start + txt[iplay].length;
        }
        SpeechForm.setselect();
        if (++iplay == txt.length) playstate = s.END;
        break;
      case s.PAUSED:
        break;
      case s.END:
        $("#play").html("Play");
        $("#area").blur();
        playstate = s.INIT;
        break;
      default:
        console.log("Bad playstate!!!");
    }
  }
}
class SpeechSynth {
  static init() {
    if (!("speechSynthesis" in window)) {
      alert(
        "Speech synthesis is not supported in this browser!\nPlease use Chrome browser."
      );
      return;
    }
    SpeechSynth.stop();
    voices = window.speechSynthesis.getVoices();
    volume = 1.0;
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = function () {
        console.log("onvoiceschanged()");
        if (voices.length > 0) return;
        voices = window.speechSynthesis.getVoices();
        SpeechForm.populateVoiceList();
      };
    }
  }
  static getvoices() {
    return voices;
  }
  static setvoice(i) {
    voiceindex = i;
  }
  static setvolume(v) {
    volume = v;
  }
  static ispending() {
    return window.speechSynthesis.pending;
  }
  static stop() {
    window.speechSynthesis.cancel();
  }
  static pause() {
    window.speechSynthesis.pause();
  }
  static resume() {
    window.speechSynthesis.resume();
  }
  static play(s) {
    if (voices.length == 0)
      alert("No voices detected. Please restart the browser and try again.");
    msg = new SpeechSynthesisUtterance();
    msg.onend = function (e) {
      SpeechForm.playmng();
    };
    msg.onerror = function (e) {
      console.log("Error in " + e.elapsedTime + " seconds.");
      SpeechForm.playmng();
    };
    var slider = $("#slider").val();
    msg.voice = voices[voiceindex];
    msg.volume = volume; // 0 to 1
    msg.rate = slider; // 0.1 to 10
    msg.pitch = 0; //0 to 2
    msg.text = s;
    msg.lang = voices[voiceindex].lang;
    window.speechSynthesis.speak(msg);
    if (++imsg == 2) imsg = 0;
  }
}
