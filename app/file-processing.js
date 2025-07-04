/**
 * 深堀くん - ファイル処理システム
 * PDF、Excel、Word、PowerPointファイルの読み込みとテーマ抽出機能
 * 
 * 依存関係:
 * - DOMUtils (DOM操作)
 * - AppState (状態管理)
 * - showMessage (メッセージ表示)
 * - evaluate2StepStatus (ログイン状態確認)
 * - returnToLogin (画面遷移)
 */

// =================================================================================
// FILE PROCESSING INTERFACE - ファイル処理インターフェース
// =================================================================================

// 外部依存関係へのインターフェース（将来的にDIに移行可能）
const FileProcessingInterface = {
    // DOM操作
    getDOMElement: (id) => {
        if (typeof DOMUtils !== 'undefined' && DOMUtils.get) {
            return DOMUtils.get(id);
        }
        return document.getElementById(id);
    },
    
    // 状態管理
    getAPIKey: () => {
        if (typeof AppState !== 'undefined') {
            return AppState.apiKey;
        }
        console.warn('AppState not available');
        return null;
    },
    
    saveExtractedThemes: (themes) => {
        if (typeof AppState !== 'undefined') {
            AppState.extractedThemes = themes;
            return true;
        }
        console.warn('AppState not available');
        return false;
    },
    
    saveDocumentContext: (content, filename) => {
        if (typeof AppState !== 'undefined') {
            AppState.documentContext = content;
            AppState.currentDocument = filename;
            return true;
        }
        console.warn('AppState not available');
        return false;
    },
    
    // メッセージ表示
    showMessage: (type, message) => {
        if (typeof showMessage !== 'undefined') {
            showMessage(type, message);
        } else {
            console.log(`[${type}] ${message}`);
        }
    },
    
    // ログイン状態確認
    checkLoginStatus: () => {
        if (typeof evaluate2StepStatus !== 'undefined') {
            return evaluate2StepStatus();
        }
        return { loginComplete: false, themeComplete: false };
    },
    
    // 画面遷移
    navigateToLogin: () => {
        if (typeof returnToLogin !== 'undefined') {
            returnToLogin();
        } else {
            console.warn('returnToLogin not available');
        }
    }
};

// グローバル名前空間に登録
window.FukaboriFileProcessing = window.FukaboriFileProcessing || {};

// =================================================================================
// FILE SELECTION & HANDLING - ファイル選択・処理
// =================================================================================

function checkLoginBeforeFileSelect(event) {
    const loginStatus = FileProcessingInterface.checkLoginStatus();
    if (!loginStatus.loginComplete) {
        event.preventDefault();
        event.stopPropagation();
        alert('ログインしてからファイル添付をご利用ください。\n「その他設定」からAPIキーを設定してログインしてください。');
        return false;
    }
    return true;
}

// 🎯 カスタムファイル入力トリガー
function triggerFileInput() {
    console.log('🎯 triggerFileInput が呼び出されました');
    
    const loginStatus = FileProcessingInterface.checkLoginStatus();
    console.log('🔐 ログイン状態:', loginStatus);
    
    if (!loginStatus.loginComplete) {
        console.log('⚠️ 未ログイン状態のため、ファイル選択を拒否');
        alert('ログインしてからファイル添付をご利用ください。\n「その他設定」からAPIキーを設定してログインしてください。');
        return;
    }
    
    const fileInput = FileProcessingInterface.getDOMElement('themeFileInput');
    console.log('📁 ファイル入力要素:', fileInput);
    console.log('🔒 ファイル入力無効状態:', fileInput?.disabled);
    
    if (fileInput && !fileInput.disabled) {
        console.log('✅ ファイル選択ダイアログを開きます');
        fileInput.click();
    } else {
        console.log('❌ ファイル入力が無効または見つかりません');
    }
}

async function handleThemeFile() {
    const fileInput = FileProcessingInterface.getDOMElement('themeFileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        updateFileInputDisplay();
        return;
    }
    
    // ファイル選択表示を更新
    updateFileInputDisplay(file.name);
    
    console.log('📄 ファイルが選択されました:', file.name);
    
    try {
        // GPT-4o miniを使用した分析を試行
        const analysisResult = await analyzeFileWithGPT(file);
        if (analysisResult && analysisResult.themes && analysisResult.themes.length > 0) {
            displayThemeSelection(analysisResult);
        } else {
            // フォールバック: 従来のファイル処理
            console.log('⚠️ GPT分析に失敗、従来の処理にフォールバック');
            await handleTraditionalFileProcessing(file);
        }
    } catch (error) {
        console.error('❌ ファイル処理エラー:', error);
        showFileErrorModal(error);
    }
}

// 🎨 ファイル入力表示更新
function updateFileInputDisplay(fileName = null) {
    const fileInputText = FileProcessingInterface.getDOMElement('fileInputText');
    if (!fileInputText) return;
    
    const loginStatus = FileProcessingInterface.checkLoginStatus();
    
    if (!loginStatus.loginComplete) {
        fileInputText.textContent = 'ログイン後添付出来ます';
        fileInputText.classList.add('placeholder');
    } else if (fileName) {
        fileInputText.textContent = fileName;
        fileInputText.classList.remove('placeholder');
    } else {
        fileInputText.textContent = '選択されていません';
        fileInputText.classList.add('placeholder');
    }
}

