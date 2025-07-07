# 深堀くんv2.0 音声認識システム設計書

## 概要
音声認識システムの改善において、「無音時間監視」ではなく「音声認識システムの稼働状態監視」に焦点を当てた包括的な設計案です。

## 1. 現状の問題点

### 1.1 根本的な問題
- **音声認識が3ラリー後に停止する**
- **エラー発生後の自動再開が阻止される**
- **「マイク許可アラート防止」により手動再開も困難**

### 1.2 ユーザー体験の問題
- **マイクボタンの機能が不明確**
- **音声認識の状態がわかりにくい**
- **エラー発生時の対処方法が不明**

## 2. 設計方針

### 2.1 基本原則
1. **音声のみでの会話を実現**
2. **マイク許可アラートは一回だけ**
3. **シンプルで直感的な操作**
4. **トラブルを感じさせない動作**

### 2.2 重要なポイント
- ❌ **「無音時間監視」は不要**
- ✅ **音声認識システムの稼働状態監視**
- ✅ **エラー状態の即座な検出・通知**
- ✅ **適切な再開メカニズムの実装**

## 3. UI改善案

### 3.1 マイクボタンの状態表示

#### 3.1.1 稼働中（ACTIVE）
```
├── ACTIVE（稼働中）
│   ├── 色：緑（🟢）
│   ├── テキスト：「音声認識中・クリックで一時停止」
│   └── クリック：一時停止実行
```

#### 3.1.2 一時停止中（PAUSED）
```
├── PAUSED（一時停止中）
│   ├── 色：黄（🟡）
│   ├── テキスト：「一時停止中・クリックで再開」
│   └── クリック：再開実行
```

#### 3.1.3 エラー停止中（ERROR）
```
├── ERROR（エラー停止中）
│   ├── 色：赤（🔴）
│   ├── テキスト：「エラー停止中・クリックで再開」
│   └── クリック：エラー回復・再開実行
```

### 3.2 マイクボタンの統合設計
- **緊急停止ボタンを廃止**
- **マイクボタンに状態表示と一時停止・再開機能を統合**
- **1つのボタンで全ての音声認識制御を実現**

## 4. 技術実装案

### 4.1 音声認識システムの稼働状態監視

#### 4.1.1 監視対象
```javascript
// 音声認識システムの稼働状態
const VoiceRecognitionMonitor = {
    // 基本状態
    systemStatus: 'active|paused|error|stopped',
    
    // 稼働状態監視
    isSystemRunning: false,
    lastActivityTime: null,
    
    // エラー状態監視
    errorType: null,
    errorCount: 0,
    lastErrorTime: null,
    
    // 再開可能性監視
    canRestart: true,
    restartAttempts: 0,
    
    // 許可状態監視
    permissionStatus: 'granted|denied|prompt',
    permissionStable: true
};
```

#### 4.1.2 監視方法
```javascript
// 定期的な稼働状態チェック
const MonitoringSystem = {
    // 音声認識の実際の稼働状態をチェック
    checkRecognitionSystemHealth() {
        // SpeechRecognitionオブジェクトの状態確認
        // イベントリスナーの応答性確認
        // 内部状態の整合性確認
    },
    
    // ネットワーク接続状態の監視
    checkNetworkConnectivity() {
        // API接続の確認
        // レスポンス時間の監視
        // 接続品質の評価
    },
    
    // ブラウザ互換性の監視
    checkBrowserCompatibility() {
        // SpeechRecognition API の可用性
        // 音声権限の状態確認
        // ブラウザ固有の問題の検出
    }
};
```

### 4.2 エラー状態の即座な検出・通知

#### 4.2.1 エラー分類システム
```javascript
const ErrorClassification = {
    // 一時的なエラー（自動回復可能）
    TEMPORARY_ERRORS: [
        'network-error',
        'audio-capture-error',
        'no-speech-timeout'
    ],
    
    // 永続的なエラー（手動介入必要）
    PERSISTENT_ERRORS: [
        'permission-denied',
        'browser-not-supported',
        'service-unavailable'
    ],
    
    // 段階的エラー（再試行戦略適用）
    GRADUAL_ERRORS: [
        'recognition-timeout',
        'connection-unstable',
        'audio-quality-poor'
    ]
};
```

