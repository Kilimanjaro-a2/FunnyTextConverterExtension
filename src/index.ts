// グローバル変数として保存用のMapを定義
const originalTextMap = new Map<number, { nodes: Text[], texts: string[] }>();

chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id === undefined) return;

  const result = await chrome.storage.sync.get(['apikey']);
  if (!result.apikey) {
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

    const result = await chrome.scripting.executeScript({
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

          return texts;
      }
    });

    const rawTexts = result[0].result;
    if (rawTexts == null) {
      return;
    }

    const { apikey } = await chrome.storage.sync.get(['apikey']);
    const combinedText = rawTexts.join('\n---SPLIT---\n');
const prompt = `    
以下の文章を大阪弁にしてください。各文章は"---SPLIT---"で区切られています。
変換後も同じ区切り文字を使用して返してください。
元の文章の意味を保ったまま、各文章に対応するような自然な大阪弁にしてください。

${combinedText}`;


    console.log("prompt")
    console.log(prompt)
    const convertedText: string = await callClaudeAPI(prompt, apikey)

    console.log("result")
    console.log(convertedText)
      
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      args: [convertedText],
      func: async (convertedText) => {
        try {
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

          // const processedTexts: string[] = []
          // texts.forEach(text => {
          //   processedTexts.push(`${text}@@@@@@@`);
          // });
          const convertedTexts = convertedText.split('\n---SPLIT---\n')
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

const API_URL = 'https://api.anthropic.com/v1/messages';
async function callClaudeAPI(prompt: string, apiKey: string) {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
    })
    .then((response) => response.json())
    .then((data) => {
      console.log("Success")
      const haiku = data.content[0].text;
      return haiku;
    })
    .catch((error) => {
      console.error("Error:", error);
    });
    console.log(response)
    return response
  } catch (error) {
    console.error('Error calling Claude API:', error);
    throw error;
  }
}