// 🚨 ファイルエラーモーダル表示
function showFileErrorModal(error) {
    let userFriendlyMessage = 'ファイルの読み込み中に問題が発生しました。';
    
    // エラーメッセージを分かりやすく変換
    if (error.message.includes('APIキー')) {
        userFriendlyMessage = 'ファイルの分析にはAPIキーの設定が必要です。\n「その他設定」からOpenAI APIキーを設定してください。';
    } else if (error.message.includes('insufficient_quota')) {
        userFriendlyMessage = 'APIの利用制限に達しています。\nしばらく時間をおいてから再度お試しください。';
    } else if (error.message.includes('rate_limit')) {
        userFriendlyMessage = 'APIの利用制限に達しています。\n少し時間をおいてから再度お試しください。';
    } else if (error.message.includes('PDF')) {
        userFriendlyMessage = 'PDFファイルの読み取りに失敗しました。\nファイルが破損していないか確認してください。';
    } else if (error.message.includes('Excel') || error.message.includes('Word') || error.message.includes('PowerPoint')) {
        userFriendlyMessage = 'ファイルの形式が対応していないか、ファイルが破損している可能性があります。\n別の形式で保存し直してお試しください。';
    } else if (error.message.includes('Network') || error.message.includes('fetch')) {
        userFriendlyMessage = 'インターネット接続に問題があります。\n接続を確認してから再度お試しください。';
    } else {
        userFriendlyMessage = 'ファイルの処理中に予期しない問題が発生しました。\nファイル形式や内容を確認してください。';
    }
    
    // モーダル作成
    const modal = document.createElement('div');
    modal.className = 'error-modal';
    modal.innerHTML = `
        <div class="error-modal-content">
            <div class="error-modal-title">
                ⚠️ ファイル処理エラー
            </div>
            <div class="error-modal-message">
                ${userFriendlyMessage.replace(/\n/g, '<br>')}
            </div>
            <div class="error-modal-actions">
                <button class="error-modal-button secondary" onclick="closeFileErrorModal()">
                    🔄 再試行
                </button>
                <button class="error-modal-button" onclick="returnToLoginFromError()">
                    ← ログイン画面に戻る
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // モーダル外クリックで閉じる
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeFileErrorModal();
        }
    });
}

// 🚪 エラーモーダルを閉じる
function closeFileErrorModal() {
    const modal = document.querySelector('.error-modal');
    if (modal) {
        modal.remove();
    }
    
    // ファイル選択をクリア
    const fileInput = FileProcessingInterface.getDOMElement('themeFileInput');
    if (fileInput) {
        fileInput.value = '';
        updateFileInputDisplay();
    }
}

// 🏠 エラーからログイン画面に戻る
function returnToLoginFromError() {
    closeFileErrorModal();
    FileProcessingInterface.navigateToLogin();
}

async function analyzeFileWithGPT(file) {
    console.log('🤖 ファイル分析を開始');
    
    showThemeAnalysisModal();
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    // ファイル形式に応じた進行状況表示
    let progressSteps = getProgressStepsForFileType(fileExtension);
    
    updateAnalysisProgress(progressSteps.step1.main, progressSteps.step1.detail);
    
    try {
        // ファイル内容を抽出
        const fileContent = await extractFileContent(file, updateAnalysisProgress);
        if (!fileContent || fileContent.trim().length === 0) {
            throw new Error('ファイル内容が読み取れませんでした');
        }
        
        updateAnalysisProgress(progressSteps.step2.main, progressSteps.step2.detail);
        
        // GPT-4o miniでテーマ抽出
        const themesResult = await extractThemesWithGPT(fileContent);
        
        updateAnalysisProgress(progressSteps.step3.main, progressSteps.step3.detail);
        
        const analysisResult = {
            documentSummary: themesResult.documentSummary,
            themes: themesResult.themes,
            originalContent: fileContent
        };
        
        // AppStateに保存
        FileProcessingInterface.saveExtractedThemes(analysisResult.themes);
        FileProcessingInterface.saveDocumentContext(fileContent, file.name);
        
        console.log('✅ ファイル分析完了:', analysisResult);
        
        return analysisResult;
        
    } catch (error) {
        console.error('❌ ファイル分析エラー:', error);
        throw error;
    }
}

// 🆕 ファイル形式に応じた進行状況メッセージ
function getProgressStepsForFileType(fileExtension) {
    const commonSteps = {
        step2: {
            main: 'AIがファイル内容を理解しています...',
            detail: '文章の内容を分析中です'
        },
        step3: {
            main: '深掘りテーマを作成しています...',
            detail: '最適なテーマを選択中です'
        }
    };
    
    switch (fileExtension) {
        case 'pdf':
            return {
                step1: {
                    main: 'PDFファイルを読み込んでいます...',
                    detail: 'ページごとに文字を取り出しています'
                },
                ...commonSteps
            };
        case 'xlsx':
        case 'xls':
            return {
                step1: {
                    main: 'Excelファイルを読み込んでいます...',
                    detail: 'シートごとにデータを取り出しています'
                },
                ...commonSteps
            };
        case 'docx':
            return {
                step1: {
                    main: 'Wordファイルを読み込んでいます...',
                    detail: '文書の内容を取り出しています'
                },
                ...commonSteps
            };
        case 'pptx':
            return {
                step1: {
                    main: 'PowerPointファイルを読み込んでいます...',
                    detail: 'スライドごとに文字を取り出しています'
                },
                ...commonSteps
            };
        default:
            return {
                step1: {
                    main: 'ファイルを読み込んでいます...',
                    detail: 'ファイルの内容を確認中です'
                },
                ...commonSteps
            };
    }
}

async function extractFileContent(file, progressCallback) {
    return new Promise((resolve, reject) => {
        // ファイルサイズチェック (10MB制限)
        if (file.size > 10 * 1024 * 1024) {
            reject(new Error('ファイルサイズが10MBを超えています'));
            return;
        }
        
        const reader = new FileReader();
        const fileExtension = file.name.split('.').pop().toLowerCase();
        
        reader.onload = function(e) {
            const content = e.target.result;
            
            try {
                if (fileExtension === 'txt' || fileExtension === 'md') {
                    resolve(content);
                } else if (fileExtension === 'csv') {
                    // CSV の場合、カンマ区切りをタブ区切りに変換
                    const csvContent = content.replace(/,/g, '\t');
                    resolve(csvContent);
                } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
                    // 🆕 Excel形式の処理
                    extractExcelContent(content, fileExtension, progressCallback)
                        .then(resolve)
                        .catch(reject);
                } else if (fileExtension === 'pdf') {
                    // 🆕 PDF形式の処理
                    extractPDFContent(content, progressCallback)
                        .then(resolve)
                        .catch(reject);
                } else if (fileExtension === 'docx' || fileExtension === 'doc') {
                    // 🆕 Word形式の処理
                    extractWordContent(content, fileExtension, progressCallback)
                        .then(resolve)
                        .catch(reject);
                } else if (fileExtension === 'pptx' || fileExtension === 'ppt') {
                    // 🆕 PowerPoint形式の処理
                    extractPowerPointContent(content, fileExtension, progressCallback)
                        .then(resolve)
                        .catch(reject);
                } else {
                    // その他のファイル形式の基本的な処理
                    resolve(content);
                }
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = function() {
            reject(new Error('ファイル読み込みエラー'));
        };
        
        // ファイル形式に応じた読み込み
        if (fileExtension === 'pdf' || 
            fileExtension === 'xlsx' || fileExtension === 'xls' ||
            fileExtension === 'docx' || fileExtension === 'doc' ||
            fileExtension === 'pptx' || fileExtension === 'ppt') {
            // バイナリ形式の場合はArrayBufferとして読み込み
            reader.readAsArrayBuffer(file);
        } else {
            reader.readAsText(file, 'UTF-8');
        }
    });
}

// =================================================================================
// EXCEL PROCESSING - Excel処理
// =================================================================================

// 🆕 Excel形式ファイルの内容抽出関数
async function extractExcelContent(arrayBuffer, fileExtension) {
    return new Promise((resolve, reject) => {
        try {
            // SheetJSライブラリが利用可能かチェック
            if (typeof XLSX === 'undefined') {
                // SheetJSライブラリを動的に読み込み
                loadSheetJSLibrary()
                    .then(() => {
                        processExcelFile(arrayBuffer, resolve, reject);
                    })
                    .catch(() => {
                        reject(new Error('Excel処理ライブラリの読み込みに失敗しました。テキスト形式でファイルを保存し直してください。'));
                    });
            } else {
                processExcelFile(arrayBuffer, resolve, reject);
            }
        } catch (error) {
            reject(new Error(`Excel処理エラー: ${error.message}`));
        }
    });
}

// 🆕 SheetJSライブラリの動的読み込み
function loadSheetJSLibrary() {
    return new Promise((resolve, reject) => {
        // 既に読み込み済みの場合
        if (typeof XLSX !== 'undefined') {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        script.onload = () => {
            console.log('✅ SheetJSライブラリを読み込みました');
            resolve();
        };
        script.onerror = () => {
            console.error('❌ SheetJSライブラリの読み込みに失敗');
            reject();
        };
        document.head.appendChild(script);
    });
}

// 🆕 Excelファイルの処理
function processExcelFile(arrayBuffer, resolve, reject) {
    try {
        // Excelファイルを読み込み
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        // 全シートの内容を抽出
        let extractedContent = '';
        
        workbook.SheetNames.forEach((sheetName, index) => {
            const worksheet = workbook.Sheets[sheetName];
            
            // シート名を追加
            extractedContent += `\n【シート: ${sheetName}】\n`;
            
            // シートをCSV形式に変換（タブ区切り）
            const csvData = XLSX.utils.sheet_to_csv(worksheet, { FS: '\t' });
            
            if (csvData.trim()) {
                extractedContent += csvData + '\n';
            } else {
                extractedContent += '（空のシート）\n';
            }
            
            // シート間の区切り
            if (index < workbook.SheetNames.length - 1) {
                extractedContent += '\n' + '='.repeat(50) + '\n';
            }
        });
        
        // メタ情報を追加
        const summary = `\n【ファイル概要】\n` +
                       `シート数: ${workbook.SheetNames.length}\n` +
                       `シート名: ${workbook.SheetNames.join(', ')}\n` +
                       `抽出日時: ${new Date().toLocaleString()}\n\n`;
        
        const finalContent = summary + extractedContent;
        
        console.log('✅ Excelファイルの内容抽出完了', {
            sheets: workbook.SheetNames.length,
            contentLength: finalContent.length
        });
        
        resolve(finalContent);
        
    } catch (error) {
        console.error('❌ Excel処理エラー:', error);
        reject(new Error(`Excelファイルの処理に失敗しました: ${error.message}`));
    }
}

// =================================================================================
// PDF PROCESSING - PDF処理
// =================================================================================

// 🆕 PDF形式ファイルの内容抽出関数
async function extractPDFContent(arrayBuffer, progressCallback) {
    return new Promise((resolve, reject) => {
        try {
            // PDF.jsライブラリが利用可能かチェック
            if (typeof pdfjsLib === 'undefined') {
                if (progressCallback) {
                    progressCallback('PDFファイルを読み込んでいます...', 'PDF処理用のプログラムを準備中です');
                }
                
                // PDF.jsライブラリを動的に読み込み
                loadPDFJSLibrary()
                    .then(() => {
                        processPDFFile(arrayBuffer, resolve, reject, progressCallback);
                    })
                    .catch(() => {
                        reject(new Error('PDF処理プログラムの読み込みに失敗しました。テキスト形式でファイルを保存し直してください。'));
                    });
            } else {
                processPDFFile(arrayBuffer, resolve, reject, progressCallback);
            }
        } catch (error) {
            reject(new Error(`PDF処理エラー: ${error.message}`));
        }
    });
}

// 🆕 PDF.jsライブラリの動的読み込み
function loadPDFJSLibrary() {
    return new Promise((resolve, reject) => {
        // 既に読み込み済みの場合
        if (typeof pdfjsLib !== 'undefined') {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = () => {
            // PDF.jsの設定
            if (typeof pdfjsLib !== 'undefined') {
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                console.log('✅ PDF.jsライブラリを読み込みました');
                resolve();
            } else {
                reject();
            }
        };
        script.onerror = () => {
            console.error('❌ PDF.jsライブラリの読み込みに失敗');
            reject();
        };
        document.head.appendChild(script);
    });
}

// 🆕 PDFファイルの処理
async function processPDFFile(arrayBuffer, resolve, reject, progressCallback) {
    try {
        const pdf = await pdfjsLib.getDocument({ 
            data: arrayBuffer,
            // PDF.jsの設定を最適化
            verbosity: 0,
            standardFontDataUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/',
            cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
            cMapPacked: true
        }).promise;
        
        let extractedContent = '';
        const totalPages = pdf.numPages;
        
        if (progressCallback) {
            progressCallback('PDFファイルを読み込んでいます...', `${totalPages}ページの文字を取り出し中です`);
        }
        
        // 全ページのテキストを抽出
        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            try {
                if (progressCallback) {
                    progressCallback('PDFファイルを読み込んでいます...', `ページ ${pageNum}/${totalPages} を処理中です`);
                }
                
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                
                extractedContent += `\n【ページ ${pageNum}】\n`;
                
                // テキストアイテムを位置情報を考慮して結合
                const textItems = textContent.items
                    .filter(item => item.str && item.str.trim())
                    .sort((a, b) => {
                        // Y座標でソート（上から下へ）
                        const yDiff = b.transform[5] - a.transform[5];
                        if (Math.abs(yDiff) > 5) return yDiff > 0 ? 1 : -1;
                        // 同じ行なら X座標でソート（左から右へ）
                        return a.transform[4] - b.transform[4];
                    });
                
                let pageText = '';
                let lastY = null;
                
                for (const item of textItems) {
                    const currentY = item.transform[5];
                    const text = item.str.trim();
                    
                    if (text) {
                        // 改行判定（Y座標が大きく変わった場合）
                        if (lastY !== null && Math.abs(currentY - lastY) > 5) {
                            pageText += '\n';
                        } else if (pageText && !pageText.endsWith(' ') && !text.startsWith(' ')) {
                            pageText += ' ';
                        }
                        
                        pageText += text;
                        lastY = currentY;
                    }
                }
                
                // 文字化けチェック
                const validTextRatio = calculateValidTextRatio(pageText);
                
                if (pageText && validTextRatio > 0.3) {
                    // 不要な記号や文字化けを除去
                    const cleanedText = cleanPDFText(pageText);
                    extractedContent += cleanedText + '\n';
                } else if (pageText) {
                    extractedContent += '（このページは文字化けしているか、読み取りが困難です）\n';
                    console.warn(`⚠️ ページ ${pageNum}: 文字化け率が高い (有効テキスト率: ${(validTextRatio * 100).toFixed(1)}%)`);
                } else {
                    // テキストがない場合、画像化PDFの可能性があるのでAI OCRを試行
                    console.log(`📷 ページ ${pageNum}: テキストなし - AI OCRを試行`);
                    try {
                        if (progressCallback) {
                            progressCallback('AI OCRを実行中...', `ページ ${pageNum} の画像を文字認識中です`);
                        }
                        
                        const ocrResult = await tryAIOCR(page, pageNum);
                        if (ocrResult && ocrResult.trim()) {
                            extractedContent += `【AI OCR結果】\n${ocrResult}\n`;
                            console.log(`✅ ページ ${pageNum}: AI OCR成功`);
                        } else {
                            extractedContent += '（このページにはテキストがありません - AI OCRでも文字を検出できませんでした）\n';
                            console.log(`⚠️ ページ ${pageNum}: AI OCR失敗またはテキストなし`);
                        }
                    } catch (ocrError) {
                        console.warn(`⚠️ ページ ${pageNum}: AI OCRエラー:`, ocrError);
                        
                        // エラーの種類に応じて適切なメッセージを表示
                        if (ocrError.message.includes('APIキー')) {
                            extractedContent += '（このページは画像化されており、AI OCRを実行するにはAPIキーの設定が必要です）\n';
                        } else if (ocrError.message.includes('insufficient_quota')) {
                            extractedContent += '（このページは画像化されており、AI OCRの利用制限に達しているため読み取れません）\n';
                        } else {
                            extractedContent += '（このページは画像化されており、AI OCRでの読み取りに失敗しました）\n';
                        }
                    }
                }
                
                // ページ間の区切り
                if (pageNum < totalPages) {
                    extractedContent += '\n' + '='.repeat(50) + '\n';
                }
                
            } catch (pageError) {
                console.warn(`⚠️ ページ ${pageNum} の処理でエラー:`, pageError);
                extractedContent += `\n【ページ ${pageNum}】\n（このページは読み取れませんでした）\n`;
                
                if (pageNum < totalPages) {
                    extractedContent += '\n' + '='.repeat(50) + '\n';
                }
            }
        }
        
        // 全体の文字化けチェック
        const overallValidRatio = calculateValidTextRatio(extractedContent);
        if (overallValidRatio < 0.2) {
            console.warn('⚠️ PDF全体の文字化け率が高いです');
            extractedContent += '\n\n【注意】このPDFファイルは文字化けが多く含まれています。\n可能であれば、テキスト形式やWordファイルでの保存をお試しください。';
        }
        
        // メタ情報を追加
        const summary = `\n【ファイル概要】\n` +
                       `形式: PDF\n` +
                       `ページ数: ${totalPages}\n` +
                       `文字認識率: ${(overallValidRatio * 100).toFixed(1)}%\n` +
                       `抽出日時: ${new Date().toLocaleString()}\n\n`;
        
        const finalContent = summary + extractedContent;
        
        console.log('✅ PDFファイルの内容抽出完了', {
            pages: totalPages,
            contentLength: finalContent.length,
            validTextRatio: overallValidRatio
        });
        
        resolve(finalContent);
        
    } catch (error) {
        console.error('❌ PDF処理エラー:', error);
        
        // より詳細なエラーメッセージ
        let errorMessage = 'PDFファイルの処理に失敗しました';
        if (error.message.includes('Invalid PDF')) {
            errorMessage = 'PDFファイルが破損しているか、形式が正しくありません';
        } else if (error.message.includes('password')) {
            errorMessage = 'パスワード保護されたPDFファイルは現在サポートされていません';
        }
        
        reject(new Error(errorMessage));
    }
}

// 🆕 PDF文字化けチェック関数
function calculateValidTextRatio(text) {
    if (!text || text.length === 0) return 0;
    
    // 有効な文字のパターン（ひらがな、カタカナ、漢字、英数字、一般的な記号）
    const validChars = text.match(/[あ-んア-ン一-龯a-zA-Z0-9\s\.,!?;:()「」『』【】\-_]/g);
    const validCharCount = validChars ? validChars.length : 0;
    
    return validCharCount / text.length;
}

// 🆕 PDF文字クリーニング関数
function cleanPDFText(text) {
    return text
        // 連続する記号を除去
        .replace(/[^\w\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\.,!?;:()「」『』【】\-_]/g, '')
        // 連続する空白を1つに
        .replace(/\s+/g, ' ')
        // 連続する改行を2つまでに制限
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

// 🆕 AI OCR機能（画像化PDFの文字認識）
async function tryAIOCR(page, pageNum) {
    try {
        // ページを画像として取得
        const viewport = page.getViewport({ scale: 2.0 }); // 高解像度で取得
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };

        await page.render(renderContext).promise;
        
        // Canvas を Base64 画像に変換
        const imageDataUrl = canvas.toDataURL('image/png');
        const base64Image = imageDataUrl.split(',')[1];
        
        // OpenAI Vision APIを使用してOCR
        const ocrResult = await performAIOCR(base64Image, pageNum);
        
        // Canvasをクリーンアップ
        canvas.remove();
        
        return ocrResult;
        
    } catch (error) {
        console.error(`❌ AI OCR処理エラー (ページ ${pageNum}):`, error);
        throw error;
    }
}

// 🆕 OpenAI Vision APIでOCR実行
async function performAIOCR(base64Image, pageNum) {
    try {
        const apiKey = FileProcessingInterface.getAPIKey();
        
        if (!apiKey) {
            throw new Error('APIキーが見つかりません');
        }
        
        console.log(`🔍 ページ ${pageNum}: AI OCR開始 (画像サイズ: ${Math.round(base64Image.length / 1024)}KB)`);
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: 'この画像に含まれているテキストを正確に読み取って、そのまま文字起こししてください。日本語の文書の場合は日本語で、英語の文書の場合は英語で出力してください。表やグラフがある場合は、その内容も含めて説明してください。読み取れない部分がある場合は「[読み取り不可]」と記載してください。'
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:image/png;base64,${base64Image}`,
                                    detail: 'high'
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 3000,
                temperature: 0.1
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ AI OCR APIエラー詳細 (ページ ${pageNum}):`, {
                status: response.status,
                statusText: response.statusText,
                body: errorText
            });
            
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch (e) {
                errorData = { error: { message: errorText } };
            }
            
            throw new Error(`API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        const ocrText = data.choices?.[0]?.message?.content;
        
        if (!ocrText || ocrText.trim() === '') {
            console.warn(`⚠️ ページ ${pageNum}: AI OCRで文字を検出できませんでした`);
            return null;
        }
        
        console.log(`✅ ページ ${pageNum}: AI OCR成功 (${ocrText.length}文字)`);
        return ocrText.trim();
        
    } catch (error) {
        console.error(`❌ AI OCR APIエラー (ページ ${pageNum}):`, error);
        
        // より詳細なエラー情報をログ出力
        if (error.message.includes('insufficient_quota')) {
            console.error('💰 OpenAI APIの利用制限に達しています');
        } else if (error.message.includes('invalid_api_key')) {
            console.error('🔑 APIキーが無効です');
        } else if (error.message.includes('rate_limit')) {
            console.error('⏱️ APIレート制限に達しています');
        }
        
        throw error;
    }
}

