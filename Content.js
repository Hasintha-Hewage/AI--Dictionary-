(function() {
  let selectedText = '';
  let currentPopup = null;
  let selectionStart = { x: 0, y: 0 };
  let lastMousePos = { x: 0, y: 0 };

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

  // Extract word at a specific position (x, y)
  function getWordAtPosition(x, y) {
    const element = document.elementFromPoint(x, y);
    if (!element || element.nodeType === Node.ELEMENT_NODE) {
      // Try to get from text nodes
      const range = document.caretRangeFromPoint(x, y);
      if (!range || !range.startContainer) return null;

      const node = range.startContainer;
      if (node.nodeType !== Node.TEXT_NODE) return null;

      const text = node.textContent;
      const offset = range.startOffset;

      if (!text || offset < 0 || offset > text.length) return null;

      // Find word boundaries
      let start = offset;
      let end = offset;

      // Move start backwards to find word start
      while (start > 0 && /\w/.test(text[start - 1])) {
        start--;
      }

      // Move end forwards to find word end
      while (end < text.length && /\w/.test(text[end])) {
        end++;
      }

      const word = text.slice(start, end).trim();
      return word.length > 0 ? word : null;
    }
    return null;
  }

  // Track mouse movement to get cursor position
  document.addEventListener('mousemove', function(event) {
    lastMousePos = { x: event.clientX, y: event.clientY };
  });

  document.addEventListener('mouseup', function(event) {
    const selection = window.getSelection().toString().trim();
    if (selection.length > 0) {
      selectedText = selection;
      selectionStart = { x: event.clientX, y: event.clientY };
      
      // Auto-show popup for selected text (sentence mode)
      checkExtensionEnabled().then(enabled => {
        if (!enabled) return;
        
        showDefinition(selectedText, selectionStart);
      });
    }
  });

  // Handle click events for word mode and popup toggle
  document.addEventListener('click', function(event) {
    checkExtensionEnabled().then(enabled => {
      if (!enabled) return;

      // If popup exists and click is outside it, hide the popup (toggle off)
      if (currentPopup && currentPopup.parentElement) {
        const popupRect = currentPopup.getBoundingClientRect();
        const clickX = event.clientX;
        const clickY = event.clientY;

        // Check if click is outside popup bounds
        if (clickX < popupRect.left || clickX > popupRect.right || 
            clickY < popupRect.top || clickY > popupRect.bottom) {
          closePopup();
          selectedText = '';
          return;
        }
      }

      // If popup is already visible, don't trigger new definition
      if (currentPopup && currentPopup.parentElement) {
        return;
      }

      // Get selected text (sentence mode)
      const selection = window.getSelection().toString().trim();
      if (selection.length > 0) {
        selectedText = selection;
        selectionStart = { x: event.clientX, y: event.clientY };
        showDefinition(selectedText, selectionStart);
        return;
      }

      // No selection, try word mode (extract word at click position)
      const wordAtClick = getWordAtPosition(event.clientX, event.clientY);
      if (wordAtClick) {
        const clickPos = { x: event.clientX, y: event.clientY };
        showDefinition(wordAtClick, clickPos);
      }
    });
  });

  // Function to show definition popup
  function showDefinition(text, pos) {
    createLoadingPopup(pos.x + 10, pos.y + 20);

    chrome.runtime.sendMessage(
      { action: 'getDefinition', text: text },
      function(response) {
        if (response && response.meaning) {
          createDefinitionPopup(text, response.meaning, pos.x + 10, pos.y + 20);
        } else if (response && response.error) {
          createDefinitionPopup(text, '❌ Error: ' + response.error, pos.x + 10, pos.y + 20);
        } else {
          createDefinitionPopup(text, '❌ No response received', pos.x + 10, pos.y + 20);
        }
      }
    );
  }

  // Close popup with ESC key
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && currentPopup) {
      closePopup();
      selectedText = '';
    }
  });
})();
