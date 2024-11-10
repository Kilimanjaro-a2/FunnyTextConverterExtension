import { getPrompt, getTextDelimiter } from "./prompt";
import { callClaudeAPI, isApiKeyRequired } from "./requester";
import { getRawTextsFromViewingTab, replaceText } from "./injection";

chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id === undefined) {
    return;
  }

  const isApiKeyEmpty = await isApiKeyRequired();
  if (isApiKeyEmpty) {
    // APIキーが設定されていない場合（初回起動時など）は、APIを登録するページを別タブで表示する
    chrome.tabs.create({ url: 'register.html' });
    return;
  }

  const prevState = await chrome.action.getBadgeText({ tabId: tab.id });
  const nextState = prevState === 'デカ' ? 'OFF' : 'デカ';

  if (nextState === 'デカ') {
    await chrome.scripting.insertCSS({
      files: ['kusodeka.css'],
      target: { tabId: tab.id }
    });

    const rawTexts: string[] = await getRawTextsFromViewingTab(tab);
    const textDelimiter = getTextDelimiter();
    const prompt = getPrompt(rawTexts.join(textDelimiter));
    const convertedText: string = await callClaudeAPI(prompt);
    console.log(`Result: ${convertedText}`);

    await replaceText(tab, convertedText, textDelimiter);

  } else if (nextState === 'OFF') {
    await chrome.scripting.removeCSS({
      files: ['kusodeka.css'],
      target: { tabId: tab.id }
    });
    // 元のテキストに戻す
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        if (window.originalNodes && window.originalTexts) {
          window.originalNodes.forEach((node: Text, index: number) => {
            node.textContent = window.originalTexts[index];
          });
        }
      }
    });
  }
  chrome.action.setBadgeText({
    text: nextState
  });
});
