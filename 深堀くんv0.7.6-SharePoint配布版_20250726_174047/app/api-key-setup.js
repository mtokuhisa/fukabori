// 深堀くんアプリ - APIキー設定モーダルシステム
// API Key Setup Modal System for Fukabori-kun App

// =================================================================================
// API KEY SETUP MODULE
// =================================================================================

const ApiKeySetupModule = {
    // 設定中のAPIキーを一時保存
    currentApiKeyForSetup: null,

    // =================================================================================
    // STEP 0: API KEY設定システム (初回ユーザー向け改善)
    // =================================================================================

    /**
     * APIキーが設定されているかどうかを判定（拡張版）
     * @returns {boolean} APIキーが設定されているかどうか
     */
    isApiKeyConfigured() {
        try {
            // 拡張版API Key設定状況確認を使用
            if (window.StorageManager && window.StorageManager.apiKey.isConfiguredExtended) {
                const config = window.StorageManager.apiKey.isConfiguredExtended();
                console.log(`🔍 APIキー設定チェック (拡張版):`, config);
                return config.totalCount > 0;
            }
            
            // フォールバック: 従来の方式
            const apiKeyCount = window.getSavedApiKeyCount ? window.getSavedApiKeyCount() : 0;
            console.log(`🔍 APIキー設定チェック (従来版): ${apiKeyCount}個のAPIキーが保存済み`);
            return apiKeyCount > 0;
        } catch (error) {
            console.error('❌ APIキー設定チェックエラー:', error);
            return false;
        }
    },

    /**
     * Step0の表示状態を更新
     */
    updateStep0Visibility() {
        try {
            const step0Section = document.getElementById('step0Section');
            const step1Section = document.getElementById('step1Section');
            const step2Section = document.getElementById('step2Section');
            
            if (!step0Section || !step1Section || !step2Section) {
                console.error('❌ Step要素が見つかりません');
                return;
            }
            
            const apiConfigured = this.isApiKeyConfigured();
            
            if (apiConfigured) {
                // APIキー設定済み: Step0を非表示、Step1・2を表示
                step0Section.style.display = 'none';
                step1Section.style.display = 'block';
                step2Section.style.display = 'block';
                console.log('✅ APIキー設定済み - Step1から開始');
            } else {
                // APIキー未設定: Step0を表示、Step1・2を非表示
                step0Section.style.display = 'block';
                step1Section.style.display = 'none';
                step2Section.style.display = 'none';
                console.log('⚠️ APIキー未設定 - Step0から開始');
            }
            
            // Step0の状態を更新
            this.updateStep0Status(apiConfigured);
            
        } catch (error) {
            console.error('❌ Step0表示状態更新エラー:', error);
        }
    },

    /**
     * Step0の状態表示を更新
     * @param {boolean} configured APIキーが設定済みかどうか
     */
    updateStep0Status(configured) {
        try {
            const step0Checkbox = document.getElementById('step0Checkbox');
            const step0Description = document.getElementById('step0Description');
            
            if (!step0Checkbox || !step0Description) {
                return;
            }
            
            if (configured) {
                step0Checkbox.textContent = '✅';
                step0Checkbox.style.border = '2px solid #4caf50';
                step0Description.textContent = 'APIキー設定完了 - ログインできます';
                step0Description.style.color = '#4caf50';
            } else {
                step0Checkbox.textContent = '❌';
                step0Checkbox.style.border = '2px solid #ccc';
                step0Description.textContent = '深堀くんを利用するにはOpenAI APIキーが必要です';
                step0Description.style.color = 'var(--text-secondary)';
            }
        } catch (error) {
            console.error('❌ Step0状態更新エラー:', error);
        }
    },

    // =================================================================================
    // API KEY設定専用モーダル制御
    // =================================================================================

    /**
     * APIキー設定モーダルを開く
     */
    openApiKeySetupModal() {
        try {
            const modal = document.getElementById('apiKeySetupModal');
            if (modal) {
                modal.classList.remove('hidden');
                
                // ステップ1にリセット
                this.showSetupStep(1);
                
                // 入力フィールドをクリア
                const apiKeyInput = document.getElementById('apiKeySetupInput');
                const passwordInput = document.getElementById('apiPasswordSetupInput');
                const confirmInput = document.getElementById('apiPasswordConfirmInput');
                
                if (apiKeyInput) apiKeyInput.value = '';
                if (passwordInput) passwordInput.value = '';
                if (confirmInput) confirmInput.value = '';
                
                // ボタン状態をリセット
                this.updateSetupButtonStates();
                
                console.log('🔑 APIキー設定モーダルを開きました');
            }
        } catch (error) {
            console.error('❌ APIキー設定モーダル開くエラー:', error);
        }
    },

    /**
     * APIキー設定モーダルを閉じる
     * @param {Event} event クリックイベント（オプション）
     */
    closeApiKeySetupModal(event) {
        try {
            // 背景クリックの場合は無視（モーダル内クリックは閉じない）
            if (event && event.target !== event.currentTarget) {
                return;
            }
            
            const modal = document.getElementById('apiKeySetupModal');
            if (modal) {
                modal.classList.add('hidden');
                console.log('🔑 APIキー設定モーダルを閉じました');
            }
        } catch (error) {
            console.error('❌ APIキー設定モーダル閉じるエラー:', error);
        }
    },

    /**
     * セットアップステップを表示
     * @param {number} stepNumber ステップ番号（1または2）
     */
    showSetupStep(stepNumber) {
        try {
            const step1 = document.getElementById('setupStep1');
            const step2 = document.getElementById('setupStep2');
            const stepText = document.getElementById('setupStepText');
            
            if (!step1 || !step2 || !stepText) {
                return;
            }
            
            if (stepNumber === 1) {
                step1.style.display = 'block';
                step2.style.display = 'none';
                stepText.textContent = 'ステップ 1/2: OpenAI API KEY';
            } else {
                step1.style.display = 'none';
                step2.style.display = 'block';
                stepText.textContent = 'ステップ 2/2: 暗号化パスワード設定';
            }
            
            console.log(`🔄 セットアップステップ${stepNumber}を表示`);
        } catch (error) {
            console.error('❌ セットアップステップ表示エラー:', error);
        }
    },

    /**
     * ステップ2に進む
     */
    proceedToStep2() {
        try {
            this.showSetupStep(2);
            this.updateSetupButtonStates();
            
            // パスワード入力フィールドにフォーカス
            const passwordInput = document.getElementById('apiPasswordSetupInput');
            if (passwordInput) {
                passwordInput.focus();
            }
        } catch (error) {
            console.error('❌ ステップ2に進むエラー:', error);
        }
    },

    /**
     * ステップ1に戻る
     */
    backToStep1() {
        try {
            this.showSetupStep(1);
            this.updateSetupButtonStates();
        } catch (error) {
            console.error('❌ ステップ1に戻るエラー:', error);
        }
    },

    // =================================================================================
    // API KEY設定処理
    // =================================================================================

    /**
     * APIキー設定のテスト
     */
    async testApiKeySetup() {
        try {
            const apiKeyInput = document.getElementById('apiKeySetupInput');
            const testButton = document.getElementById('testApiSetupButton');
            const result = document.getElementById('apiTestResult');
            
            if (!apiKeyInput || !testButton || !result) {
                return;
            }
            
            const apiKey = apiKeyInput.value.trim();
            
            // 基本的なバリデーション
            if (!apiKey) {
                this.showApiTestResult('error', 'APIキーを入力してください');
                return;
            }
            
            if (!apiKey.startsWith('sk-')) {
                this.showApiTestResult('error', 'APIキーは "sk-" で始まる必要があります');
                return;
            }
            
            // テスト実行中の表示
            testButton.disabled = true;
            testButton.textContent = '🔍 テスト中...';
            this.showApiTestResult('info', 'OpenAI APIに接続中...');
            
            // APIテスト
            try {
                const response = await fetch('https://api.openai.com/v1/models', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    this.currentApiKeyForSetup = apiKey;
                    this.showApiTestResult('success', '✅ 接続成功！APIキーが有効です');
                    
                    // 次へボタンを有効化
                    const proceedButton = document.getElementById('proceedStep2Button');
                    if (proceedButton) {
                        proceedButton.disabled = false;
                    }
                    
                    console.log('✅ APIキーテスト成功');
                } else {
                    this.currentApiKeyForSetup = null;
                    const errorText = await response.text();
                    console.error('❌ APIキーテストエラー:', response.status, errorText);
                    
                    if (response.status === 401) {
                        this.showApiTestResult('error', '❌ 無効なAPIキーです');
                    } else if (response.status === 429) {
                        this.showApiTestResult('error', '❌ レート制限です。少し待ってから再試行してください');
                    } else {
                        this.showApiTestResult('error', `❌ エラー: ${response.status}`);
                    }
                }
            } catch (networkError) {
                console.error('❌ ネットワークエラー:', networkError);
                this.showApiTestResult('error', '❌ ネットワークエラー: インターネット接続を確認してください');
            }
            
        } catch (error) {
            console.error('❌ APIキーテストエラー:', error);
            this.showApiTestResult('error', '❌ テストに失敗しました');
        } finally {
            // ボタン状態を復元
            const testButton = document.getElementById('testApiSetupButton');
            if (testButton) {
                testButton.disabled = false;
                testButton.textContent = '🔍 接続テスト';
            }
        }
    },

    /**
     * APIテスト結果を表示
     * @param {string} type 結果タイプ ('success', 'error', 'info')
     * @param {string} message メッセージ
     */
    showApiTestResult(type, message) {
        try {
            const result = document.getElementById('apiTestResult');
            if (!result) return;
            
            result.style.display = 'block';
            result.textContent = message;
            
            // スタイルを設定
            if (type === 'success') {
                result.style.background = 'rgba(76, 175, 80, 0.2)';
                result.style.border = '1px solid #4caf50';
                result.style.color = '#4caf50';
            } else if (type === 'error') {
                result.style.background = 'rgba(244, 67, 54, 0.2)';
                result.style.border = '1px solid #f44336';
                result.style.color = '#f44336';
            } else {
                result.style.background = 'rgba(33, 150, 243, 0.2)';
                result.style.border = '1px solid #2196f3';
                result.style.color = '#2196f3';
            }
        } catch (error) {
            console.error('❌ APIテスト結果表示エラー:', error);
        }
    },

    /**
     * APIキー設定を完了
     */
    async completeApiKeySetup() {
        try {
            const passwordInput = document.getElementById('apiPasswordSetupInput');
            const confirmInput = document.getElementById('apiPasswordConfirmInput');
            const completeButton = document.getElementById('completeSetupButton');
            
            if (!passwordInput || !confirmInput || !completeButton) {
                return;
            }
            
            const password = passwordInput.value.trim();
            const confirmPassword = confirmInput.value.trim();
            
            // バリデーション
            if (!password) {
                this.showPasswordMatchResult('error', 'パスワードを入力してください');
                return;
            }
            
            if (password !== confirmPassword) {
                this.showPasswordMatchResult('error', 'パスワードが一致しません');
                return;
            }
            
            if (password.length < 4) {
                this.showPasswordMatchResult('error', 'パスワードは4文字以上で入力してください');
                return;
            }
            
            if (!this.currentApiKeyForSetup) {
                window.showMessage('error', 'APIキーのテストを先に完了してください');
                return;
            }
            
            // 設定処理中の表示
            completeButton.disabled = true;
            completeButton.textContent = '設定中...';
            
            try {
                // APIキーを暗号化して保存
                window.saveEncryptedApiKey(this.currentApiKeyForSetup, password);
                
                // 設定完了
                this.currentApiKeyForSetup = null;
                
                // モーダルを閉じる
                this.closeApiKeySetupModal();
                
                // Step表示を更新
                this.updateStep0Visibility();
                
                // 成功メッセージ（企業版か個人版かを判定）
                const isEmbeddedApiKey = window.AppState?.apiKeySource === 'embedded';
                const message = isEmbeddedApiKey 
                    ? '✅ 企業版深堀くんの設定が完了しました！ログインできます'
                    : '✅ APIキー設定が完了しました！ログインできます';
                window.showMessage('success', message);
                
                console.log('✅ APIキー設定完了');
                
            } catch (saveError) {
                console.error('❌ APIキー保存エラー:', saveError);
                window.showMessage('error', 'APIキーの保存に失敗しました');
            }
            
        } catch (error) {
            console.error('❌ APIキー設定完了エラー:', error);
            window.showMessage('error', 'APIキー設定に失敗しました');
        } finally {
            // ボタン状態を復元
            const completeButton = document.getElementById('completeSetupButton');
            if (completeButton) {
                completeButton.disabled = false;
                completeButton.textContent = '設定完了';
            }
        }
    },

    /**
     * パスワード一致結果を表示
     * @param {string} type 結果タイプ ('success', 'error')
     * @param {string} message メッセージ
     */
    showPasswordMatchResult(type, message) {
        try {
            const result = document.getElementById('passwordMatchResult');
            if (!result) return;
            
            result.style.display = 'block';
            result.textContent = message;
            
            if (type === 'success') {
                result.style.color = '#4caf50';
            } else {
                result.style.color = '#f44336';
            }
        } catch (error) {
            console.error('❌ パスワード一致結果表示エラー:', error);
        }
    },

    /**
     * セットアップモーダルのボタン状態を更新
     */
    updateSetupButtonStates() {
        try {
            // APIキー入力の監視
            const apiKeyInput = document.getElementById('apiKeySetupInput');
            const testButton = document.getElementById('testApiSetupButton');
            
            if (apiKeyInput && testButton) {
                const updateTestButton = () => {
                    const apiKey = apiKeyInput.value.trim();
                    testButton.disabled = !apiKey || !apiKey.startsWith('sk-');
                };
                
                apiKeyInput.removeEventListener('input', updateTestButton);
                apiKeyInput.addEventListener('input', updateTestButton);
                updateTestButton();
            }
            
            // パスワード入力の監視
            const passwordInput = document.getElementById('apiPasswordSetupInput');
            const confirmInput = document.getElementById('apiPasswordConfirmInput');
            const completeButton = document.getElementById('completeSetupButton');
            
            if (passwordInput && confirmInput && completeButton) {
                const updateCompleteButton = () => {
                    const password = passwordInput.value.trim();
                    const confirm = confirmInput.value.trim();
                    const isValid = password && confirm && password === confirm && password.length >= 4 && this.currentApiKeyForSetup;
                    
                    completeButton.disabled = !isValid;
                    
                    // パスワード一致確認の表示
                    if (password && confirm) {
                        if (password === confirm) {
                            this.showPasswordMatchResult('success', '✅ パスワードが一致します');
                        } else {
                            this.showPasswordMatchResult('error', '❌ パスワードが一致しません');
                        }
                    } else {
                        const result = document.getElementById('passwordMatchResult');
                        if (result) result.style.display = 'none';
                    }
                };
                
                passwordInput.removeEventListener('input', updateCompleteButton);
                confirmInput.removeEventListener('input', updateCompleteButton);
                passwordInput.addEventListener('input', updateCompleteButton);
                confirmInput.addEventListener('input', updateCompleteButton);
                updateCompleteButton();
            }
            
        } catch (error) {
            console.error('❌ セットアップボタン状態更新エラー:', error);
        }
    },

    // =================================================================================
    // API KEY取得方法ヘルプモーダル
    // =================================================================================

    /**
     * API KEY取得方法ヘルプモーダルを表示
     */
    showApiKeyHelpModal() {
        try {
            const modal = document.getElementById('apiKeyHelpModal');
            if (modal) {
                modal.classList.remove('hidden');
                console.log('❓ APIキー取得方法ヘルプを表示');
            }
        } catch (error) {
            console.error('❌ ヘルプモーダル表示エラー:', error);
        }
    },

    /**
     * API KEY取得方法ヘルプモーダルを閉じる
     * @param {Event} event クリックイベント（オプション）
     */
    closeApiKeyHelpModal(event) {
        try {
            // 背景クリックの場合は無視
            if (event && event.target !== event.currentTarget) {
                return;
            }
            
            const modal = document.getElementById('apiKeyHelpModal');
            if (modal) {
                modal.classList.add('hidden');
                console.log('❓ APIキー取得方法ヘルプを閉じました');
            }
        } catch (error) {
            console.error('❌ ヘルプモーダル閉じるエラー:', error);
        }
    },

    /**
     * 対応ファイル形式モーダルを表示
     */
    showSupportedFileFormats() {
        try {
            const modal = document.getElementById('supportedFilesModal');
            if (modal) {
                modal.classList.remove('hidden');
                console.log('📁 対応ファイル形式モーダルを表示');
            }
        } catch (error) {
            console.error('❌ 対応ファイル形式モーダル表示エラー:', error);
        }
    },

    /**
     * 対応ファイル形式モーダルを閉じる
     * @param {Event} event クリックイベント（オプション）
     */
    closeSupportedFilesModal(event) {
        try {
            // 背景クリックの場合は無視
            if (event && event.target !== event.currentTarget) {
                return;
            }
            
            const modal = document.getElementById('supportedFilesModal');
            if (modal) {
                modal.classList.add('hidden');
                console.log('📁 対応ファイル形式モーダルを閉じました');
            }
        } catch (error) {
            console.error('❌ 対応ファイル形式モーダル閉じるエラー:', error);
        }
    },

    // =================================================================================
    // 🔐 埋め込みAPI Key企業認証機能
    // =================================================================================

    /**
     * 企業認証セクションの表示切り替え
     * @param {boolean} show 表示するかどうか
     */
    toggleCorporateAuth(show) {
        try {
            const corporateSection = document.getElementById('corporateAuthSection');
            const personalSection = document.getElementById('personalApiKeySection');
            
            if (corporateSection) {
                corporateSection.style.display = show ? 'block' : 'none';
                console.log(`🏢 企業認証セクション: ${show ? '表示' : '非表示'}`);
                
                // フォーカス設定（企業版表示時は認証ボタンにフォーカス）
                if (show) {
                    const authButton = document.getElementById('corporateAuthButton');
                    if (authButton) {
                        setTimeout(() => authButton.focus(), 100);
                    }
                }
            }
            
            if (personalSection) {
                personalSection.style.display = show ? 'none' : 'block';
                console.log(`👤 個人設定セクション: ${show ? '非表示' : '表示'}`);
                
                // 個人設定表示時のフォーカス設定
                if (!show) {
                    const apiKeyInput = document.getElementById('apiKeySetupInput');
                    if (apiKeyInput) {
                        setTimeout(() => apiKeyInput.focus(), 100);
                    }
                }
            }
            
            console.log(`🔄 UI切り替え完了: ${show ? '企業版' : '個人版'}`);
        } catch (error) {
            console.error('❌ 企業認証セクション切り替えエラー:', error);
        }
    },

    /**
     * 企業パスワード認証処理
     */
    async authenticateCorporatePassword() {
        try {
            const passwordInput = document.getElementById('corporatePasswordInput');
            const authButton = document.getElementById('corporateAuthButton');
            const result = document.getElementById('corporateAuthResult');
            
            if (!passwordInput || !authButton || !result) {
                console.error('❌ 企業認証UI要素が見つかりません');
                return;
            }
            
            const password = passwordInput.value.trim();
            
            // バリデーション
            if (!password) {
                this.showCorporateAuthResult('error', '企業パスワードを入力してください');
                return;
            }
            
            // 埋め込みAPI Manager確認
            if (!window.EmbeddedApiManager) {
                this.showCorporateAuthResult('error', '埋め込みAPI Key機能が利用できません');
                return;
            }
            
            // 認証処理中の表示
            authButton.disabled = true;
            authButton.textContent = '🔐 認証中...';
            this.showCorporateAuthResult('info', '企業パスワードを認証中...');
            
            try {
                // 企業パスワード認証実行
                const authenticated = await window.EmbeddedApiManager.authenticateAndDecrypt(password);
                
                if (authenticated) {
                    this.showCorporateAuthResult('success', '✅ 企業パスワード認証成功！次にローカルログインパスワードを設定します...');
                    
                    // 成功時の処理
                    passwordInput.value = '';
                    
                    // 企業版API KeyをcurrentApiKeyForSetupに設定
                    if (window.EmbeddedApiManager && window.EmbeddedApiManager.embeddedApiKey) {
                        this.currentApiKeyForSetup = window.EmbeddedApiManager.embeddedApiKey;
                        console.log('🔑 企業版API Key設定完了');
                        
                        // Step1完了状態に設定
                        const proceedButton = document.getElementById('proceedStep2Button');
                        if (proceedButton) {
                            proceedButton.disabled = false;
                            proceedButton.style.opacity = '1';
                        }
                        
                        // テスト結果表示を更新
                        this.showApiTestResult('success', '✅ 企業版API Keyテスト成功');
                    }
                    
                    // Step0の表示状態を更新
                    this.updateStep0Visibility();
                    
                    // AppStateの更新
                    if (window.AppState && window.StorageManager) {
                        const embeddedApiKey = window.StorageManager.apiKey.getWithPriority();
                        if (embeddedApiKey) {
                            window.AppState.apiKey = embeddedApiKey;
                            window.AppState.apiKeySource = 'embedded';
                        }
                    }
                    
                    // Step1完了してStep2（パスワード設定）に進む
                    setTimeout(() => {
                        // Step1を完了状態にする
                        const step1 = document.getElementById('setupStep1');
                        const step2 = document.getElementById('setupStep2');
                        const stepText = document.getElementById('setupStepText');
                        const corporateNotice = document.getElementById('corporateStep2Notice');
                        
                        if (step1) step1.style.display = 'none';
                        if (step2) step2.style.display = 'block';
                        if (stepText) stepText.textContent = 'ステップ 2/2: ローカルログインパスワード設定';
                        if (corporateNotice) corporateNotice.style.display = 'block';
                        
                        // パスワード入力にフォーカス
                        const passwordInput = document.getElementById('apiPasswordSetupInput');
                        if (passwordInput) {
                            setTimeout(() => passwordInput.focus(), 100);
                        }
                        
                        console.log('🔄 企業認証完了 - Step2（パスワード設定）へ進行');
                    }, 1500);
                    
                    console.log('✅ 企業パスワード認証完了');
                    
                } else {
                    this.showCorporateAuthResult('error', '❌ 企業パスワードが正しくありません');
                    console.log('❌ 企業パスワード認証失敗');
                }
                
            } catch (authError) {
                console.error('❌ 企業認証エラー:', authError);
                this.showCorporateAuthResult('error', `❌ 認証エラー: ${authError.message}`);
            }
            
        } catch (error) {
            console.error('❌ 企業パスワード認証処理エラー:', error);
            this.showCorporateAuthResult('error', '認証処理に失敗しました');
        } finally {
            // ボタン状態を復元
            const authButton = document.getElementById('corporateAuthButton');
            if (authButton) {
                authButton.disabled = false;
                authButton.textContent = '🔐 企業パスワード認証';
            }
        }
    },

    /**
     * 企業認証結果表示
     * @param {string} type 結果タイプ ('success', 'error', 'info')
     * @param {string} message メッセージ
     */
    showCorporateAuthResult(type, message) {
        try {
            const result = document.getElementById('corporateAuthResult');
            if (!result) return;
            
            result.style.display = 'block';
            result.textContent = message;
            
            // スタイルを設定
            if (type === 'success') {
                result.style.background = 'rgba(76, 175, 80, 0.2)';
                result.style.border = '1px solid #4caf50';
                result.style.color = '#4caf50';
            } else if (type === 'error') {
                result.style.background = 'rgba(244, 67, 54, 0.2)';
                result.style.border = '1px solid #f44336';
                result.style.color = '#f44336';
            } else {
                result.style.background = 'rgba(33, 150, 243, 0.2)';
                result.style.border = '1px solid #2196f3';
                result.style.color = '#2196f3';
            }
        } catch (error) {
            console.error('❌ 企業認証結果表示エラー:', error);
        }
    }
};

