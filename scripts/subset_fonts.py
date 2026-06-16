"""
明朝 web フォントのサブセット化スクリプト（開発時に手動実行・ビルドには含めない）。

目的:
  見出し・ロゴ用の明朝 (Zen Old Mincho Medium) を「サイトで実際に使う文字」だけに絞り、
  数 MB の TTF → 数十 KB の woff2 に落としてセルフホストする。本文はシステムフォントのまま。

前提（初回のみ）:
  pip install --user fonttools brotli

使い方:
  cd vtuber-hp
  python scripts/subset_fonts.py

  → public/fonts/zen-old-mincho-medium.subset.woff2 を生成。

将来、見出しに新しい漢字を増やしたとき:
  下の HEADINGS に文字列を足して、もう一度このスクリプトを実行するだけ。
  （収録されていない漢字はシステム明朝で表示される＝表示自体は崩れない）

ライセンス: Zen Old Mincho は SIL OFL 1.1。OFL.txt を public/fonts/ に同梱している。
"""

from __future__ import annotations

import os
import shutil
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

# --- パス設定（このファイルの位置を基準に解決） ---
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)
# フォント素材庫はリポジトリの外（共有の D:\クロード作業用\fonts）。リポジトリ基準の相対で指す。
FONT_SRC = os.path.normpath(
    os.path.join(REPO_ROOT, "..", "fonts", "zenoldmincho", "ZenOldMincho-Medium.ttf")
)
OUT_DIR = os.path.join(REPO_ROOT, "public", "fonts")
OUT_FILE = os.path.join(OUT_DIR, "zen-old-mincho-medium.subset.woff2")

# --- 欧文ロゴ用 Cinzel（可変フォント。ローマ字ロゴ・英字ディスプレイ専用） ---
# 可変の wght 軸を 500 で固定インスタンス化してから、基本ラテンだけを subset する。
CINZEL_SRC = os.path.normpath(os.path.join(REPO_ROOT, "..", "fonts", "cinzel", "Cinzel_wght_.ttf"))
CINZEL_OFL_SRC = os.path.normpath(os.path.join(REPO_ROOT, "..", "fonts", "cinzel", "OFL.txt"))
CINZEL_OUT_FILE = os.path.join(OUT_DIR, "cinzel-500.subset.woff2")
CINZEL_OFL_OUT = os.path.join(OUT_DIR, "Cinzel-OFL.txt")
CINZEL_WEIGHT = 500

# --- 和文見出し候補 しっぽり明朝（Medium。耽美寄りの明朝。Zen Old Mincho と見比べる用） ---
SHIPPORI_SRC = os.path.normpath(
    os.path.join(REPO_ROOT, "..", "fonts", "shipporimincho", "ShipporiMincho-Medium.ttf")
)
SHIPPORI_OFL_SRC = os.path.normpath(
    os.path.join(REPO_ROOT, "..", "fonts", "shipporimincho", "OFL.txt")
)
SHIPPORI_OUT_FILE = os.path.join(OUT_DIR, "shippori-mincho-medium.subset.woff2")
SHIPPORI_OFL_OUT = os.path.join(OUT_DIR, "ShipporiMincho-OFL.txt")

# --- 収録する文字 ---------------------------------------------------------
# サイトで明朝表示される全テキスト（ブランド名＋各ページの見出し h1/h2/h3）。
# 新しい見出しを足したらここに追記して再実行する。
HEADINGS = [
    "和香松庵",                       # ロゴ・氏名（ヘッダー/ヒーロー）
    "WAKAMATSU IORI",                 # ローマ字ロゴ（ヒーローのアクセント）
    "About", "プロフィール", "世界観・設定", "リンク",
    "グッズ",
    "ガイドライン", "二次創作・ファンアート", "切り抜き動画",
    "次の配信", "最新動画",
    "プライバシーポリシー", "取得する情報", "外部サービスへのリンク",
    "スケジュール",
    "動画",
    "お仕事のご依頼", "お受けできる内容", "ご連絡方法",
    # スケジュールの日付ラベル "6/15（月）" 用の素材
    "0123456789／（）・ー〜：…、。「」『』！？　",
    "日月火水木金土",                  # 曜日漢字
]

# かな・英数・主要約物は範囲でまとめて収録（将来のかな見出しに強い／コストは小さい）。
# ※フォントに存在しない符号位置は自動で無視されるので、広めに指定して安全。
# 全角英数(0xFF01-)は使う約物だけ HEADINGS に入れて範囲では取らない（冗長グリフ削減）。
UNICODE_RANGES = [
    (0x0020, 0x007E),   # 基本ラテン（英数・記号）
    (0x2010, 0x2027),   # ハイフン・ダッシュ・各種引用符・…
    (0x3000, 0x303F),   # 全角スペース・、。「」『』・ー 〜 等の和文約物
    (0x3040, 0x309F),   # ひらがな（全域）
    (0x30A0, 0x30FF),   # カタカナ（全域）
]


