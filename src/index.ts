// グローバル変数として保存用のMapを定義
const originalTextMap = new Map<number, { nodes: Text[], texts: string[] }>();

chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id === undefined) return;

  const result = await chrome.storage.sync.get(['username']);
  if (!result.username) {
    chrome.tabs.create({
      url: 'register.html'
    });
    return;
  }

  const prevState = await chrome.action.getBadgeText({ tabId: tab.id });
  const nextState = prevState === 'デカ' ? 'OFF' : 'デカ';

  if (nextState === 'デカ') {
    await chrome.scripting.insertCSS({
      files: ['kusodeka.css'],
      target: { tabId: tab.id }
    });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: async () => {
          const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null
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
        
          try {
            const processTexts = () => {
              let processedTexts: string[] = [];
              texts.forEach(text => {
                processedTexts.push(`${text}@@@@@@@`);
              });
              return processedTexts;
            }
            const processedTexts: string[] = await processTexts()
            if (processTexts != null) {
              processedTexts.forEach((newText: string, index: number) => {
                const currentText = textNodes[index].textContent;
                if (currentText && newText !== currentText) {
                  textNodes[index].textContent = newText;
                }
              });
            }
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
