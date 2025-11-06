// Plugin initialization
window.Asc.plugin.init = function () {
  console.log('[Template Helper] Plugin initialized successfully!');
  console.log('[Template Helper] Plugin GUID:', window.Asc.plugin.guid);
};

// Insert token at cursor position
window.insertToken = function(tokenKey) {
  console.log('[Template Helper] Inserting token:', tokenKey);
  const tokenText = `{{${tokenKey}}}`;

  window.Asc.plugin.callCommand(function () {
    var oDocument = Api.GetDocument();
    var oParagraph = oDocument.GetCurrentParagraph();

    // Add text at current position
    oParagraph.AddText(tokenText);
  }, true);
};

// Wrap selected text with skill zone markers
window.wrapInSkillZone = function() {
  console.log('[Template Helper] Wrapping selection in skill zone...');

  window.Asc.plugin.callCommand(function () {
    var oDocument = Api.GetDocument();
    var oRange = oDocument.GetRangeBySelect();

    if (oRange) {
      // Get the selected text
      var selectedText = oRange.GetText();
      console.log('[Template Helper] Selected text:', selectedText);

      // Delete the current selection
      oRange.Delete();

      // Create new content with markers
      var startMarker = Api.CreateParagraph();
      startMarker.AddText('<<SKILLS_START>>');

      var content = Api.CreateParagraph();
      content.AddText(selectedText);

      var endMarker = Api.CreateParagraph();
      endMarker.AddText('<<SKILLS_END>>');

      // Insert the wrapped content
      oDocument.InsertContent([startMarker, content, endMarker]);

      console.log('[Template Helper] Skill zone created!');
    } else {
      console.log('[Template Helper] No text selected');
      alert('Please select some text first');
    }
  }, true);
};

// Button click handler
window.Asc.plugin.button = function (id) {
  if (id === 0) {
    // Primary button clicked - close the plugin
    this.executeCommand('close', '');
  }
};
