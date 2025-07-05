// =================================================================================
// 深堀くん v2.0 - 音声システム Phase 1: 基本音声管理
// =================================================================================

console.log('🎤 音声システム Phase 1 読み込み開始...');

// =================================================================================
// PERMISSION MANAGER - マイク許可管理
// =================================================================================

// 🔧 PermissionManager: マイク許可の一元管理
class PermissionManager {
    constructor() {
        this.state = 'unknown'; // unknown, granted, denied, requesting
        this.listeners = new Set();
        this.requestQueue = [];
        this.isRequesting = false;
        this.lastRequestTime = 0;
        this.minRequestInterval = 5000; // 5秒間隔制限
    }
    
    // 許可状態の取得（非同期）
    async getPermission() {
        console.log('🔍 許可状態確認:', this.state);
        
        if (this.state === 'granted') {
            console.log('✅ 許可済み - 即座に返却');
            return true;
        }
        
        if (this.state === 'denied') {
            console.log('🚫 拒否済み - 即座に返却');
            return false;
        }
        
        // 時間間隔チェック
        const now = Date.now();
        if (now - this.lastRequestTime < this.minRequestInterval) {
            console.log('⏰ 要求間隔不足 - 待機');
            return new Promise((resolve) => {
                this.requestQueue.push(resolve);
            });
        }
        
        return this.requestPermission();
    }
    
    // 許可要求（重複防止・一回だけルール）
    async requestPermission() {
        if (this.isRequesting) {
            console.log('🔄 要求進行中 - キューに追加');
            return new Promise((resolve) => {
                this.requestQueue.push(resolve);
            });
        }
        
        console.log('🎤 マイク許可要求開始（一回だけルール）');
        this.isRequesting = true;
        this.state = 'requesting';
        this.lastRequestTime = Date.now();
        
        try {
            // ブラウザレベルでの許可状態確認
            const permissionStatus = await navigator.permissions.query({ name: 'microphone' }).catch(() => null);
            
            if (permissionStatus && permissionStatus.state === 'granted') {
                console.log('✅ ブラウザレベルで許可済み');
                this.state = 'granted';
                this.notifyListeners();
                this.processQueue(true);
                return true;
            }
            
            // 一回だけの許可取得
            console.log('🔄 getUserMediaによる許可取得');
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } 
            });
            
            // ストリームを即座に停止（許可のみが目的）
            stream.getTracks().forEach(track => track.stop());
            
            console.log('✅ マイク許可取得成功');
            this.state = 'granted';
            this.notifyListeners();
            this.processQueue(true);
            return true;
            
        } catch (error) {
            console.error('❌ マイク許可取得失敗:', error);
            this.state = 'denied';
            this.notifyListeners();
            this.processQueue(false);
            return false;
        } finally {
            this.isRequesting = false;
        }
    }
    
    // キュー処理
    processQueue(result) {
        while (this.requestQueue.length > 0) {
            const resolve = this.requestQueue.shift();
            resolve(result);
        }
    }
    
    // リスナー登録
    addListener(callback) {
        this.listeners.add(callback);
    }
    
    // リスナー削除
    removeListener(callback) {
        this.listeners.delete(callback);
    }
    
    // 状態通知
    notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                callback(this.state);
            } catch (error) {
                console.error('リスナー実行エラー:', error);
            }
        });
    }
    
    // 状態リセット（テスト用）
    reset() {
        this.state = 'unknown';
        this.isRequesting = false;
        this.requestQueue = [];
        this.notifyListeners();
    }
}

// =================================================================================
// AUDIO MANAGER - 音声再生管理
// =================================================================================

// 🔧 AudioManager: 音声再生の一元管理
class AudioManager {
    constructor() {
        this.activeAudioSources = new Set();
        this.listeners = new Set();
    }
    
