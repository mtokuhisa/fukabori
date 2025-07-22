// =================================================================================
// SESSION START MANAGER - セッション開始システム
// =================================================================================

/**
 * セッション開始システム - 深堀くんv2.0
 * 
 * 責任範囲:
 * - セッション開始処理の統合管理
 * - 2ステップ認証システム（ログイン・テーマ設定）
 * - UI状態管理とフォーカス制御
 * - 知見セッション初期化
 * - ウォームアップフェーズ開始
 * 
 * 依存関係:
 * - PhaseManager (フェーズ遷移)
 * - KnowledgeState (知見管理)
 * - UIManager (UI制御)
 * - StateManager (音声認識)
 * - StorageManager (データ永続化)
 */

const SessionStartManager = {
    // =================================================================================
    // 初期化
    // =================================================================================
    
    init() {
        console.log('🚀 SessionStartManager初期化開始');
        
        // 必要な依存関係の確認
        this.validateDependencies();
        
        console.log('✅ SessionStartManager初期化完了');
    },
    
    validateDependencies() {
        const required = ['UIManager', 'StorageManager', 'PhaseManager'];
        const missing = required.filter(dep => typeof window[dep] === 'undefined');
        
        if (missing.length > 0) {
            console.warn('⚠️ SessionStartManager依存関係不足:', missing);
            console.log('📝 不足している依存関係は後で利用可能になる予定です');
            
            // 詳細診断
            required.forEach(dep => {
                const exists = typeof window[dep] !== 'undefined';
                console.log(`  ${exists ? '✅' : '❌'} window.${dep}: ${exists ? 'OK' : 'MISSING'}`);
            });
            
            return false;
        }
        
        return true;
    },
    
    getDependency(path) {
        return path.split('.').reduce((obj, key) => obj && obj[key], window);
    },
    
    // =================================================================================
    // メインセッション開始処理
    // =================================================================================
    
    async startSession() {
        console.log('💡 startSession が実行されました');
        
        // 🛡️ マイク許可の事前チェック（絶対ルール）
        const permissionDenied = localStorage.getItem('microphonePermissionDenied') === 'true';
        if (permissionDenied) {
            window.showMessage('error', 'マイクの使用許可が拒否されています。ブラウザの設定で許可し、ページを再読み込みしてください。');
            return;
        }
        
        // 🔄 新機能: 2ステップ完了確認
        const status = this.evaluate2StepStatus();
        if (!status.allComplete) {
            if (!status.loginComplete) {
                window.showMessage('error', 'ログインを完了してください');
                this.focusPasswordInput();
            } else {
                window.showMessage('error', 'テーマを入力してください');
                this.focusThemeInput();
            }
            return;
        }
        
        if (!window.AppState.apiKey) {
            window.showMessage('error', 'APIキーを設定してください');
            return;
        }

        const themeInput = window.UIManager.DOMUtils.get('themeInput');
        if (!themeInput) {
            window.showMessage('error', 'テーマ入力欄が見つかりません');
            return;
        }

        const theme = themeInput.value;
        if (!theme.trim()) {
            window.showMessage('error', 'テーマを入力してください');
            return;
        }

        // 🔧 AppState初期化を最優先で実行
        window.AppState.currentTheme = theme.trim();
        window.AppState.sessionActive = true;
        
        // フェーズ遷移はPhaseManagerに委譲
        if (window.PhaseManager) {
            await window.PhaseManager.transitionToPhase('warmup', { theme: window.AppState.currentTheme });
        } else {
            window.AppState.phase = 'warmup';
        }
        
        window.AppState.sessionStartTime = new Date();
        
        console.log('✅ セッション状態を有効化:', {
            sessionActive: window.AppState.sessionActive,
            phase: window.AppState.phase,
            currentTheme: window.AppState.currentTheme
        });

        // 🔄 知見管理システムとの連携
        await this.initializeKnowledgeSession(theme.trim());

        const setupPanel = window.UIManager.DOMUtils.get('setupPanel');
        const chatArea = window.UIManager.DOMUtils.get('chatArea');
        const transcriptPanel = window.UIManager.DOMUtils.get('transcriptPanel');
        
        if (setupPanel) {
            setupPanel.classList.add('hidden');
        }
        if (chatArea) {
            chatArea.classList.remove('hidden');
        }
        // 🎨 新デザイン要件: セッション開始時にtranscript-panelを表示
        if (transcriptPanel) {
            transcriptPanel.classList.remove('hidden');
            console.log('✅ transcript-panelを表示しました（セッション開始）');
        }

        // 🎨 新デザイン要件: 右パネル背景変化管理システムの初期化
        if (window.UIBasic && window.UIBasic.rightPanel && window.UIBasic.rightPanel.initializeBackgroundManager) {
            window.UIBasic.rightPanel.initializeBackgroundManager();
        } else if (window.initializeRightPanelBackgroundManager) {
            window.initializeRightPanelBackgroundManager();
        }
        
        // 🎨 新機能: 音声状態表示とリアルタイム音声認識の初期化
        if (window.initializeVoiceStateDisplay) {
            window.initializeVoiceStateDisplay();
        }
        
        // 🎨 新UI: メイン画面表示後にVoiceUIManagerを初期化（DOM更新待ち）
        if (typeof VoiceUIManager !== 'undefined' && window.VoiceUIManager) {
            try {
                console.log('🎨 メイン画面移行後のVoiceUIManager初期化開始');
                // DOM更新を待つ
                await new Promise(resolve => setTimeout(resolve, 100));
                const voiceUISuccess = await window.VoiceUIManager.initialize();
                if (voiceUISuccess) {
                    console.log('✅ メイン画面移行後のVoiceUIManager初期化完了');
                } else {
                    console.warn('⚠️ メイン画面移行後のVoiceUIManager初期化失敗');
                }
            } catch (error) {
                console.error('❌ メイン画面移行後のVoiceUIManager初期化エラー:', error);
            }
        }
        
        this.updateSessionStatus('ウォームアップ中', window.AppState.currentTheme);
        window.updateKnowledgeDisplay();
        
        // 🛡️ マイク初期化（AppState初期化後に実行）
        const micInitialized = await this.initializeMicrophoneRecording();
        if (!micInitialized) {
            window.showMessage('error', 'マイクの初期化に失敗しました。音声機能を使用できません。');
            return;
        }
        
        // 🎨 一時停止ボタン監視開始
        if (window.startPauseButtonMonitoring) {
            window.startPauseButtonMonitoring();
        }
        
        await this.startWarmupPhase();
    },
    
    // =================================================================================
    // ウォームアップフェーズ開始
    // =================================================================================
    
    async startWarmupPhase() {
        this.updateSessionStatus('ウォームアップ中', window.AppState.currentTheme);
        window.AppState.transcriptHistory = [];
        window.AppState.currentTranscript = '';
        window.updateTranscriptDisplay();
        
        try {
            // 🎤 新システム: セッション開始時の音声認識初期化
            if (!window.stateManager) {
                console.log('🔄 StateManagerが未初期化 - 音声システムを初期化します');
                if (typeof window.initializeVoiceSystem === 'function') {
                    const initialized = window.initializeVoiceSystem();
                    if (!initialized) {
                        console.error('❌ 音声システムの初期化に失敗しました');
                    }
                } else {
                    console.error('❌ initializeVoiceSystem関数が見つかりません');
                }
            }
            
            if (window.stateManager) {
                const started = await window.stateManager.startRecognition();
                if (started) {
                    console.log('✅ セッション開始時に音声認識を開始しました（新システム）');
                } else {
                    console.log('⚠️ セッション開始時の音声認識開始に失敗（新システム）');
                }
            } else {
                console.error('❌ StateManagerが未初期化');
            }
            
            const hahoriGreeting = `私は進行役の「はほりーの」です。本日は貴重なお時間をいただき、ありがとうございます。ねほりーのと一緒に、あなたの経験から価値ある知見を抽出させていただきます。`;
            const nehoriGreeting = `こんにちは！深掘りAI「ねほりーの」です。今日は「${window.AppState.currentTheme}」について、深く掘り下げてお話を聞かせていただきたいと思います。まず、簡単に自己紹介をお願いできますか？`;
            
            await window.addMessageToChat(window.SPEAKERS.HAHORI, hahoriGreeting);
            
            const [hahoriAudio, nehoriAudio] = await Promise.all([
                window.ttsTextToAudioBlob(hahoriGreeting, window.SPEAKERS.HAHORI),
                window.ttsTextToAudioBlob(nehoriGreeting, window.SPEAKERS.NEHORI)
            ]);
            
            await window.playPreGeneratedAudio(hahoriAudio, window.SPEAKERS.HAHORI);
            await window.addMessageToChat(window.SPEAKERS.NEHORI, nehoriGreeting);
            await window.playPreGeneratedAudio(nehoriAudio, window.SPEAKERS.NEHORI);
            
            // 🎤 新システム: 挨拶後の音声認識開始
            if (window.stateManager) {
                await window.stateManager.startRecognition();
                console.log('✅ 挨拶後の音声認識開始完了（新システム）');
            } else {
                console.warn('⚠️ StateManagerが未初期化 - 音声認識開始をスキップ');
            }
        } catch (error) {
            console.error('❌ ウォームアップ質問生成エラー:', error);
            window.showMessage('error', '質問の生成に失敗しました');
        }
    },
    
    // =================================================================================
    // 知見セッション初期化
    // =================================================================================
    
    async initializeKnowledgeSession(theme) {
        try {
            // KnowledgeStateが定義されているかチェック
            if (typeof window.KnowledgeState === 'undefined') {
                console.warn('⚠️ KnowledgeStateが未定義です');
                return;
            }
            
            if (!window.KnowledgeState.isInitialized) {
                console.warn('⚠️ 知見管理システムが初期化されていません');
                // 初期化を試行
                await window.initializeKnowledgeManagement();
                if (!window.KnowledgeState.isInitialized) {
                    console.error('❌ 知見管理システムの初期化に失敗しました');
                    return;
                }
            }
            
            console.log('📋 知見セッション初期化開始...');
            
            // 1. ユーザー名の確認（無効化 - デフォルト値を使用）
            const participant = {
                formal_name: 'ゲスト',
                role: 'ユーザー'
            };
            
            // 2. カテゴリーの選択（無効化 - デフォルト値を使用）
            const category = 'その他';
            
            // 3. セッションファイルの初期化
            const sessionMeta = {
                session_id: `session_${Date.now()}`,
                theme: theme,
                participant: participant.formal_name,
                participant_role: participant.role,
                category: category
            };
            
            // SessionControllerを使用してセッション作成
            if (window.SessionController) {
                await window.SessionController.createSessionFile(sessionMeta);
            } else {
                // フォールバック
                await window.KnowledgeFileManager.createSessionFile(sessionMeta);
            }
            
            console.log('✅ 知見セッション初期化完了');
            window.showMessage('success', `知見収集セッションを開始しました（${category}カテゴリー）`);
            
        } catch (error) {
            console.error('❌ 知見セッション初期化エラー:', error);
            window.showMessage('warning', '知見収集機能でエラーが発生しましたが、セッションは継続されます');
        }
    },
    
    // =================================================================================
    // 2ステップ認証システム
    // =================================================================================
    
    // 📊 2ステップ状態の評価
    evaluate2StepStatus() {
        const loginComplete = window.StorageManager.login.load() && window.AppState.apiKey;
        const themeComplete = window.StorageManager.theme.loadInput().trim() !== '';
        
        return {
            loginComplete,
            themeComplete,
            allComplete: loginComplete && themeComplete
        };
    },
    
    // 🔄 2ステップUI更新機能
    update2StepUI() {
        try {
            const status = this.evaluate2StepStatus();
            
            // Step 1: ログイン状態の更新
            const step1Checkbox = window.UIManager.DOMUtils.get('step1Checkbox');
            const step1Status = window.UIManager.DOMUtils.get('step1Status');
            const step1ActionButton = window.UIManager.DOMUtils.get('step1ActionButton');
            
            if (step1Checkbox && step1Status && step1ActionButton) {
                if (status.loginComplete) {
                    // ログイン済みの場合
                    step1Checkbox.textContent = '✅';
                    step1Checkbox.style.border = '2px solid #4caf50';
                    step1Status.innerHTML = '<strong>ログイン済み ✓</strong>';
                    step1Status.style.color = '#4caf50';
                    step1ActionButton.textContent = 'クリア';
                    step1ActionButton.onclick = () => this.handleLogout();
                    // 🎨 クリア機能として統一されたスタイル
                    step1ActionButton.style.background = 'linear-gradient(135deg, #ff9800, #f57c00)';
                    step1ActionButton.style.color = 'white';
                } else if (window.isApiKeyConfigured()) {
                    // API KEY設定済みだが未ログインの場合
                    step1Checkbox.textContent = '⚠️';
                    step1Checkbox.style.border = '2px solid #ff9800';
                    step1Status.innerHTML = '<strong>API KEY・パスワード設定済</strong>';
                    step1Status.style.color = '#ff9800';
                    step1ActionButton.textContent = 'ログイン';
                    step1ActionButton.onclick = window.loginWithPassword;
                    step1ActionButton.style.background = '';
                    step1ActionButton.style.color = '';
                } else {
                    // 未設定の場合
                    step1Checkbox.textContent = '❌';
                    step1Checkbox.style.border = '2px solid #ccc';
                    step1Status.innerHTML = '<strong>未設定</strong>';
                    step1Status.style.color = 'var(--text-secondary)';
                    step1ActionButton.textContent = 'ログイン';
                    step1ActionButton.onclick = window.loginWithPassword;
                    step1ActionButton.style.background = '';
                    step1ActionButton.style.color = '';
                }
            }
            
            // Step 2: テーマ状態の更新
            const step2Checkbox = window.UIManager.DOMUtils.get('step2Checkbox');
            const step2Status = window.UIManager.DOMUtils.get('step2Status');
            const step2ActionButton = window.UIManager.DOMUtils.get('step2ActionButton');
            
            if (step2Checkbox && step2Status && step2ActionButton) {
                if (status.themeComplete) {
                    const currentTheme = window.StorageManager.theme.loadInput();
                    const displayTheme = currentTheme.length > 30 ? currentTheme.substring(0, 30) + '...' : currentTheme;
                    step2Checkbox.textContent = '✅';
                    step2Checkbox.style.border = '2px solid #4caf50';
                    step2Status.innerHTML = `<strong>テーマは"${displayTheme}" ✓</strong>`;
                    step2Status.style.color = '#4caf50';
                    step2ActionButton.textContent = 'クリア';
                    step2ActionButton.onclick = () => this.handleThemeClear();
                    // 🎨 クリア機能として統一されたスタイル
                    step2ActionButton.style.background = 'linear-gradient(135deg, #ff9800, #f57c00)';
                    step2ActionButton.style.color = 'white';
                } else {
                    step2Checkbox.textContent = '❌';
                    step2Checkbox.style.border = '2px solid #ccc';
                    step2Status.innerHTML = '<strong>未設定</strong>';
                    step2Status.style.color = 'var(--text-secondary)';
                    step2ActionButton.textContent = '設定';
                    step2ActionButton.onclick = () => this.focusThemeInput();
                    step2ActionButton.style.background = '';
                    step2ActionButton.style.color = '';
                }
            }
            
            // ファイル添付ボタンの状態制御
            const fileInput = window.UIManager.DOMUtils.get('themeFileInput');
            const fileInputDisplay = window.UIManager.DOMUtils.get('fileInputDisplay');
            const fileInputText = window.UIManager.DOMUtils.get('fileInputText');
            
            console.log('🔄 ファイル入力状態更新:', {
                fileInput: !!fileInput,
                fileInputDisplay: !!fileInputDisplay,
                fileInputText: !!fileInputText,
                loginComplete: status.loginComplete
            });
            
            if (fileInput && fileInputDisplay && fileInputText) {
                if (status.loginComplete) {
                    console.log('✅ ログイン完了 - ファイル入力を有効化');
                    fileInput.disabled = false;
                    fileInputDisplay.classList.remove('disabled');
                    fileInputDisplay.title = '';
                    fileInputDisplay.style.pointerEvents = 'auto';
                    fileInputDisplay.style.cursor = 'pointer';
                    
                    // ファイルが選択されていない場合の表示
                    if (!fileInput.files || fileInput.files.length === 0) {
                        fileInputText.textContent = '選択されていません';
                        fileInputText.classList.add('placeholder');
                    }
                } else {
                    console.log('❌ 未ログイン - ファイル入力を無効化');
                    fileInput.disabled = true;
                    fileInputDisplay.classList.add('disabled');
                    fileInputDisplay.title = 'ログインしてからファイル添付をご利用ください';
                    fileInputDisplay.style.pointerEvents = 'none';
                    fileInputDisplay.style.cursor = 'not-allowed';
                    fileInputText.textContent = 'ログイン後添付出来ます';
                    fileInputText.classList.add('placeholder');
                    // ファイル選択をクリア
                    fileInput.value = '';
                }
            } else {
                console.log('⚠️ ファイル入力要素が見つかりません');
            }
            
            // セッション開始ボタンの状態更新
            this.updateSessionStartButton(status.allComplete);
            
            // Step0の表示制御も更新
            if (window.updateStep0Visibility) {
                window.updateStep0Visibility();
            }
            
            console.log('✅ 2ステップUI更新完了:', status);
        } catch (error) {
            console.error('❌ 2ステップUI更新エラー:', error);
        }
    },
    
    // 🚀 セッション開始ボタンの状態更新
    updateSessionStartButton(allComplete) {
        const startButton = window.UIManager.DOMUtils.get('startButton');
        const startButtonSubText = window.UIManager.DOMUtils.get('startButtonSubText');
        const sessionStartSection = window.UIManager.DOMUtils.get('sessionStartSection');
        
        // Step0時は非表示、Step1以降で表示
        const isApiKeyConfigured = window.isApiKeyConfigured ? window.isApiKeyConfigured() : false;
        
        if (sessionStartSection) {
            if (isApiKeyConfigured) {
                sessionStartSection.style.display = 'flex';
            } else {
                sessionStartSection.style.display = 'none';
                return; // Step0時は処理終了
            }
        }
        
        if (startButton) {
            if (allComplete) {
                // Step1・2完了時
                startButton.disabled = false;
                startButton.style.background = 'linear-gradient(135deg, #4caf50, #45a049)';
                // サブテキストを削除
                if (startButtonSubText) {
                    startButtonSubText.style.display = 'none';
                }
            } else {
                // 未完了時
                startButton.disabled = true;
                startButton.style.background = '';
                // サブテキストを表示
                if (startButtonSubText) {
                    startButtonSubText.style.display = 'block';
                    startButtonSubText.textContent = 'Step1・2完了後開始できます';
                }
            }
        }
    },
    
    // =================================================================================
    // フォーカス制御
    // =================================================================================
    
    // 🎯 フォーカス制御関数
    focusPasswordInput() {
        const passwordInput = window.UIManager.DOMUtils.get('passwordInput');
        if (passwordInput) {
            passwordInput.focus();
            passwordInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    },
    
    focusThemeInput() {
        const themeInput = window.UIManager.DOMUtils.get('themeInput');
        if (themeInput) {
            themeInput.focus();
            themeInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    },
    
    // =================================================================================
    // 状態クリア処理
    // =================================================================================
    
    // 🚪 ログイン状態クリア処理
    handleLogout() {
        const confirmed = confirm('ログイン状態をクリアしますか？\nAPIキーとログイン状態がクリアされます。');
        if (confirmed) {
            try {
                // ログイン状態をクリア
                window.clearLoginState();
                window.AppState.apiKey = null;
                
                // パスワード入力欄をクリア
                const passwordInput = window.UIManager.DOMUtils.get('passwordInput');
                if (passwordInput) {
                    passwordInput.value = '';
                }
                
                // UI更新
                this.update2StepUI();
                
                console.log('✅ ログイン状態クリア完了');
                window.showMessage('success', 'ログイン状態をクリアしました');
            } catch (error) {
                console.error('❌ ログイン状態クリアエラー:', error);
                window.showMessage('error', 'ログイン状態のクリア中にエラーが発生しました');
            }
        }
    },
    
    // 🗑️ テーマクリア処理
    handleThemeClear() {
        const confirmed = confirm('テーマ設定をクリアしますか？');
        if (confirmed) {
            try {
                // テーマ入力状態をクリア
                window.clearThemeInputState();
                
                // テーマ入力欄をクリア
                const themeInput = window.UIManager.DOMUtils.get('themeInput');
                if (themeInput) {
                    themeInput.value = '';
                }
                
                // UI更新
                this.update2StepUI();
                
                console.log('✅ テーマクリア完了');
                window.showMessage('success', 'テーマ設定をクリアしました');
            } catch (error) {
                console.error('❌ テーマクリアエラー:', error);
                window.showMessage('error', 'テーマクリア中にエラーが発生しました');
            }
        }
    },
    
    // =================================================================================
    // ユーティリティ関数
    // =================================================================================
    
    // セッション状態表示更新
    updateSessionStatus(status, theme) {
        const sessionStatus = window.UIManager.DOMUtils.get('sessionStatus');
        const sessionTheme = window.UIManager.DOMUtils.get('sessionTheme');
        
        if (sessionStatus) {
            sessionStatus.textContent = status;
        }
        if (sessionTheme) {
            sessionTheme.textContent = theme;
        }
    },
    
    // マイク初期化（script.jsの関数を呼び出し）
    async initializeMicrophoneRecording() {
        if (typeof window.initializeMicrophoneRecording === 'function') {
            return await window.initializeMicrophoneRecording();
        } else {
            console.error('❌ initializeMicrophoneRecording関数が見つかりません');
            return false;
        }
    },

    // 音声システムの初期化
    initializeVoiceSystem() {
        console.log('🎤 音声システム初期化開始');
        
        // stateManagerが利用可能かチェック
        if (!window.stateManager) {
            console.log('⚠️ stateManagerが未初期化のため音声システム初期化をスキップ');
            return false;
        }
        
        try {
            // 音声システムの初期化
            window.stateManager.permissionManager.getPermission()
                .then(granted => {
                    if (granted) {
                        console.log('✅ 音声システム初期化完了');
                        window.AppState.voiceRecognitionStability.micPermissionGranted = true;
                    } else {
                        console.log('🚫 マイク許可が拒否されました');
                        window.AppState.voiceRecognitionStability.micPermissionGranted = false;
                    }
                })
                .catch(error => {
                    console.error('❌ 音声システム初期化エラー:', error);
                    window.AppState.voiceRecognitionStability.micPermissionGranted = false;
                });
            
            return true;
        } catch (error) {
            console.error('❌ 音声システム初期化エラー:', error);
            return false;
        }
    }
};

// =================================================================================
// 初期化とグローバル公開
// =================================================================================

// 初期化
SessionStartManager.init();

// グローバル公開（後方互換性確保）
window.SessionStartManager = SessionStartManager;

// 後方互換性: 既存の関数名でアクセス可能
window.startSession = () => SessionStartManager.startSession();
window.startWarmupPhase = () => SessionStartManager.startWarmupPhase();
window.initializeKnowledgeSession = (theme) => SessionStartManager.initializeKnowledgeSession(theme);
window.evaluate2StepStatus = () => SessionStartManager.evaluate2StepStatus();
window.update2StepUI = () => SessionStartManager.update2StepUI();
window.updateSessionStartButton = (allComplete) => SessionStartManager.updateSessionStartButton(allComplete);
window.focusPasswordInput = () => SessionStartManager.focusPasswordInput();
window.focusThemeInput = () => SessionStartManager.focusThemeInput();
window.handleLogout = () => SessionStartManager.handleLogout();
window.handleThemeClear = () => SessionStartManager.handleThemeClear();

console.log('✅ SessionStartManager初期化完了'); 