// =================================================================================
// WORD PROCESSING - Word処理
// =================================================================================

// 🆕 Word形式ファイルの内容抽出関数
async function extractWordContent(arrayBuffer, fileExtension) {
    return new Promise((resolve, reject) => {
        try {
            if (fileExtension === 'docx') {
                // .docx形式の処理
                if (typeof mammoth === 'undefined') {
                    loadMammothLibrary()
                        .then(() => {
                            processWordFile(arrayBuffer, resolve, reject);
                        })
                        .catch(() => {
                            reject(new Error('Word処理ライブラリの読み込みに失敗しました。テキスト形式でファイルを保存し直してください。'));
                        });
                } else {
                    processWordFile(arrayBuffer, resolve, reject);
                }
            } else {
                // .doc形式は複雑なため、基本的なエラーメッセージを返す
                reject(new Error('.doc形式は現在サポートされていません。.docx形式で保存し直してください。'));
            }
        } catch (error) {
            reject(new Error(`Word処理エラー: ${error.message}`));
        }
    });
}

// 🆕 Mammothライブラリの動的読み込み
function loadMammothLibrary() {
    return new Promise((resolve, reject) => {
        if (typeof mammoth !== 'undefined') {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
        script.onload = () => {
            console.log('✅ Mammothライブラリを読み込みました');
            resolve();
        };
        script.onerror = () => {
            console.error('❌ Mammothライブラリの読み込みに失敗');
            reject();
        };
        document.head.appendChild(script);
    });
}

// 🆕 Wordファイルの処理
async function processWordFile(arrayBuffer, resolve, reject) {
    try {
        const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
        
        // メタ情報を追加
        const summary = `\n【ファイル概要】\n` +
                       `形式: Microsoft Word (.docx)\n` +
                       `文字数: ${result.value.length}文字\n` +
                       `抽出日時: ${new Date().toLocaleString()}\n\n`;
        
        const finalContent = summary + '【文書内容】\n' + result.value;
        
        // 警告があれば表示
        if (result.messages && result.messages.length > 0) {
            console.warn('⚠️ Word処理の警告:', result.messages);
        }
        
        console.log('✅ Wordファイルの内容抽出完了', {
            contentLength: result.value.length,
            warnings: result.messages?.length || 0
        });
        
        resolve(finalContent);
        
    } catch (error) {
        console.error('❌ Word処理エラー:', error);
        reject(new Error(`Wordファイルの処理に失敗しました: ${error.message}`));
    }
}

// =================================================================================
// POWERPOINT PROCESSING - PowerPoint処理
// =================================================================================

// 🆕 PowerPoint形式ファイルの内容抽出関数
async function extractPowerPointContent(arrayBuffer, fileExtension) {
    return new Promise((resolve, reject) => {
        try {
            if (fileExtension === 'pptx') {
                // .pptx形式の処理（JSZipを使用）
                if (typeof JSZip === 'undefined') {
                    loadJSZipLibrary()
                        .then(() => {
                            processPowerPointFile(arrayBuffer, resolve, reject);
                        })
                        .catch(() => {
                            reject(new Error('PowerPoint処理ライブラリの読み込みに失敗しました。テキスト形式でファイルを保存し直してください。'));
                        });
                } else {
                    processPowerPointFile(arrayBuffer, resolve, reject);
                }
            } else {
                // .ppt形式は複雑なため、基本的なエラーメッセージを返す
                reject(new Error('.ppt形式は現在サポートされていません。.pptx形式で保存し直してください。'));
            }
        } catch (error) {
            reject(new Error(`PowerPoint処理エラー: ${error.message}`));
        }
    });
}

// 🆕 JSZipライブラリの動的読み込み
function loadJSZipLibrary() {
    return new Promise((resolve, reject) => {
        if (typeof JSZip !== 'undefined') {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = () => {
            console.log('✅ JSZipライブラリを読み込みました');
            resolve();
        };
        script.onerror = () => {
            console.error('❌ JSZipライブラリの読み込みに失敗');
            reject();
        };
        document.head.appendChild(script);
    });
}

// 🆕 PowerPointファイルの処理
async function processPowerPointFile(arrayBuffer, resolve, reject) {
    try {
        const zip = await JSZip.loadAsync(arrayBuffer);
        let extractedContent = '';
        let slideCount = 0;
        
        // スライドファイルを検索・処理
        const slidePromises = [];
        
        zip.folder('ppt/slides').forEach((relativePath, file) => {
            if (relativePath.match(/slide\d+\.xml$/)) {
                slideCount++;
                slidePromises.push(
                    file.async('text').then(content => {
                        const slideNumber = relativePath.match(/slide(\d+)\.xml$/)[1];
                        const textContent = extractTextFromSlideXML(content);
                        return { slideNumber: parseInt(slideNumber), content: textContent };
                    })
                );
            }
        });
        
        const slides = await Promise.all(slidePromises);
        
        // スライド番号順にソート
        slides.sort((a, b) => a.slideNumber - b.slideNumber);
        
        // 内容を結合
        slides.forEach((slide, index) => {
            extractedContent += `\n【スライド ${slide.slideNumber}】\n`;
            if (slide.content.trim()) {
                extractedContent += slide.content + '\n';
            } else {
                extractedContent += '（テキストなし）\n';
            }
            
            // スライド間の区切り
            if (index < slides.length - 1) {
                extractedContent += '\n' + '='.repeat(50) + '\n';
            }
        });
        
        // メタ情報を追加
        const summary = `\n【ファイル概要】\n` +
                       `形式: Microsoft PowerPoint (.pptx)\n` +
                       `スライド数: ${slideCount}\n` +
                       `抽出日時: ${new Date().toLocaleString()}\n\n`;
        
        const finalContent = summary + extractedContent;
        
        console.log('✅ PowerPointファイルの内容抽出完了', {
            slides: slideCount,
            contentLength: finalContent.length
        });
        
        resolve(finalContent);
        
    } catch (error) {
        console.error('❌ PowerPoint処理エラー:', error);
        reject(new Error(`PowerPointファイルの処理に失敗しました: ${error.message}`));
    }
}

// 🆕 PowerPointスライドXMLからテキストを抽出
function extractTextFromSlideXML(xmlContent) {
    try {
        // XMLパーサーを使用してテキストを抽出
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
        
        // テキスト要素（<a:t>タグ）を全て取得
        const textElements = xmlDoc.getElementsByTagName('a:t');
        const textArray = [];
        
        for (let i = 0; i < textElements.length; i++) {
            const text = textElements[i].textContent.trim();
            if (text) {
                textArray.push(text);
            }
        }
        
        return textArray.join(' ');
        
    } catch (error) {
        console.error('❌ スライドXML解析エラー:', error);
        return '（テキスト抽出エラー）';
    }
}

// =================================================================================
// THEME EXTRACTION - テーマ抽出
// =================================================================================

async function extractThemesWithGPT(content) {
    const apiKey = FileProcessingInterface.getAPIKey();
    if (!apiKey) {
        throw new Error('APIキーが設定されていません');
    }
    
    try {
        const prompt = window.AI_PROMPTS?.THEME_EXTRACTION ? 
            window.AI_PROMPTS.THEME_EXTRACTION + content :
            `以下の文書から、深掘りインタビューに適したテーマを抽出してください。
            
文書内容:
${content}

以下のJSON形式で回答してください:
{
    "documentSummary": "文書の概要（200文字程度）",
    "themes": [
        {
            "title": "テーマタイトル",
            "priority": "high/medium/low",
            "description": "テーマの説明（100文字程度）",
            "keyPoints": ["ポイント1", "ポイント2"]
        }
    ]
}`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini', // ChatGPT 4o mini
                messages: [
                    { role: 'user', content: prompt }
                ],
                max_tokens: 2000,
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        const responseText = data.choices[0].message.content;
        
        // JSON解析を試行
        try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const result = JSON.parse(jsonMatch[0]);
                
                // prompts.js の構造に合わせて変換
                if (result.themes && result.document_summary) {
                    return {
                        documentSummary: result.document_summary,
                        themes: result.themes.map(theme => ({
                            title: theme.title,
                            priority: theme.priority,
                            description: theme.description,
                            keyPoints: theme.key_points || []
                        }))
                    };
                } else {
                    return result;
                }
            } else {
                throw new Error('JSON形式でない応答');
            }
        } catch (parseError) {
            console.error('JSON解析エラー:', parseError);
            
            // フォールバック: 基本的なテーマ生成
            return {
                documentSummary: "文書が正常に読み込まれました。詳細な分析を行い、適切なテーマを抽出いたします。",
                themes: [{
                    title: "文書の内容について",
                    priority: "high",
                    description: "アップロードされた文書の内容を中心とした深掘り",
                    keyPoints: ["文書の主要ポイント", "具体的な経験や知見"]
                }]
            };
        }
        
    } catch (error) {
        console.error('❌ GPTテーマ抽出エラー:', error);
        throw error;
    }
}

