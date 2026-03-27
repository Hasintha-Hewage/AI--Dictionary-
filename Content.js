(function() {
  let selectedText = '';
  let currentPopup = null;
  let selectionStart = { x: 0, y: 0 };

  function createLoadingPopup(x, y) {
    if (currentPopup) {
      currentPopup.remove();
    }

    const popup = document.createElement('div');
    popup.id = 'ai-dict-popup-loading';
    popup.innerHTML = `
      <div style="
        position: fixed;
        top: ${y}px;
        left: ${x}px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        font-family: Arial, sans-serif;
        max-width: 300px;
        z-index: 10000;
        font-size: 14px;
        text-align: center;
      ">
        <div style="
          display: inline-block;
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255,255,255,0.3);
          border-top: 4px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 10px;
        "></div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
        <div><strong>Loading definition...</strong></div>
        <small style="opacity: 0.8;">Press ESC to cancel</small>
      </div>
    `;

    document.body.appendChild(popup);
    currentPopup = popup;
  }

  function createDefinitionPopup(text, meaning, x, y) {
    if (currentPopup) {
      currentPopup.remove();
    }

    const popup = document.createElement('div');
    popup.id = 'ai-dict-popup';
    popup.innerHTML = `
      <div style="
        position: fixed;
        top: ${y}px;
        left: ${x}px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        font-family: Arial, sans-serif;
        max-width: 350px;
        z-index: 10000;
        font-size: 14px;
        line-height: 1.6;
      ">
        <strong style="font-size: 16px; display: block; margin-bottom: 10px; word-break: break-word;">« ${text} »</strong>
        <div style="margin-bottom: 8px;">${meaning}</div>
        <small style="display: block; opacity: 0.8;">Press ESC to close • Press Q to search again</small>
      </div>
    `;

    document.body.appendChild(popup);
    currentPopup = popup;

    // Auto-close after 15 seconds
    setTimeout(closePopup, 15000);
  }

  function closePopup() {
    if (currentPopup) {
      currentPopup.remove();
      currentPopup = null;
    }
  }

  function checkExtensionEnabled() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['extensionEnabled'], function(data) {
        const enabled = data.extensionEnabled !== false;
        resolve(enabled);
      });
    });
  }

  document.addEventListener('mouseup', function(event) {
    const selection = window.getSelection().toString().trim();
    if (selection.length > 0) {
      selectedText = selection;
      selectionStart = { x: event.clientX, y: event.clientY };
    }
  });

  document.addEventListener('keydown', function(event) {
    // Check if Q or q key is pressed
    if ((event.key === 'q' || event.key === 'Q') && selectedText.length > 0) {
      event.preventDefault();

      checkExtensionEnabled().then(enabled => {
        if (!enabled) {
          createDefinitionPopup(selectedText, '❌ Extension is disabled. Enable it in settings.', selectionStart.x + 10, selectionStart.y + 20);
          return;
        }

        // Show loading popup
        createLoadingPopup(selectionStart.x + 10, selectionStart.y + 20);

        // Request definition from background script
        chrome.runtime.sendMessage(
          { action: 'getDefinition', text: selectedText },
          function(response) {
            if (response && response.meaning) {
              createDefinitionPopup(selectedText, response.meaning, selectionStart.x + 10, selectionStart.y + 20);
            } else if (response && response.error) {
              createDefinitionPopup(selectedText, '❌ Error: ' + response.error, selectionStart.x + 10, selectionStart.y + 20);
            } else {
              createDefinitionPopup(selectedText, '❌ No response received', selectionStart.x + 10, selectionStart.y + 20);
            }
          }
        );
      });
    }

    // Close popup with ESC key
    if (event.key === 'Escape') {
      closePopup();
      selectedText = '';
    }
  });
})();
