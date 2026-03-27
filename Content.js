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
    popup.style.position = 'fixed';
    popup.style.top = y + 'px';
    popup.style.left = x + 'px';
    popup.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    popup.style.color = 'white';
    popup.style.padding = '20px';
    popup.style.borderRadius = '8px';
    popup.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
    popup.style.fontFamily = 'Arial, sans-serif';
    popup.style.maxWidth = '300px';
    popup.style.zIndex = '10000';
    popup.style.fontSize = '14px';
    popup.style.textAlign = 'center';

    popup.innerHTML = `
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
    `;

    document.body.appendChild(popup);
    currentPopup = popup;
  }

  function createDefinitionPopup(text, meaning, x, y) {
    if (currentPopup) {
      currentPopup.remove();
    }

    // Create popup element
    const popupElement = document.createElement('div');
    popupElement.id = 'ai-dict-popup';
    popupElement.style.position = 'fixed';
    popupElement.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    popupElement.style.color = 'white';
    popupElement.style.padding = '20px';
    popupElement.style.borderRadius = '12px';
    popupElement.style.boxShadow = '0 15px 40px rgba(0,0,0,0.4)';
    popupElement.style.fontFamily = 'Arial, sans-serif';
    popupElement.style.maxWidth = '400px';
    popupElement.style.width = 'auto';
    popupElement.style.zIndex = '10000';
    popupElement.style.fontSize = '14px';
    popupElement.style.lineHeight = '1.6';
    popupElement.style.maxHeight = '60vh';
    popupElement.style.overflowY = 'auto';
    popupElement.style.wordWrap = 'break-word';
    popupElement.style.cursor = 'move';
    popupElement.style.left = x + 'px';
    popupElement.style.top = y + 'px';

    // Create content
    popupElement.innerHTML = `
      <strong style="font-size: 16px; display: block; margin-bottom: 12px; word-break: break-word; color: #fff;">« ${text} »</strong>
      <div style="margin-bottom: 12px; color: rgba(255,255,255,0.95);">${meaning}</div>
      <small style="display: block; opacity: 0.8; color: rgba(255,255,255,0.8);">Drag to move • ESC to close • Q to search again</small>
    `;

    document.body.appendChild(popupElement);
    currentPopup = popupElement;

    // Smart positioning to keep popup in viewport
    function adjustPosition() {
      if (!popupElement.parentElement) return; // Check if still in DOM
      
      const rect = popupElement.getBoundingClientRect();
      let newX = x;
      let newY = y;

      // Get viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const popupWidth = rect.width;
      const popupHeight = rect.height;

      // Adjust X position if off-screen
      if (newX + popupWidth + 20 > viewportWidth) {
        newX = viewportWidth - popupWidth - 20;
      }
      if (newX < 10) {
        newX = 10;
      }

      // Adjust Y position if off-screen
      if (newY + popupHeight + 20 > viewportHeight) {
        newY = viewportHeight - popupHeight - 20;
      }
      if (newY < 10) {
        newY = 10;
      }

      popupElement.style.left = newX + 'px';
      popupElement.style.top = newY + 'px';
    }

    // Set initial position
    setTimeout(adjustPosition, 0);

    // Make popup draggable
    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    const handleMouseDown = function(e) {
      if (!popupElement.parentElement) return;
      isDragging = true;
      const rect = popupElement.getBoundingClientRect();
      dragOffsetX = e.clientX - rect.left;
      dragOffsetY = e.clientY - rect.top;
      popupElement.style.cursor = 'grabbing';
    };

    const handleMouseMove = function(e) {
      if (!isDragging || !popupElement.parentElement) return;
      
      let newX = e.clientX - dragOffsetX;
      let newY = e.clientY - dragOffsetY;

      // Keep popup in viewport bounds while dragging
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const rect = popupElement.getBoundingClientRect();

      if (newX < 10) newX = 10;
      if (newX + rect.width + 10 > viewportWidth) newX = viewportWidth - rect.width - 10;
      if (newY < 10) newY = 10;
      if (newY + rect.height + 10 > viewportHeight) newY = viewportHeight - rect.height - 10;

      popupElement.style.left = newX + 'px';
      popupElement.style.top = newY + 'px';
    };

    const handleMouseUp = function() {
      if (!popupElement.parentElement) return;
      isDragging = false;
      popupElement.style.cursor = 'move';
    };

    popupElement.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Auto-close after 15 seconds with cleanup
    const autoCloseTimer = setTimeout(() => {
      if (popupElement.parentElement) {
        closePopup();
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }, 15000);
  }

  function closePopup() {
    if (currentPopup && currentPopup.parentElement) {
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