async function handleTraditionalFileProcessing(file) {
    try {
        const content = await extractFileContent(file);
        const currentTheme = `「${file.name}」に関する内容について`;
        
        // インターフェース経由で状態を保存
        FileProcessingInterface.saveDocumentContext(content, file.name);
        
        // AppStateが利用可能な場合は直接更新
        if (typeof AppState !== 'undefined') {
            AppState.currentTheme = currentTheme;
        }
        
        const themeInput = FileProcessingInterface.getDOMElement('themeInput');
        if (themeInput) {
            themeInput.value = currentTheme;
            // 🔄 ファイル自動入力時の状態管理連携
            if (typeof saveThemeInputState !== 'undefined') {
                saveThemeInputState(currentTheme);
            }
            if (typeof update2StepUI !== 'undefined') {
                update2StepUI();
            }
        }
        
        console.log('✅ 従来のファイル処理完了');
    } catch (error) {
        console.error('❌ 従来のファイル処理エラー:', error);
        FileProcessingInterface.showMessage('error', 'ファイルの読み込みに失敗しました: ' + error.message);
    }
}

// =================================================================================
// THEME SELECTION MODAL FUNCTIONS - テーマ選択モーダル機能
// =================================================================================

function showThemeAnalysisModal() {
    const modal = FileProcessingInterface.getDOMElement('themeSelectionModal');
    const progressDiv = FileProcessingInterface.getDOMElement('analysisProgress');
    const contentDiv = FileProcessingInterface.getDOMElement('themeSelectionContent');
    const themeModalTitle = FileProcessingInterface.getDOMElement('themeModalTitle');
    const themeModalCloseBtn = FileProcessingInterface.getDOMElement('themeModalCloseBtn');
    
    if (modal) {
        modal.classList.remove('hidden');
        if (progressDiv) progressDiv.classList.remove('hidden');
        if (contentDiv) contentDiv.classList.add('hidden');
        
        // 初期表示時はタイトルとボタンを表示状態に設定
        if (themeModalTitle) themeModalTitle.textContent = '📋 テーマ抽出中';
        if (themeModalCloseBtn) {
            themeModalCloseBtn.textContent = '✕ 中止';
            themeModalCloseBtn.style.display = 'block'; // 処理中は中止ボタンを表示
        }
    }
}

