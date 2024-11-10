

export async function getRawTextsFromViewingTab(tab: chrome.tabs.Tab): Promise<string[]> {
  if (tab.id === undefined) {
    return [];
  }

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
    return [];
  }

  return rawTexts;
}

export async function replaceText(
  tab: chrome.tabs.Tab,
  convertedText:string,
  textDelimiter: string
): Promise<string[]>  {
  if (tab.id === undefined) {
    return [];
  }

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    args: [convertedText, textDelimiter],
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

        return convertedTexts;
        
      } catch (error) {
        console.error('テキスト処理中にエラーが発生しました:', error);
        return []
      }
    }
  });

  return [];
}