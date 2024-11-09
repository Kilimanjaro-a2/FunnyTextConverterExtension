const submit = document.getElementById('submit');
if(submit != null) {
  submit.addEventListener('click', async () => {
    const element = document.getElementById('claudeApiKey') as HTMLInputElement
    const claudeApiKey = element.value;
    
    if (claudeApiKey.trim() === '') {
        alert('register your claude api key');
        return;
    }
  
    await chrome.storage.sync.set({ claudeApiKey: claudeApiKey });
    
    chrome.action.setBadgeText({
        text: 'OFF'
    });
  
    window.close();
  });
}

