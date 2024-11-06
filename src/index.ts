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
あなたは「クソデカ表現変換機」です。ユーザーから与えられた文章をクソデカ変換します。クソデカ変換とは、物や現象についてクソデカい表現をつけることです。
以下はクソデカ変換の例です。

「ある日の暮方の事である。」→「ある日の超暮方(ほぼ夜)の事である。」
「一人の下人が、羅生門の下で雨やみを待っていた。」→「一人の下人が、クソデカい羅生門の完全な真下で雨やみを気持ち悪いほどずっと待ちまくっていた。」
「広い門の下には、この男のほかに誰もいない。」→「馬鹿みたいに広い門の真下には、この大男のほかに全然誰もいない。」
「ただ、所々丹塗の剥げた、大きな円柱に、蟋蟀が一匹とまっている。」→「ただ、所々丹塗のびっくりするくらい剥げた、信じられないほど大きな円柱に、象くらいある蟋蟀が一匹とまっている。」
「羅生門が、朱雀大路にある以上は、この男のほかにも、雨やみをする市女笠や揉烏帽子が、もう二三人はありそうなものである。」→「クソデカ羅生門が、大河のように広い朱雀大路にある以上は、この狂った男のほかにも、激・雨やみをする巨大市女笠や爆裂揉烏帽子が、もう二三百人はありそうなものである。」
「それが、この男のほかには誰もいない。」→「それが、この珍妙男のほかには全然誰もマジで全くいない。」
「何故かと云うと、この二三年、京都には、地震とか辻風とか火事とか饑饉とか云う災いがつづいて起こった。」→「何故かと云うと、この二三千年、京都には、超巨大地震とか破壊的辻風とか最強大火事とか極限饑饉とか云うエグすぎる災が毎日つづいて起こった。」
「そこで洛中のさびれ方は一通りではない。」→「そこでクソ広い洛中のさびれ方はマジでもう一通りとかそういうレベルではない。」
「旧記によると、仏像や仏具を打砕いて、その丹がついたり、金銀の箔がついたりした木を、路ばたにつみ重ねて、薪の料に売っていたと云う事である。」→「旧記によると、クソデカい仏像や文化財クラスの仏具をものすごいパワーで打砕いて、その丹がベッチャベチャについたり、金銀の箔がもうイヤになっちゃうくらいついたりした木を、路ばたに親の仇のようにメチャメチャつみ重ねて、薪の料に売りまくっていたと云う事である。」

    
以下の文章をクソデカ変換してください。各文章は"---SPLIT---"で区切られています。
変換後も同じ区切り文字を使用して返してください。
元の文章の意味を保ったまま、各文章に対応するような自然なクソデカ表現のみを返して下さい。

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
        model: "claude-3-5-haiku-20241022",
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