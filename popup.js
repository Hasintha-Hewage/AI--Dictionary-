document.addEventListener('DOMContentLoaded', function() {
  const apiKeyInput = document.getElementById('apiKey');
  const modelSelect = document.getElementById('modelSelect');
  const saveBtn = document.getElementById('saveBtn');
  const toggleBtn = document.getElementById('toggleBtn');
  const extensionToggle = document.getElementById('extensionToggle');
  const messageDiv = document.getElementById('message');

  // Load existing API key, model, and extension status
  chrome.storage.local.get(['geminiApiKey', 'selectedModel', 'extensionEnabled'], function(data) {
    if (data.geminiApiKey) {
      apiKeyInput.value = data.geminiApiKey;
    }
    if (data.selectedModel) {
      modelSelect.value = data.selectedModel;
    } else {
      // Set default to Gemini 2.5 Flash for better free tier compatibility
      modelSelect.value = 'gemini-2.5-flash';
    }
    
    // Set extension status toggle
    const enabled = data.extensionEnabled !== false; // Default to enabled
    if (enabled) {
      extensionToggle.classList.add('active');
    } else {
      extensionToggle.classList.remove('active');
    }
  });

  // Handle extension toggle
  extensionToggle.addEventListener('click', function() {
    extensionToggle.classList.toggle('active');
    const isEnabled = extensionToggle.classList.contains('active');
    chrome.storage.local.set({ extensionEnabled: isEnabled }, function() {
      const status = isEnabled ? 'ENABLED' : 'DISABLED';
      showMessage('✓ Extension ' + status, 'success');
      setTimeout(() => {
        messageDiv.textContent = '';
      }, 2000);
    });
  });

  // Save API key and model
  saveBtn.addEventListener('click', function() {
    const apiKey = apiKeyInput.value.trim();
    const selectedModel = modelSelect.value;
    
    if (!apiKey) {
      showMessage('Please enter an API key', 'error');
      return;
    }
    
    if (apiKey.length < 20) {
      showMessage('API key seems too short. Please check and try again.', 'error');
      return;
    }
    
    // Save model selection
    chrome.storage.local.set({ selectedModel: selectedModel }, function() {
      console.log('Model saved:', selectedModel);
    });
    
    chrome.runtime.sendMessage({ action: 'setApiKey', apiKey: apiKey }, function(response) {
      if (response.success) {
        showMessage('✓ API key and model saved successfully!', 'success');
        setTimeout(() => {
          messageDiv.textContent = '';
        }, 3000);
      }
    });
  });

  // Save model selection when changed
  modelSelect.addEventListener('change', function() {
    chrome.storage.local.set({ selectedModel: modelSelect.value }, function() {
      console.log('Model changed to:', modelSelect.value);
    });
  });

  // Toggle password visibility
  toggleBtn.addEventListener('click', function() {
    if (apiKeyInput.type === 'password') {
      apiKeyInput.type = 'text';
      toggleBtn.textContent = 'Hide Key';
    } else {
      apiKeyInput.type = 'password';
      toggleBtn.textContent = 'Show Key';
    }
  });

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = 'message ' + type;
  }
});