#### 4.2.2 エラー検出メカニズム
```javascript
const ErrorDetectionSystem = {
    // リアルタイムエラー検出
    realTimeErrorDetection() {
        // 音声認識イベントの監視
        // 異常な無応答の検出
        // パフォーマンス劣化の検出
    },
    
    // 予兆エラー検出
    predictiveErrorDetection() {
        // 連続エラーパターンの分析
        // 品質劣化の傾向監視
        // 環境変化の検出
    },
    
    // 即座の通知システム
    immediateNotification(errorType, severity) {
        // ユーザーへの即座の通知
        // 適切な対処法の提示
        // 自動回復の試行
    }
};
```

### 4.3 適切な再開メカニズムの実装

#### 4.3.1 階層化されたマイク許可管理
```javascript
const PermissionManager = {
    // 初回許可取得（アラート発生）
    requestInitialPermission() {
        // ユーザーに明確な説明
        // 一度だけの許可要求
        // 許可状態の永続化
    },
    
    // セッション内再開（アラート無し）
    restartWithinSession() {
        // 既存許可の再利用
        // 内部状態のリセット
        // 即座の再開実行
    },
    
    // 許可状態の継承
    inheritPermissionState() {
        // 前回セッションの許可状態確認
        // 継続的な許可の確認
        // 必要時のみ再許可要求
    }
};
```

#### 4.3.2 エラー種別による再開戦略
```javascript
const RestartStrategy = {
    // 一時的ネットワークエラー
    handleTemporaryNetworkError() {
        // 短時間での自動再試行
        // 接続状態の監視
        // 段階的な再開実行
    },
    
    // 真の許可取り消し
    handlePermissionRevoked() {
        // 明確な状況説明
        // 再許可手順の案内
        // 手動での再開要求
    },
    
    // 音声品質の問題
    handleAudioQualityIssues() {
        // 音声入力の確認
        // 設定の最適化提案
        // 代替手段の提示
    }
};
```

### 4.4 継続性監視の時間設定見直し

#### 4.4.1 深堀アプリの特性を考慮した設定
```javascript
const TimingConfiguration = {
    // 正常な考慮時間（無音でも正常）
    normalThinkingTime: {
        min: 0,      // 最小考慮時間
        max: 180000, // 最大考慮時間（3分）
        typical: 30000 // 典型的な考慮時間（30秒）
    },
    
    // 異常検出の閾値
    abnormalDetectionThreshold: {
        totalSilence: 300000,    // 完全無音5分で異常検出
        systemUnresponsive: 10000, // システム無応答10秒で異常検出
        errorRecoveryTimeout: 30000 // エラー回復タイムアウト30秒
    },
    
    // 監視間隔
    monitoringInterval: {
        healthCheck: 5000,       // 健康状態チェック5秒間隔
        errorDetection: 1000,    // エラー検出1秒間隔
        permissionVerify: 30000  // 許可状態確認30秒間隔
    }
};
```

## 5. モジュール設計

### 5.1 新規モジュールの分離

#### 5.1.1 音声認識監視モジュール
```
app/voice-recognition-monitor.js
├── VoiceRecognitionMonitor（稼働状態監視）
├── ErrorDetectionSystem（エラー検出）
├── PermissionManager（許可管理）
└── RestartStrategy（再開戦略）
```

#### 5.1.2 UI状態制御モジュール
```
app/voice-ui-controller.js
├── MicrophoneButtonController（マイクボタン制御）
├── StatusDisplayManager（状態表示管理）
├── UserNotificationSystem（ユーザー通知）
└── ErrorUIHandler（エラーUI処理）
```

#### 5.1.3 継続性管理モジュール
```
app/voice-continuity-manager.js
├── ContinuityMonitor（継続性監視）
├── TimingConfiguration（タイミング設定）
├── RecoveryManager（回復管理）
└── SessionStateManager（セッション状態管理）
```

### 5.2 既存モジュールの改良

#### 5.2.1 app/script.js の改良
```javascript
// 現在の668行目を修正
// 変更前：statusText = '音声認識中...';
// 変更後：statusText = '音声認識中・クリックで一時停止';

// updateProgress関数の改良
updateProgress(permissionState, recognitionState, audioInfo) {
    const statusElement = window.UIManager.DOMUtils.get('sessionStatus');
    if (!statusElement) return;
    
    let statusText = '';
    
    if (permissionState === 'denied') {
        statusText = 'マイク許可が必要です';
    } else if (permissionState === 'requesting') {
        statusText = 'マイク許可を確認中...';
    } else if (recognitionState === 'starting') {
        statusText = '音声認識を開始中...';
    } else if (recognitionState === 'active') {
        statusText = '音声認識中・クリックで一時停止';  // 改良
    } else if (recognitionState === 'paused') {
        statusText = '一時停止中・クリックで再開';      // 新規追加
    } else if (recognitionState === 'stopping') {
        statusText = '音声認識を停止中...';
    } else if (recognitionState === 'error') {
        statusText = 'エラー停止中・クリックで再開';    // 改良
    } else if (audioInfo.length > 0) {
        statusText = `音声再生中 (${audioInfo.length}件)`;
    } else {
        statusText = '待機中';
    }
    
    statusElement.textContent = statusText;
}
```

