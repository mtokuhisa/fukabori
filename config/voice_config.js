// 深堀くん - カスタム音声設定
// 生成日時: 2025-06-25T15:38:26.491Z

window.CUSTOM_VOICE_CONFIG = {
  "nehori": {
    "voice": "sage",
    "speed": 1.2,
    "volume": 0.8,
    "prompt": "rrr"
  },
  "hahori": {
    "voice": "nova",
    "speed": 1.1,
    "volume": 0.8,
    "prompt": ""
  },
  "lastUpdated": "2025-06-25T15:38:26.491Z"
};

// 設定の自動適用
if (typeof window !== 'undefined' && window.VoiceSettings) {
    Object.assign(window.VoiceSettings.nehori, window.CUSTOM_VOICE_CONFIG.nehori);
    Object.assign(window.VoiceSettings.hahori, window.CUSTOM_VOICE_CONFIG.hahori);
    console.log('✅ カスタム音声設定を適用しました');
}
