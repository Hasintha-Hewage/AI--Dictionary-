(function() {
  // Listen for text selection
  document.addEventListener('mouseup', function() {
    const selectedText = window.getSelection().toString().trim();
    
    if (selectedText.length > 0) {
      console.log('Selected text:', selectedText);
      // Send selected text to background script
      chrome.runtime.sendMessage(
        { action: 'getDefinition', text: selectedText },
        function(response) {
          if (response && response.meaning) {
            alert('Definition of "' + selectedText + '":\n\n' + response.meaning);
          } else if (response && response.error) {
            alert('Error: ' + response.error);
          }
        }
      );
    }
  });
})();
