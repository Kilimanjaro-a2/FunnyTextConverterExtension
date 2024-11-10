import { getPrompt, getTextDelimiter } from "./prompt";
import { callLlm, isApiKeyRequired } from "./requester";
import { retrieveTextInjection, replaceTextInjection, restoreOriginalTextsInjection, insertCssInjection } from "./injection";

chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id === undefined) {
    console.error("渡されたtabが不正")
    return;
  }

  if (await isApiKeyRequired()) {
    // APIキーが設定されていない場合（初回起動時など）は、APIを登録するページを別タブで表示する
    chrome.tabs.create({ url: 'register.html' });
    return;
  }

  const prevState = await chrome.action.getBadgeText({ tabId: tab.id });
  const nextState = prevState === 'デカ' ? 'OFF' : 'デカ';

  if (nextState === 'デカ') {
    console.log("テキスト変換処理を実行します");

    const rawTexts: string[] = await retrieveTextInjection(tab); // through chrome.scripting
    if(rawTexts.length === 0) {
      console.error("テキスト取得に失敗しました");
      return;
    }

    const textDelimiter: string = getTextDelimiter();
    const prompt: string = getPrompt(rawTexts.join(textDelimiter));
    const convertedText: string = await callLlm(prompt);
    if(convertedText == "") {
      console.error("テキスト変換に失敗しました");
      return;
    }

    const isSucceeded: boolean = await replaceTextInjection(tab, convertedText, textDelimiter); // through chrome.scripting
    if(!isSucceeded) {
      console.error("テキスト置き換え処理に失敗しました");
      return;
    }

    console.log("テキスト変換処理は正常に実行されました")

    const isInserting = true;
    await insertCssInjection(tab, isInserting); // through chrome.scripting

  } else if (nextState === 'OFF') {
    const isSucceeded = await restoreOriginalTextsInjection(tab); // through chrome.scripting
    if(!isSucceeded) {
      console.error("テキスト復元処理に失敗しました");
      return;
    }

    const isInserting = false;
    await insertCssInjection(tab, isInserting); // through chrome.scripting
  }

  chrome.action.setBadgeText({
    text: nextState
  });
});