// =================================================================================
// 初期化とグローバル公開
// =================================================================================

// DOMContentLoadedイベントで初期化
document.addEventListener('DOMContentLoaded', function() {
    // Step0システムの初期化
    setTimeout(() => {
        console.log('🔑 Step0: APIキー設定システム初期化開始');
        ApiKeySetupModule.updateStep0Visibility();
        console.log('✅ Step0: APIキー設定システム初期化完了');
    }, 50);
});

// グローバル関数として公開（互換性のため）
window.isApiKeyConfigured = () => ApiKeySetupModule.isApiKeyConfigured();
window.updateStep0Visibility = () => ApiKeySetupModule.updateStep0Visibility();
window.openApiKeySetupModal = () => ApiKeySetupModule.openApiKeySetupModal();
window.closeApiKeySetupModal = (event) => ApiKeySetupModule.closeApiKeySetupModal(event);
window.showApiKeyHelpModal = () => ApiKeySetupModule.showApiKeyHelpModal();
window.closeApiKeyHelpModal = (event) => ApiKeySetupModule.closeApiKeyHelpModal(event);
window.showSupportedFileFormats = () => ApiKeySetupModule.showSupportedFileFormats();
window.closeSupportedFilesModal = (event) => ApiKeySetupModule.closeSupportedFilesModal(event);
window.testApiKeySetup = () => ApiKeySetupModule.testApiKeySetup();
window.proceedToStep2 = () => ApiKeySetupModule.proceedToStep2();
window.backToStep1 = () => ApiKeySetupModule.backToStep1();
window.completeApiKeySetup = () => ApiKeySetupModule.completeApiKeySetup();
// 🔐 埋め込みAPI Key企業認証機能のグローバル公開
window.toggleCorporateAuth = (show) => ApiKeySetupModule.toggleCorporateAuth(show);
window.authenticateCorporatePassword = () => ApiKeySetupModule.authenticateCorporatePassword();

// モジュール自体も公開（必要に応じて）
window.ApiKeySetupModule = ApiKeySetupModule;

console.log('✅ APIキー設定モーダルシステム読み込み完了'); 