/**
 * 
 * chrome.scripting.executeScriptを実行する処理群
 * 
 */

/**
 * 開いているタブから、人間が読むためのテキストを捜査して取得する
 * 
 * @param tab 
 * @returns 
 */
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

/**
 * 開いているページのテキスト群を、変換したテキストで置き換える
 * 
 * @param tab 
 * @returns 
 */
export async function replaceTextInjection(
  tab: chrome.tabs.Tab,
  convertedText: string,
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

/**
 * 開いているページのテキスト群を、変換前のテキストに復元する
 * 
 * @param tab 
 * @returns 
 */
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

/**
 * クソデカCSSをインジェクションする
 * 
 * @param tab 
 * @param isInserting 
 * @returns 
 */
export async function insertCssInjection(tab: chrome.tabs.Tab, isInserting: boolean): Promise<boolean> {
  if (tab == undefined || tab.id == undefined) {
    console.error("渡されたtabが不正")
    return false;
  }

  if (isInserting) {
    await chrome.scripting.insertCSS({
      files: ['kusodeka.css'],
      target: { tabId: tab.id }
    });
  } else {
    await chrome.scripting.removeCSS({
      files: ['kusodeka.css'],
      target: { tabId: tab.id }
    });
  }
  return true;
}


/**
 * Infoトーストを出現させる
 * 
 * @param tab 
 * @returns 
 */
export async function toastInfo(tab: chrome.tabs.Tab, message: string, showsConsoleLog: boolean = true): Promise<void> {
  if (tab.id === undefined) {
    console.error("渡されたtabが不正")
    return;
  }
  try {
    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      css: `
        .extension-alert-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          display: flex;
          justify-content: center;
          z-index: 9999;
          padding: 8px;
        }

        .extension-alert {
          position: relative;
          width: 500px;
          background-color: #ADD8E6;
          color: blue;
          padding: 12px 40px 12px 12px;
          text-align: center;
          border-radius: 4px;
          border: 1px solid blue;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .extension-alert-close {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          border: none;
          background: none;
          cursor: pointer;
          padding: 5px;
          font-size: 16px;
          color: #721c24;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
        }

        .extension-alert-close:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }
      `
    });

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      args: [message],
      func: (message) => {
        // 既存のアラートがあれば削除
        const existingAlert = document.querySelector('.extension-alert-container');
        if (existingAlert) {
          existingAlert.remove();
        }

        // コンテナを作成
        const container = document.createElement('div');
        container.className = 'extension-alert-container';

        // アラートを作成
        const alertDiv = document.createElement('div');
        alertDiv.className = 'extension-alert';
        alertDiv.textContent = message;
        
        // 閉じるボタンを追加
        const closeButton = document.createElement('button');
        closeButton.className = 'extension-alert-close';
        closeButton.innerHTML = '✕';
        closeButton.onclick = () => container.remove();
        
        alertDiv.appendChild(closeButton);
        container.appendChild(alertDiv);
        document.body.insertBefore(container, document.body.firstChild);
      }
    });

    if(showsConsoleLog) {
      console.log(message);
    }
  } catch (err) {
    console.error('Failed to execute:', err);
  }
}

/**
 * Errorトーストを出現させる
 * 
 * @param tab 
 * @returns 
 */
export async function toastError(tab: chrome.tabs.Tab, message: string, showsConsoleError: boolean = true): Promise<void> {
  if (tab.id === undefined) {
    console.error("渡されたtabが不正")
    return;
  }
  try {
    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      css: `
        .extension-alert-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          display: flex;
          justify-content: center;
          z-index: 9999;
          padding: 8px;
        }

        .extension-alert {
          position: relative;
          width: 500px;
          background-color: #f8d7da;
          color: #721c24;
          padding: 12px 40px 12px 12px;
          text-align: center;
          border-radius: 4px;
          border: 1px solid #f5c6cb;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .extension-alert-close {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          border: none;
          background: none;
          cursor: pointer;
          padding: 5px;
          font-size: 16px;
          color: #721c24;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
        }

        .extension-alert-close:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }
      `
    });

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      args: [message],
      func: (message) => {
        // 既存のアラートがあれば削除
        const existingAlert = document.querySelector('.extension-alert-container');
        if (existingAlert) {
          existingAlert.remove();
        }

        // コンテナを作成
        const container = document.createElement('div');
        container.className = 'extension-alert-container';

        // アラートを作成
        const alertDiv = document.createElement('div');
        alertDiv.className = 'extension-alert';
        alertDiv.textContent = message;
        
        // 閉じるボタンを追加
        const closeButton = document.createElement('button');
        closeButton.className = 'extension-alert-close';
        closeButton.innerHTML = '✕';
        closeButton.onclick = () => container.remove();
        
        alertDiv.appendChild(closeButton);
        container.appendChild(alertDiv);
        document.body.insertBefore(container, document.body.firstChild);
      }
    });

    if(showsConsoleError) {
      console.error(message);
    }
  } catch (err) {
    console.error('Failed to execute:', err);
  }
}

