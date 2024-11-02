const submit = document.getElementById('submit');
if(submit != null) {
  submit.addEventListener('click', async () => {
    const element = document.getElementById('username') as HTMLInputElement
    const username = element.value;
    
    if (username.trim() === '') {
        alert('ユーザー名を入力してください');
        return;
    }
  
    await chrome.storage.sync.set({ username: username });
    
    chrome.action.setBadgeText({
        text: 'OFF'
    });
  
    window.close();
  });
}