    // 音声登録
    registerAudio(audioElement, source, speaker) {
        const audioData = {
            audio: audioElement,
            source: source,
            speaker: speaker,
            startTime: Date.now(),
            id: `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        
        this.activeAudioSources.add(audioData);
        console.log(`🎵 音声登録: ${speaker} (ID: ${audioData.id})`);
        
        // 音声終了時の自動削除
        audioElement.addEventListener('ended', () => {
            this.unregisterAudio(audioData);
        });
        
        audioElement.addEventListener('error', () => {
            this.unregisterAudio(audioData);
        });
        
        this.notifyListeners();
        return audioData.id;
    }
    
    // 音声登録解除
    unregisterAudio(audioData) {
        this.activeAudioSources.delete(audioData);
        console.log(`🔇 音声登録解除: ${audioData.speaker} (ID: ${audioData.id})`);
        this.notifyListeners();
    }
    
    // 全音声強制停止
    forceStopAllAudio(reason = 'user_request') {
        console.log(`🛑 全音声強制停止開始: ${reason} (対象: ${this.activeAudioSources.size}件)`);
        
        let stoppedCount = 0;
        this.activeAudioSources.forEach(audioData => {
            try {
                audioData.audio.pause();
                audioData.audio.currentTime = 0;
                stoppedCount++;
            } catch (error) {
                console.error('音声停止エラー:', error);
            }
        });
        
        this.activeAudioSources.clear();
        this.notifyListeners();
        
        console.log(`✅ 全音声停止完了: ${stoppedCount}件`);
        return stoppedCount;
    }
    
    // 特定スピーカーの音声停止
    stopSpeakerAudio(speaker, reason = 'speaker_control') {
        console.log(`🛑 ${speaker}の音声停止: ${reason}`);
        
        let stoppedCount = 0;
        this.activeAudioSources.forEach(audioData => {
            if (audioData.speaker === speaker) {
                try {
                    audioData.audio.pause();
                    audioData.audio.currentTime = 0;
                    stoppedCount++;
                } catch (error) {
                    console.error('音声停止エラー:', error);
                }
            }
        });
        
        // 停止した音声を登録解除
        this.activeAudioSources.forEach(audioData => {
            if (audioData.speaker === speaker) {
                this.unregisterAudio(audioData);
            }
        });
        
        console.log(`✅ ${speaker}音声停止完了: ${stoppedCount}件`);
        return stoppedCount;
    }
    
    // アクティブ音声情報取得
    getActiveAudioInfo() {
        return Array.from(this.activeAudioSources).map(audioData => ({
            speaker: audioData.speaker,
            source: audioData.source,
            id: audioData.id,
            duration: Date.now() - audioData.startTime
        }));
    }
    
    // リスナー登録
    addListener(callback) {
        this.listeners.add(callback);
    }
    
    // リスナー削除
    removeListener(callback) {
        this.listeners.delete(callback);
    }
    
    // 状態通知
    notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                callback(this.getActiveAudioInfo());
            } catch (error) {
                console.error('リスナー実行エラー:', error);
            }
        });
    }
}

// =================================================================================
// VOICE CORE SYSTEM - 音声コアシステム
// =================================================================================

const VoiceCore = {
    // コンポーネント
    permission: null,
    audio: null,
    
    // 初期化
    init() {
        console.log('🚀 音声コアシステム初期化開始');
        
        try {
            this.permission = new PermissionManager();
            this.audio = new AudioManager();
            
            console.log('✅ 音声コアシステム初期化完了');
            return true;
        } catch (error) {
            console.error('❌ 音声コアシステム初期化エラー:', error);
            return false;
        }
    },
    
    // 状態取得
    getState() {
        return {
            permission: this.permission?.state || 'unknown',
            activeAudio: this.audio?.getActiveAudioInfo() || []
        };
    }
};

// =================================================================================
// WINDOW EXPORTS - グローバル公開
// =================================================================================

// クラスの公開
window.PermissionManager = PermissionManager;
window.AudioManager = AudioManager;

// 統合オブジェクトの公開
window.VoiceCore = VoiceCore;

// 初期化
VoiceCore.init();

console.log('✅ 音声システム Phase 1 読み込み完了');
console.log('📦 VoiceCore: PermissionManager、AudioManager、VoiceCoreオブジェクトを公開'); 