def build_unicodes() -> set[int]:
    codes: set[int] = set()
    for line in HEADINGS:
        for ch in line:
            codes.add(ord(ch))
    for start, end in UNICODE_RANGES:
        codes.update(range(start, end + 1))
    return codes


def _make_options() -> subset.Options:
    """両フォント共通のサブセット設定（横書きの見出し/ロゴ専用）。"""
    options = subset.Options()
    options.flavor = "woff2"          # 圧縮率の高い woff2 で出力
    options.desubroutinize = True     # サイズ最適化
    options.hinting = False           # ヒンティング除去（Web表示はAAで十分・容量削減）
    # 横書きの見出し/ロゴ専用なので、縦書き用(vert/vrt2)やJIS異体字など
    # レイアウト機能経由で増える代替グリフは取り込まない（サイズを大きく削減）。
    options.layout_features = []
    options.name_IDs = ["*"]          # ライセンス/名称の name レコードは残す（OFL配慮）
    options.notdef_outline = True
    options.recalc_timestamp = False
    return options


def _subset_and_save(font: TTFont, unicodes: set[int], out_file: str, src_path: str) -> None:
    options = _make_options()
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(unicodes=unicodes)
    subsetter.subset(font)
    # font.save() は options.flavor を見ないので、ここで明示する（woff2=Brotli圧縮）。
    font.flavor = options.flavor
    font.save(out_file)

    src_kb = os.path.getsize(src_path) / 1024
    out_kb = os.path.getsize(out_file) / 1024
    n_glyphs = len(font.getGlyphOrder())
    print(f"元: {src_path}  ({src_kb:,.0f} KB)")
    print(f"出力: {out_file}")
    print(f"  グリフ数: {n_glyphs} / サイズ: {out_kb:,.1f} KB")


def build_zen() -> None:
    """見出し・和文ロゴ用の Zen Old Mincho を、使う文字だけに絞って出力。"""
    if not os.path.exists(FONT_SRC):
        raise SystemExit(f"元フォントが見つかりません: {FONT_SRC}")
    font = TTFont(FONT_SRC)
    _subset_and_save(font, build_unicodes(), OUT_FILE, FONT_SRC)


def build_cinzel() -> None:
    """欧文ロゴ用の Cinzel（可変）を wght=500 で固定し、基本ラテンだけ収録して出力。"""
    if not os.path.exists(CINZEL_SRC):
        raise SystemExit(f"Cinzel 元フォントが見つかりません: {CINZEL_SRC}")
    font = TTFont(CINZEL_SRC)
    # 可変フォント → 単一ウェイトの静的インスタンスへ（容量・互換性のため）。
    instantiateVariableFont(font, {"wght": CINZEL_WEIGHT}, inplace=True)
    # 英字ディスプレイ用途なので基本ラテン(0x20–0x7E)＝英数・スペース・主要記号のみ。
    cinzel_unicodes = set(range(0x0020, 0x007E + 1))
    _subset_and_save(font, cinzel_unicodes, CINZEL_OUT_FILE, CINZEL_SRC)
    # OFL ライセンスを public/fonts に同梱（SIL OFL 1.1 配慮）。
    if os.path.exists(CINZEL_OFL_SRC):
        shutil.copyfile(CINZEL_OFL_SRC, CINZEL_OFL_OUT)
        print(f"  ライセンス: {CINZEL_OFL_OUT}")
    else:
        print(f"  ⚠ OFL が見つかりません（手動で同梱してください）: {CINZEL_OFL_SRC}")


def build_shippori() -> None:
    """和文見出し候補の しっぽり明朝 Medium を、使う文字だけに絞って出力。"""
    if not os.path.exists(SHIPPORI_SRC):
        raise SystemExit(f"しっぽり明朝 元フォントが見つかりません: {SHIPPORI_SRC}")
    font = TTFont(SHIPPORI_SRC)
    _subset_and_save(font, build_unicodes(), SHIPPORI_OUT_FILE, SHIPPORI_SRC)
    if os.path.exists(SHIPPORI_OFL_SRC):
        shutil.copyfile(SHIPPORI_OFL_SRC, SHIPPORI_OFL_OUT)
        print(f"  ライセンス: {SHIPPORI_OFL_OUT}")
    else:
        print(f"  ⚠ OFL が見つかりません（手動で同梱してください）: {SHIPPORI_OFL_SRC}")


def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    build_zen()
    build_cinzel()
    build_shippori()


if __name__ == "__main__":
    main()