function updateAnalysisProgress(mainText, detailText) {
    const progressText = FileProcessingInterface.getDOMElement('progressText');
    const progressDetail = FileProcessingInterface.getDOMElement('progressDetail');
    const themeModalTitle = FileProcessingInterface.getDOMElement('themeModalTitle');
    const themeModalCloseBtn = FileProcessingInterface.getDOMElement('themeModalCloseBtn');
    
    if (progressText) progressText.textContent = mainText;
    if (progressDetail) progressDetail.textContent = detailText;
    
    // タイトルとボタンテキストを状況に応じて変更
    if (themeModalTitle && themeModalCloseBtn) {
        if (mainText.includes('テーマ抽出中') || mainText.includes('AI学習用データ生成中')) {
            themeModalTitle.textContent = '📋 テーマ抽出中';
            themeModalCloseBtn.textContent = '✕ 中止';
        } else if (mainText.includes('テーマ学習中') || mainText.includes('理解中')) {
            themeModalTitle.textContent = '📋 テーマ学習中';
            themeModalCloseBtn.textContent = '✕ 中止';
        } else if (mainText.includes('処理中')) {
            themeModalTitle.textContent = '📋 テーマ学習中';
            themeModalCloseBtn.textContent = '✕ 中止';
        }
    }
}

