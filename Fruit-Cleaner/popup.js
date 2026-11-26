var toggle = document.getElementById('toggle');
var statusLabel = document.getElementById('statusLabel');
var hint = document.getElementById('hint');

var TEXT_ON = '\u0412\u043a\u043b\u044e\u0447\u0451\u043d';          // "Включён"
var TEXT_OFF = '\u0412\u044b\u043a\u043b\u044e\u0447\u0435\u043d';  // "Выключен"
var TEXT_HINT = '\u043d\u0430\u0445\u0443\u044f?';                  // "нахуя?"

function updateUI(enabled) {
    statusLabel.textContent = enabled ? TEXT_ON : TEXT_OFF;
    hint.textContent = enabled ? '' : TEXT_HINT;
}

chrome.storage.sync.get({ enabled: true }, function (data) {
    toggle.checked = data.enabled;
    updateUI(data.enabled);
});

toggle.addEventListener('change', function () {
    var enabled = toggle.checked;
    chrome.storage.sync.set({ enabled: enabled });
    updateUI(enabled);
});