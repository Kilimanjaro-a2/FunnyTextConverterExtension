const submit = document.getElementById('submit');
if(submit != null) {
  submit.addEventListener('click', async () => {
    const element = document.getElementById('apikey') as HTMLInputElement
    const apikey = element.value;
    
    if (apikey.trim() === '') {
        alert('register your claude api key');
        return;
    }
  
    await chrome.storage.sync.set({ apikey: apikey });
    
    chrome.action.setBadgeText({
        text: 'OFF'
    });
  
    window.close();
  });
}