function displayThemeSelection(analysisResult) {
    const progressDiv = FileProcessingInterface.getDOMElement('analysisProgress');
    const contentDiv = FileProcessingInterface.getDOMElement('themeSelectionContent');
    const summaryText = FileProcessingInterface.getDOMElement('documentSummaryText');
    const themeList = FileProcessingInterface.getDOMElement('themeList');
    const themeModalTitle = FileProcessingInterface.getDOMElement('themeModalTitle');
    const themeModalCloseBtn = FileProcessingInterface.getDOMElement('themeModalCloseBtn');
    
    if (progressDiv) progressDiv.classList.add('hidden');
    if (contentDiv) contentDiv.classList.remove('hidden');
    
    // タイトルとボタンをテーマ選択画面用に戻す
    if (themeModalTitle) themeModalTitle.textContent = '📋 テーマを選択してください';
    if (themeModalCloseBtn) {
        themeModalCloseBtn.textContent = '✕ 閉じる';
        themeModalCloseBtn.style.display = 'none'; // 2.png用に閉じるボタンを非表示
    }
    
    // 文書要約表示
    if (summaryText) {
        summaryText.textContent = analysisResult.documentSummary || '文書の解析が完了しました。';
    }
    
    // テーマリスト生成
    if (themeList) {
        themeList.innerHTML = '';
        
        analysisResult.themes.forEach((theme, index) => {
            const themeItem = createThemeItem(theme, index, false); // デフォルトで非選択状態
            themeList.appendChild(themeItem);
        });
        
        // 全て非選択状態に設定
        if (typeof AppState !== 'undefined') {
            AppState.selectedThemes = [];
            AppState.currentTheme = '';
        }
        updateSelectedCount();
        
        const themeInput = FileProcessingInterface.getDOMElement('themeInput');
        if (themeInput) {
            themeInput.value = '';
            // 🔄 ファイル自動入力時の状態管理連携
            if (typeof saveThemeInputState !== 'undefined') {
                saveThemeInputState('');
            }
            if (typeof update2StepUI !== 'undefined') {
                update2StepUI();
            }
        }
        
        console.log('✅ テーマ選択モーダルを表示しました（デフォルト：未選択）');
    }
}