## 6. 機能追加時のファイル分割・モジュール化設計ルール

### 6.1 基本原則

#### 6.1.1 単一責任の原則（SRP）
- **1つのモジュールは1つの責任のみを持つ**
- **関連する機能は同じモジュール内に配置**
- **異なる責任は異なるモジュールに分離**

#### 6.1.2 依存関係の最小化
- **モジュール間の依存関係を最小限に抑制**
- **循環依存を完全に回避**
- **必要な場合のみ依存関係を設定**

#### 6.1.3 拡張性の確保
- **新機能追加時の既存コードへの影響を最小化**
- **インターフェースの一貫性を保持**
- **後方互換性を保証**

### 6.2 ファイル分割の基準

#### 6.2.1 機能単位での分割
```
機能追加時の分割基準：
├── 行数が500行を超える場合
├── 複数の責任を持つ場合
├── 独立してテスト可能な場合
└── 他の機能から再利用される場合
```

#### 6.2.2 依存関係による分割
```
依存関係の分割基準：
├── 外部APIに依存する機能
├── DOM操作に依存する機能
├── 状態管理に依存する機能
└── 音声・UI・データ等の領域別分割
```

### 6.3 モジュール構成規則

#### 6.3.1 命名規則
```
ファイル命名規則：
├── [機能名]-[サブ機能名].js
├── 例：voice-recognition-monitor.js
├── 例：ui-state-controller.js
└── 例：session-continuity-manager.js
```

#### 6.3.2 エクスポート規則
```javascript
// 明確なエクスポート
const ModuleName = {
    // 公開メソッド
    publicMethod1() {},
    publicMethod2() {},
    
    // 内部メソッド（_プレフィックス）
    _privateMethod1() {},
    _privateMethod2() {}
};

// グローバルエクスポート
window.ModuleName = ModuleName;
```

#### 6.3.3 ドキュメント化規則
```javascript
/**
 * [モジュール名]
 * 
 * @description [機能の説明]
 * @dependencies [依存関係]
 * @exports [エクスポート項目]
 * @version [バージョン]
 * @author [作成者]
 * @date [作成日]
 */
```

### 6.4 設計検証のチェックリスト

#### 6.4.1 機能追加前のチェック
- [ ] 既存ファイルの行数確認（500行以上なら分割検討）
- [ ] 追加機能の責任範囲明確化
- [ ] 既存モジュールとの依存関係確認
- [ ] 循環依存の可能性確認

#### 6.4.2 機能追加後のチェック
- [ ] モジュール間の依存関係が最小化されているか
- [ ] 各モジュールが単一責任を持っているか
- [ ] 新機能が適切にテスト可能か
- [ ] 既存機能への影響が最小化されているか

### 6.5 実装スケジュール

#### 6.5.1 Phase 1: UI改善（即時実装）
- [ ] app/script.js の668行目修正
- [ ] マイクボタンの状態表示改善
- [ ] 一時停止・再開機能の追加

#### 6.5.2 Phase 2: 監視システム構築
- [ ] voice-recognition-monitor.js の作成
- [ ] エラー検出システムの実装
- [ ] 稼働状態監視の実装

#### 6.5.3 Phase 3: UI制御システム構築
- [ ] voice-ui-controller.js の作成
- [ ] マイクボタン制御の統合
- [ ] 状態表示管理の実装

#### 6.5.4 Phase 4: 継続性管理システム構築
- [ ] voice-continuity-manager.js の作成
- [ ] タイミング設定の最適化
- [ ] 回復管理システムの実装

## 7. 期待される効果

### 7.1 ユーザー体験の向上
- **音声認識の状態が明確になる**
- **トラブル時の対処法が明確になる**
- **1つのボタンで全ての制御が可能になる**

### 7.2 システムの安定性向上
- **エラーの早期検出・回復**
- **適切な再開メカニズム**
- **「マイク許可は一回だけ」の完全実現**

### 7.3 保守性の向上
- **モジュール化による保守性向上**
- **単一責任による理解しやすさ**
- **拡張性の確保**

---

このドキュメントに基づいて、音声認識システムの改善と適切なモジュール化を実施します。 