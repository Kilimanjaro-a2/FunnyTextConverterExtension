

export async function retrieveTextInjection(tab: chrome.tabs.Tab): Promise<string[]> {
  if (tab == undefined || tab.id == undefined) {
    console.error("渡されたtabが不正")
    return [];
  }

  const result = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: async () => {
      // 関数に抜き出したいが、chrome.scripting.executeScript内にはシリアライズされたオブジェクトしか渡せないため直書きする
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
    return [];
  }

  return rawTexts;
}

export async function replaceTextInjection(
  tab: chrome.tabs.Tab,
  convertedText:string,
  textDelimiter: string
): Promise<boolean>  {
  if (tab == undefined || tab.id == undefined) {
    console.error("渡されたtabが不正")
    return false;
  }

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    args: [convertedText, textDelimiter],
    func: async (convertedText, splitStrings) => {
      try {
        // 関数に抜き出したいが、chrome.scripting.executeScript内にはシリアライズされたオブジェクトしか渡せないため直書きする
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

        return true;
        
      } catch (error) {
        console.error('テキスト処理中にエラーが発生しました:', error);
        return false
      }
    }
  });

  return true;
}

export async function restoreOriginalTextsInjection(tab: chrome.tabs.Tab): Promise<boolean> {
  if (tab == undefined || tab.id == undefined) {
    console.error("渡されたtabが不正")
    return false;
  }

  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      try {
        if (window.originalNodes && window.originalTexts) {
          window.originalNodes.forEach((node: Text, index: number) => {
            node.textContent = window.originalTexts[index];
          });
        }
        return true;
      } catch (error) {
        console.error('テキスト復元処理中にエラーが発生しました:', error);
        return false;
      }
    }
  });
  
  return results[0].result === true;
}