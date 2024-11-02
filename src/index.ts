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
  const result = await chrome.storage.sync.get(['username']);
  if (!result.username) {
    chrome.tabs.create({
      url: 'register.html'
    });
    return;
  }
  const username = result.username;

  // 以下、既存のコード
  if (tab == null || tab.url == null || tab.id == null) {
    return;
  }
  const prevState = await chrome.action.getBadgeText({ tabId: tab.id });
  const nextState = prevState === 'デカ' ? 'OFF' : 'デカ';


  if (nextState === 'デカ') {
    await chrome.scripting.insertCSS({
      files: ['kusodeka.css'],
      target: { tabId: tab.id }
    });
  } else if (nextState === 'OFF') {
    await chrome.scripting.removeCSS({
      files: ['kusodeka.css'],
      target: { tabId: tab.id }
    });
  }
});
