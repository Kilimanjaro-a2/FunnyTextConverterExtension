import { getPrompt, getTextDelimiter } from "./prompt";
import { callLlm, isApiKeyRequired } from "./requester";
import { retrieveTextInjection, replaceTextInjection, restoreOriginalTextsInjection, insertCssInjection, toastError, toastInfo } from "./injection";

let isProcessing = false;

// 別タブに切り替えたとき
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (_) => {
    chrome.action.setBadgeText({ text: "OFF" });
  });
});

// ページ遷移したとき
chrome.webNavigation.onCompleted.addListener((details) => {
  if (details.frameId === 0) {
    chrome.tabs.get(details.tabId, (_) => {
      chrome.action.setBadgeText({ text: "OFF" });
    });
  }
});

// バッジをクリックしたとき
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id === undefined) {
    console.error("渡されたtabが不正")
    return;
  }
  if (isProcessing) {
    toastError(tab, "現在クソデカ変換の最中です！")
    return;
  }
  isProcessing = true;

  if (await isApiKeyRequired()) {
    // APIキーが設定されていない場合（初回起動時など）は、APIを登録するページを別タブで表示する
    chrome.tabs.create({ url: 'register.html' });
    isProcessing = false;
    return;
  }

  const prevState = await chrome.action.getBadgeText({ tabId: tab.id });
  const nextState = prevState === 'デカ' ? 'OFF' : 'デカ';

  if (nextState === 'デカ') {
    toastInfo(tab, "テキスト変換処理を実行中です...")

    let looping = true;
    let currentTryCount = 0;
    let currentIndex = 0;
    const maxCount = 120;
    while(looping) {
      if (currentTryCount >= 3) { // 文字数が多すぎるときループが終わらないのを防ぐ
        break;
      }

      const rawTexts: string[] = await retrieveTextInjection(tab, currentIndex, maxCount); // through chrome.scripting
      if(rawTexts.length === 0) {
        isProcessing = false;
        looping = false;
        if (currentTryCount == 0) {
          // 最初のトライで失敗したときはエラーを出す
          toastError(tab, "テキスト取得に失敗しました")
          return;
        } else {
          // この場合、単にWebページ全体の走査を完了したとき
          break;
        }
      }

      const textDelimiter: string = getTextDelimiter();
      const prompt: string = getPrompt(rawTexts.join(textDelimiter));
      const convertedText: string = await callLlm(prompt);
      if(convertedText == "") {
        toastError(tab, "テキスト変換に失敗しました")
        isProcessing = false;
        looping = false;
        return;
      }
  
      const isSucceeded: boolean = await replaceTextInjection(tab, convertedText, textDelimiter, currentIndex); // through chrome.scripting
      if(!isSucceeded) {
        toastError(tab, "テキスト置き換え処理に失敗しました")
        isProcessing = false;
        looping = false;
        return;
      }

      currentIndex += rawTexts.length;
      currentTryCount++;

      console.log("index: ", currentIndex)
      console.log("try:", currentTryCount)
    }

    toastInfo(tab, "テキスト変換処理は正常に実行されました")

    const isInserting = true;
    await insertCssInjection(tab, isInserting); // through chrome.scripting

  } else if (nextState === 'OFF') {
    const isSucceeded = await restoreOriginalTextsInjection(tab); // through chrome.scripting
    if(!isSucceeded) {
      toastError(tab, "テキスト復元処理に失敗しました")
      isProcessing = false;
      return;
    }

    const isInserting = false;
    await insertCssInjection(tab, isInserting); // through chrome.scripting
  }

  // isProcessingがtrueのままだったら正常に終了している
  if (isProcessing) {
    isProcessing = false;
    chrome.action.setBadgeText({
      text: nextState
    });
  }
});
