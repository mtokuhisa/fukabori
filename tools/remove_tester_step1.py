#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Phase C-1-3 Step 1: ContinuousRecognitionTester削除スクリプト
行範囲指定による正確な削除
"""

import sys

def remove_continuous_recognition_tester(input_file, output_file):
    """ContinuousRecognitionTesterとその関連コードを削除"""
    
    print("🔥 Phase C-1-3 Step 1: ContinuousRecognitionTester削除開始")
    print("削除対象: ContinuousRecognitionTester class + 関連関数群")
    print()
    
    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    total_lines = len(lines)
    
    # 削除範囲の特定
    # ContinuousRecognitionTester class: 行6644-6961
    # 関連テスト関数: 行6981-7027
    delete_ranges = [
        (6644, 6961),  # ContinuousRecognitionTester class
        (6981, 7027),  # checkSessionStatus〜ultraQuickTest
    ]
    
    # 削除対象行をマーク
    lines_to_delete = set()
    for start, end in delete_ranges:
        for i in range(start-1, min(end, total_lines)):  # 0-indexedに変換
            lines_to_delete.add(i)
    
    print(f"削除範囲: {len(delete_ranges)}個のブロック")
    for i, (start, end) in enumerate(delete_ranges, 1):
        actual_end = min(end, total_lines)
        block_size = actual_end - start + 1
        print(f"  Block {i}: 行{start}-{actual_end} ({block_size}行)")
    
    # 削除実行
    removed_count = 0
    with open(output_file, 'w', encoding='utf-8') as f:
        for i, line in enumerate(lines):
            if i in lines_to_delete:
                removed_count += 1
                print(f"🗑️ 削除: {i+1:4d} - {line.strip()[:80]}...")
            else:
                f.write(line)
    
    remaining_lines = total_lines - removed_count
    
    print()
    print("📊 Phase C-1-3 Step 1完了:")
    print(f"  - 総行数: {total_lines:,}行")
    print(f"  - 削除行数: {removed_count}行")
    print(f"  - 残り行数: {remaining_lines:,}行")
    print(f"  - 削除率: {(removed_count/total_lines)*100:.1f}%")
    print()

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("使用方法: python3 remove_tester_step1.py input_file output_file")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    remove_continuous_recognition_tester(input_file, output_file) 