import { getPrompt, getSplitStrings } from "./prompt";
import { callClaudeAPI } from "./requester";

chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id === undefined) {
    return;
  }

  const { claudeApiKey } = await chrome.storage.sync.get<{claudeApiKey: string}>(['claudeApiKey']);
  if (!claudeApiKey) {
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

    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: async () => {
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: function(node) {
              // 親要素をチェック
              const parent = node.parentElement;
              if (!parent) return NodeFilter.FILTER_REJECT;
        
              // 非表示要素を除外
              const style = window.getComputedStyle(parent);
              if (style.display === 'none' || style.visibility === 'hidden') {
                return NodeFilter.FILTER_REJECT;
              }
        
              // スクリプト、スタイル、コードブロックなどを除外
              const tagName = parent.tagName.toLowerCase();
              if (['script', 'style', 'code', 'pre'].includes(tagName)) {
                return NodeFilter.FILTER_REJECT;
              }
        
              // メタデータ関連の要素を除外
              if (['meta', 'link', 'noscript'].includes(tagName)) {
                return NodeFilter.FILTER_REJECT;
              }
        
              return NodeFilter.FILTER_ACCEPT;
            }
          }
        );

          const textNodes: Text[] = [];
          const texts: string[] = [];
        
          let node: Node | null;
          while ((node = walker.nextNode())) {
            if (node.nodeType === Node.TEXT_NODE) {
              const text = node.textContent?.trim();
              if (text) {
                textNodes.push(node as Text);
                texts.push(text);
              }
            }
          }

          // 元のテキストを保存
          window.originalNodes = textNodes;
          window.originalTexts = texts;

          return texts;
      }
    });

    const rawTexts = result[0].result;
    if (rawTexts == null) {
      return;
    }
    const splitStrings = getSplitStrings();
    const combinedText: string = rawTexts.join(splitStrings);
    const prompt = getPrompt(combinedText);

    console.log(`Prompt: ${prompt}`)
    const convertedText: string = await callClaudeAPI(prompt, claudeApiKey)
    console.log(`Result: ${convertedText}`)

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      args: [convertedText, splitStrings],
      func: async (convertedText, splitStrings) => {
        try {
          const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
              acceptNode: function(node) {
                // 親要素をチェック
                const parent = node.parentElement;
                if (!parent) return NodeFilter.FILTER_REJECT;
          
                // 非表示要素を除外
                const style = window.getComputedStyle(parent);
                if (style.display === 'none' || style.visibility === 'hidden') {
                  return NodeFilter.FILTER_REJECT;
                }
          
                // スクリプト、スタイル、コードブロックなどを除外
                const tagName = parent.tagName.toLowerCase();
                if (['script', 'style', 'code', 'pre'].includes(tagName)) {
                  return NodeFilter.FILTER_REJECT;
                }
          
                // メタデータ関連の要素を除外
                if (['meta', 'link', 'noscript'].includes(tagName)) {
                  return NodeFilter.FILTER_REJECT;
                }
          
                return NodeFilter.FILTER_ACCEPT;
              }
            }
          );

          const textNodes: Text[] = [];
          const texts: string[] = [];
        
          let node: Node | null;
          while ((node = walker.nextNode())) {
            if (node.nodeType === Node.TEXT_NODE) {
              const text = node.textContent?.trim();
              if (text) {
                textNodes.push(node as Text);
                texts.push(text);
              }
            }
          }

          const convertedTexts = convertedText.split(splitStrings)
          convertedTexts.forEach((newText: string, index: number) => {
            const currentText = textNodes[index].textContent;
            if (currentText && newText !== currentText) {
              textNodes[index].textContent = newText;
            }
          });
          
        } catch (error) {
          console.error('テキスト処理中にエラーが発生しました:', error);
        }
      }
    });
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
