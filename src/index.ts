import { getPrompt, getTextDelimiter } from "./prompt";
import { callLlm, isApiKeyRequired } from "./requester";
import { retrieveTextInjection, replaceTextInjection, restoreOriginalTextsInjection, insertCssInjection, registerAlert } from "./injection";


let isConerting = false;

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (_) => {
    chrome.action.setBadgeText({ text: "OFF" });
  });
});

chrome.webNavigation.onCompleted.addListener((details) => {
  if (details.frameId === 0) {
    chrome.tabs.get(details.tabId, (_) => {
      chrome.action.setBadgeText({ text: "OFF" });
    });
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id === undefined) {
    console.error("渡されたtabが不正")
    return;
  }
  if (isConerting) {
    registerAlert(tab, "現在クソデカ変換の最中です！", false)
    console.error("現在クソデカ変換の最中です！")
    return;
  }
  isConerting = true;

  if (await isApiKeyRequired()) {
    // APIキーが設定されていない場合（初回起動時など）は、APIを登録するページを別タブで表示する
    chrome.tabs.create({ url: 'register.html' });
    isConerting = false;
    return;
  }

  const prevState = await chrome.action.getBadgeText({ tabId: tab.id });
  const nextState = prevState === 'デカ' ? 'OFF' : 'デカ';

  if (nextState === 'デカ') {
    registerAlert(tab, "テキスト変換処理を実行します", false)

    const rawTexts: string[] = await retrieveTextInjection(tab); // through chrome.scripting
    if(rawTexts.length === 0) {
      registerAlert(tab, "テキスト取得に失敗しました")
      isConerting = false;
      return;
    }

    const textDelimiter: string = getTextDelimiter();
    const prompt: string = getPrompt(rawTexts.join(textDelimiter));
    const convertedText: string = await callLlm(prompt);
    if(convertedText == "") {
      registerAlert(tab, "テキスト変換に失敗しました")
      isConerting = false;
      return;
    }

    const isSucceeded: boolean = await replaceTextInjection(tab, convertedText, textDelimiter); // through chrome.scripting
    if(!isSucceeded) {
      registerAlert(tab, "テキスト置き換え処理に失敗しました")
      isConerting = false;
      return;
    }

    registerAlert(tab, "テキスト変換処理は正常に実行されました", false)

    const isInserting = true;
    await insertCssInjection(tab, isInserting); // through chrome.scripting

  } else if (nextState === 'OFF') {
    const isSucceeded = await restoreOriginalTextsInjection(tab); // through chrome.scripting
    if(!isSucceeded) {
      registerAlert(tab, "テキスト復元処理に失敗しました")
      isConerting = false;
      return;
    }

    const isInserting = false;
    await insertCssInjection(tab, isInserting); // through chrome.scripting
  }

  isConerting = false;

  chrome.action.setBadgeText({
    text: nextState
  });
});