function createThemeItem(theme, index, selected = false) {
    const themeItem = document.createElement('div');
    themeItem.className = 'theme-item';
    
    const priorityEmoji = theme.priority === 'high' ? '🔥' : theme.priority === 'medium' ? '⭐' : '💡';
    
    themeItem.innerHTML = `
        <div class="theme-checkbox-container">
            <input type="checkbox" id="theme-${index}" class="theme-checkbox" 
                   ${selected ? 'checked' : ''} onchange="toggleThemeSelection(${index})">
            <label for="theme-${index}" class="theme-content">
                <div class="theme-header">
                    <span class="theme-priority">${priorityEmoji}</span>
                    <span class="theme-title">${theme.title}</span>
                </div>
                <div class="theme-description">${theme.description}</div>
                ${theme.keyPoints ? `
                    <div class="theme-points">
                        ${theme.keyPoints.map(point => `<span class="theme-point">• ${point}</span>`).join('')}
                    </div>
                ` : ''}
            </label>
        </div>
    `;
    
    return themeItem;
}

function toggleThemeSelection(index) {
    const checkbox = FileProcessingInterface.getDOMElement(`theme-${index}`);
    if (checkbox && typeof AppState !== 'undefined') {
        if (checkbox.checked) {
            if (!AppState.selectedThemes.includes(index)) {
                AppState.selectedThemes.push(index);
            }
        } else {
            AppState.selectedThemes = AppState.selectedThemes.filter(i => i !== index);
        }
        updateSelectedCount();
    }
}

function selectAllThemes() {
    const checkboxes = document.querySelectorAll('.theme-checkbox');
    if (typeof AppState !== 'undefined') {
        AppState.selectedThemes = [];
        
        checkboxes.forEach((checkbox, index) => {
            checkbox.checked = true;
            AppState.selectedThemes.push(index);
        });
    }
    
    updateSelectedCount();
}

function deselectAllThemes() {
    const checkboxes = document.querySelectorAll('.theme-checkbox');
    if (typeof AppState !== 'undefined') {
        AppState.selectedThemes = [];
    }
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    updateSelectedCount();
}

function updateSelectedCount() {
    const countElement = FileProcessingInterface.getDOMElement('selectedCount');
    const guidanceElement = FileProcessingInterface.getDOMElement('selectionGuidance');
    const floatingCompleteBtn = FileProcessingInterface.getDOMElement('floatingCompleteBtn');
    
    if (countElement && typeof AppState !== 'undefined') {
        const count = AppState.selectedThemes ? AppState.selectedThemes.length : 0;
        countElement.textContent = `${count}件のテーマが選択されています`;
        
        // リアルタイム誘導メッセージの更新
        if (guidanceElement) {
            if (count === 0) {
                guidanceElement.textContent = '⬇️ 下記からテーマを選択してください';
                guidanceElement.style.color = 'var(--text-secondary)';
            } else if (count === 1) {
                guidanceElement.textContent = '⬇️ 他のテーマも確認してください';
                guidanceElement.style.color = 'var(--text-secondary)';
            } else {
                guidanceElement.textContent = '✅ 複数テーマを選択中です';
                guidanceElement.style.color = '#4caf50';
            }
        }
        
        // フローティング確認ボタンの状態更新
        if (floatingCompleteBtn) {
            if (count > 0) {
                floatingCompleteBtn.disabled = false;
                floatingCompleteBtn.style.opacity = '1';
                floatingCompleteBtn.style.pointerEvents = 'auto';
                floatingCompleteBtn.textContent = '選択内容を確認';
            } else {
                floatingCompleteBtn.disabled = true;
                floatingCompleteBtn.style.opacity = '0.5';
                floatingCompleteBtn.style.pointerEvents = 'none';
                floatingCompleteBtn.textContent = '選択内容を確認';
            }
        }
    }
}

// 上部ボタン: 選択内容確認のためのスクロール
function scrollToConfirmation() {
    if (typeof AppState === 'undefined' || !AppState.selectedThemes || AppState.selectedThemes.length === 0) {
        FileProcessingInterface.showMessage('error', '少なくとも1つのテーマを選択してください');
        return;
    }
    
    // 選択されたテーマの詳細を保存（表示用）
    AppState.selectedThemeDetails = AppState.selectedThemes.map(index => 
        AppState.extractedThemes[index]
    );
    
    // テーマタイトルを結合してメインテーマとして設定
    const selectedTitles = AppState.selectedThemeDetails.map(theme => theme.title);
    AppState.currentTheme = selectedTitles.join('、');
    
    // テーマ入力欄に反映（プレビュー表示）
    const themeInput = FileProcessingInterface.getDOMElement('themeInput');
    if (themeInput) {
        themeInput.value = AppState.currentTheme;
        if (typeof saveThemeInputState !== 'undefined') {
            saveThemeInputState(AppState.currentTheme);
        }
        if (typeof update2StepUI !== 'undefined') {
            update2StepUI();
        }
    }
    
    // 下部のアクションエリアにスムーズスクロール
    const actionsElement = document.querySelector('.theme-selection-actions');
    if (actionsElement) {
        actionsElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
        
        // スクロール後に「選択したテーマで開始」ボタンを強調表示
        setTimeout(() => {
            const confirmBtn = FileProcessingInterface.getDOMElement('confirmThemeBtn');
            if (confirmBtn) {
                confirmBtn.style.animation = 'pulse 1s ease-in-out 3';
                confirmBtn.focus();
            }
        }, 800);
    }
    
    console.log('✅ 選択内容確認完了 - 下部で最終実行待ち');
}

