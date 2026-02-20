(function () {
  const chatBubble = document.getElementById('chatBubble');
  const chatWindow = document.getElementById('chatWindow');
  const chatIframe = document.getElementById('chatIframe');
  const closeChat = document.getElementById('closeChat');
  const applyBtn = document.getElementById('applyBtn');
  const embedUrlInput = document.getElementById('embedUrl');

  let isOpen = false;
  let currentUrl = '';

  function applyUrl() {
    const url = embedUrlInput.value.trim();
    if (!url) return;
    currentUrl = url;
    chatIframe.src = url;
  }

  function toggleChat() {
    isOpen = !isOpen;
    if (isOpen) {
      if (!chatIframe.src || chatIframe.src === 'about:blank') {
        applyUrl();
      }
      chatWindow.classList.remove('hidden');
    } else {
      chatWindow.classList.add('hidden');
    }
  }

  chatBubble.addEventListener('click', toggleChat);
  closeChat.addEventListener('click', toggleChat);

  applyBtn.addEventListener('click', function () {
    applyUrl();
    if (!isOpen) toggleChat();
  });

  embedUrlInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      applyUrl();
      if (!isOpen) toggleChat();
    }
  });
})();
