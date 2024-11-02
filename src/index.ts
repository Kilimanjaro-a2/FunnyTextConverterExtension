chrome.runtime.onInstalled.addListener(async () => {
  const result = await chrome.storage.sync.get(['username']);
  
  if (!result.username) {
    chrome.tabs.create({
      url: 'register.html'
    });
  } else {
    chrome.action.setBadgeText({
      text: 'OFF'
    });
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id === undefined) return;

  const result = await chrome.storage.sync.get(['username']);
  if (!result.username) {
    chrome.tabs.create({
      url: 'register.html'
    });
    return;
  }
  // const username = result.username;

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
        
          try {
            // const processedTexts = await processTexts(texts);
        
            const processTexts = () => {
              try {
                // const response = await fetch('https://your-api-endpoint', {
                //   method: 'POST',
                //   headers: {
                //     'Content-Type': 'application/json',
                //   },
                //   body: JSON.stringify({ texts })
                // });
            
                // if (!response.ok) {
                //   throw new Error('API request failed');
                // }
            
                // const result: ProcessedResult = await response.json();
                // return result.processedTexts;
                let processedTexts: string[] = [];
                texts.forEach(_ => {
                  processedTexts.push(`aaaaa`);
                });
                return processedTexts;
            
              } catch (error) {
                console.error('API呼び出し中にエラーが発生しました:', error);
                return ["AAA"];
              }
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
  }
  chrome.action.setBadgeText({
    text: nextState
  });
});

interface ProcessedResult {
  processedTexts: string[];
}