// 下部ボタン: 実際の学習処理開始
async function confirmThemeSelection() {
    if (typeof AppState === 'undefined' || !AppState.selectedThemes || AppState.selectedThemes.length === 0) {
        FileProcessingInterface.showMessage('error', '少なくとも1つのテーマを選択してください');
        return;
    }
    
    // 選択されたテーマの詳細を保存
    AppState.selectedThemeDetails = AppState.selectedThemes.map(index => 
        AppState.extractedThemes[index]
    );
    
    // テーマタイトルを結合してメインテーマとして設定
    const selectedTitles = AppState.selectedThemeDetails.map(theme => theme.title);
    AppState.currentTheme = selectedTitles.join('、');
    
    // テーマ入力欄に反映
    const themeInput = FileProcessingInterface.getDOMElement('themeInput');
    if (themeInput) {
        themeInput.value = AppState.currentTheme;
        // 🔄 ファイル自動入力時の状態管理連携
        if (typeof saveThemeInputState !== 'undefined') {
            saveThemeInputState(AppState.currentTheme);
        }
        if (typeof update2StepUI !== 'undefined') {
            update2StepUI();
        }
    }
    
    // 処理中表示に切り替え
    const progressDiv = FileProcessingInterface.getDOMElement('analysisProgress');
    const contentDiv = FileProcessingInterface.getDOMElement('themeSelectionContent');
    
    if (contentDiv) contentDiv.classList.add('hidden');
    if (progressDiv) progressDiv.classList.remove('hidden');
    
    updateAnalysisProgress('選択されたテーマを処理中...', '学習データを準備しています...');
    
    // テーマサマリー生成 (GPT-4o miniを使用)
    try {
        updateAnalysisProgress('AI学習用データを生成中...', `${AppState.selectedThemeDetails.length}個のテーマを処理中...`);
        
        // テーマサマリー生成を並列処理で高速化
        AppState.themeSummaries = {};
        const summaryPromises = AppState.selectedThemeDetails.map(async (theme, index) => {
            updateAnalysisProgress(
                'AI学習用データを生成中...', 
                `テーマ ${index + 1}/${AppState.selectedThemeDetails.length}: ${theme.title}`
            );
            const summary = await generateThemeSummary(theme, AppState.documentContext);
            return { title: theme.title, summary };
        });
        
        const summaryResults = await Promise.all(summaryPromises);
        summaryResults.forEach(({ title, summary }) => {
            AppState.themeSummaries[title] = summary;
        });
        
        updateAnalysisProgress('処理完了！', 'テーマの準備が整いました');
        
        // 完了時にはボタンを中止から閉じるに変更
        const themeModalCloseBtn = FileProcessingInterface.getDOMElement('themeModalCloseBtn');
        if (themeModalCloseBtn) {
            themeModalCloseBtn.textContent = '✕ 閉じる';
        }
        
        console.log('✅ テーマ選択と学習準備完了');
        
        // 少し間を置いてからモーダルを閉じる
        setTimeout(() => {
            closeThemeSelection();
        }, 1000);
        
    } catch (error) {
        console.error('❌ テーマサマリー生成エラー:', error);
        updateAnalysisProgress('エラーが発生しました', '基本的な処理で続行します...');
        
        // エラー時にもボタンを閉じるに変更
        const themeModalCloseBtn = FileProcessingInterface.getDOMElement('themeModalCloseBtn');
        if (themeModalCloseBtn) {
            themeModalCloseBtn.textContent = '✕ 閉じる';
        }
        
        // エラーがあっても基本情報は設定
        setTimeout(() => {
            closeThemeSelection();
        }, 2000);
    }
}

async function generateThemeSummary(theme, documentContent) {
    const apiKey = FileProcessingInterface.getAPIKey();
    if (!apiKey) return '';
    
    try {
        // テーマが長い場合は短縮版プロンプトを使用
        const isLongTheme = theme.title.length > 50 || (theme.description && theme.description.length > 100);
        
        const prompt = isLongTheme ? 
            `テーマ「${theme.title}」について、文書から500文字程度の簡潔な要約を生成してください。深掘りインタビューに必要な核心的ポイントのみを含めてください。

文書内容:
${documentContent.substring(0, 2000)}...` :
            window.AI_PROMPTS?.THEME_SUMMARY ? 
                window.AI_PROMPTS.THEME_SUMMARY(theme, documentContent) :
                `以下のテーマについて、文書内容を参考に詳細な要約を生成してください（1000文字程度）：
                
テーマ: ${theme.title}
説明: ${theme.description}

文書内容:
${documentContent}

深掘りインタビューでAIが参考にできるよう、具体的で詳細な情報を含めてください。`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: isLongTheme ? 800 : 1500, // 長いテーマは短く
                temperature: 0.5 // より簡潔に
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.choices[0].message.content;
        }
    } catch (error) {
        console.error('テーマサマリー生成エラー:', error);
    }
    
    return `${theme.title}: ${theme.description}`;
}

// 中止ボタン: テーマ選択をキャンセル
function cancelThemeSelection() {
    // ユーザーに確認を求める
    if (typeof AppState !== 'undefined' && AppState.selectedThemes && AppState.selectedThemes.length > 0) {
        const isConfirmed = confirm('選択したテーマがクリアされます。本当に中止しますか？');
        if (!isConfirmed) {
            return;
        }
    }
    
    // 選択状態をクリア
    if (typeof AppState !== 'undefined') {
        AppState.selectedThemes = [];
        AppState.selectedThemeDetails = [];
        AppState.currentTheme = '';
    }
    
    // テーマ入力欄をクリア
    const themeInput = FileProcessingInterface.getDOMElement('themeInput');
    if (themeInput) {
        themeInput.value = '';
        if (typeof saveThemeInputState !== 'undefined') {
            saveThemeInputState('');
        }
        if (typeof update2StepUI !== 'undefined') {
            update2StepUI();
        }
    }
    
    // モーダルを閉じる
    closeThemeSelection();
    
    console.log('✅ テーマ選択を中止しました');
}

function closeThemeSelection() {
    const modal = FileProcessingInterface.getDOMElement('themeSelectionModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// =================================================================================
// EXPORTS - エクスポート
// =================================================================================

// グローバル名前空間に公開
window.FukaboriFileProcessing = {
    // ファイル処理
    checkLoginBeforeFileSelect,
    triggerFileInput,
    handleThemeFile,
    updateFileInputDisplay,
    
    // エラー処理
    showFileErrorModal,
    closeFileErrorModal,
    returnToLoginFromError,
    
    // ファイル分析
    analyzeFileWithGPT,
    extractFileContent,
    extractThemesWithGPT,
    handleTraditionalFileProcessing,
    
    // テーマ選択UI
    showThemeAnalysisModal,
    updateAnalysisProgress,
    displayThemeSelection,
    createThemeItem,
    toggleThemeSelection,
    selectAllThemes,
    deselectAllThemes,
    updateSelectedCount,
    scrollToConfirmation,
    confirmThemeSelection,
    generateThemeSummary,
    cancelThemeSelection,
    closeThemeSelection,
    
    // ファイル形式別処理
    extractExcelContent,
    extractPDFContent,
    extractWordContent,
    extractPowerPointContent
};

// 既存の関数名でもアクセス可能にする（後方互換性）
window.checkLoginBeforeFileSelect = checkLoginBeforeFileSelect;
window.triggerFileInput = triggerFileInput;
window.handleThemeFile = handleThemeFile;
window.updateFileInputDisplay = updateFileInputDisplay;
window.showFileErrorModal = showFileErrorModal;
window.closeFileErrorModal = closeFileErrorModal;
window.returnToLoginFromError = returnToLoginFromError;
window.analyzeFileWithGPT = analyzeFileWithGPT;
window.extractFileContent = extractFileContent;
window.extractThemesWithGPT = extractThemesWithGPT;
window.handleTraditionalFileProcessing = handleTraditionalFileProcessing;
window.showThemeAnalysisModal = showThemeAnalysisModal;
window.updateAnalysisProgress = updateAnalysisProgress;
window.displayThemeSelection = displayThemeSelection;
window.createThemeItem = createThemeItem;
window.toggleThemeSelection = toggleThemeSelection;
window.selectAllThemes = selectAllThemes;
window.deselectAllThemes = deselectAllThemes;
window.updateSelectedCount = updateSelectedCount;
window.scrollToConfirmation = scrollToConfirmation;
window.confirmThemeSelection = confirmThemeSelection;
window.generateThemeSummary = generateThemeSummary;
window.cancelThemeSelection = cancelThemeSelection;
window.closeThemeSelection = closeThemeSelection;
window.extractExcelContent = extractExcelContent;
window.extractPDFContent = extractPDFContent;
window.extractWordContent = extractWordContent;
window.extractPowerPointContent = extractPowerPointContent; 