// Listen for messages from content script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'getDefinition') {
    getDefinitionFromAPI(request.text).then(response => {
      sendResponse(response);
    }).catch(error => {
      sendResponse({ error: error.message });
    });
    return true; // Allow async sendResponse
  }
  
  if (request.action === 'setApiKey') {
    // Store API key in chrome storage
    chrome.storage.local.set({ geminiApiKey: request.apiKey }, function() {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (request.action === 'listModels') {
    listAvailableModels(request.apiKey).then(response => {
      sendResponse(response);
    }).catch(error => {
      sendResponse({ error: error.message });
    });
    return true;
  }
});

async function listAvailableModels(apiKey) {
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey);
    
    if (!response.ok) {
      throw new Error('Failed to fetch models');
    }
    
    const responseData = await response.json();
    const models = responseData.models || [];
    
    // Filter models that support generateContent
    const supportedModels = models.filter(model => {
      const methods = model.supportedGenerationMethods || [];
      return methods.includes('generateContent');
    });
    
    return { models: supportedModels };
  } catch (error) {
    throw error;
  }
}

async function getDefinitionFromAPI(text) {
  // Retrieve API key and model from storage
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['geminiApiKey', 'selectedModel'], async function(data) {
      if (!data.geminiApiKey) {
        reject(new Error('API key not set. Please configure your Google Gemini API key.'));
        return;
      }

      try {
        const apiKey = data.geminiApiKey;
        let modelName = data.selectedModel || 'gemini-2.5-flash'; // Default to newer model
        const prompt = `What is the meaning of "${text}" in simple English? Provide a brief definition (2-3 sentences).`;
        
        // List of fallback models to try if the selected one fails
        const fallbackModels = [
          'gemini-2.5-flash',
          'gemini-2.0-flash',
          'gemini-3.1-flash-lite',
          'gemini-2.5-flash-lite',
          'gemini-1.5-flash',
          'gemini-2.0-flash-lite',
          'gemini-3-flash'
        ];
        
        async function fetchWithModel(model) {
          const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + apiKey, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: prompt
                    }
                  ]
                }
              ]
            })
          });
          
          return response;
        }
        
        let response = await fetchWithModel(modelName);
        let currentModel = modelName;
        
        // If selected model fails, try fallback models
        if (!response.ok) {
          console.log('Model ' + modelName + ' failed, trying fallbacks...');
          let found = false;
          
          for (let fallbackModel of fallbackModels) {
            if (fallbackModel === modelName) continue; // Skip already tried model
            
            try {
              const fallbackResponse = await fetchWithModel(fallbackModel);
              if (fallbackResponse.ok) {
                response = fallbackResponse;
                currentModel = fallbackModel;
                console.log('Successfully using fallback model:', fallbackModel);
                found = true;
                break;
              }
            } catch (e) {
              continue;
            }
          }
          
          if (!found) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'API request failed - no models available');
          }
        }

        const responseData = await response.json();
        const meaning = responseData.candidates?.[0]?.content?.parts?.[0]?.text || 'No definition found';
        
        resolve({ meaning: meaning });
      } catch (error) {
        reject(error);
      }
    });
  });
}