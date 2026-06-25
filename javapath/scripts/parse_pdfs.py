#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批量解析 C:\\AI_Test\\learn 下的 11 份 Java 学习 PDF。

功能:
  1. 提取每份 PDF 的文字、代码块、图片
  2. 按"知识点单元"做粗粒度拆分(以标题/分页为界)
  3. 输出统一的 JSON (供网站前端渲染) + 每篇一个 Markdown(便于人工校对)
  4. 图片导出到 assets/ 目录

依赖(在本机执行):
  pip install pymupdf

用法(默认即可):
  python parse_pdfs.py
  python parse_pdfs.py --src "C:\\AI_Test\\learn" --out "C:\\AI_Test\\javapath\\output"
"""

import os
import re
import json
import argparse
import hashlib

try:
    import fitz  # PyMuPDF
except ImportError:
    raise SystemExit("请先安装依赖:  pip install pymupdf")


# 文件名(去扩展名) -> 模块归类(对应学习网站的 6 大模块)
MODULE_MAP = {
    "常见集合篇": "语言核心",
    "多线程篇": "语言核心",
    "JVM虚拟机篇": "语言核心",
    "MySQL": "数据存储",
    "Redis": "数据存储",
    "SSM框架": "框架应用",
    "消息中间件篇": "分布式与中间件",
    "微服务篇": "分布式与中间件",
    "设计模式篇": "工程素养",
    "技术场景篇": "工程素养",
    "大厂面经(Java方向)": "求职冲刺",
}

# 识别"标题"的启发式: 短行 + 常见标题关键字 / 序号
TITLE_HINTS = re.compile(
    r"^(第[一二三四五六七八九十\d]+[章节篇]|[\d]+[\.、]\s*|面试官|问题[:：]|什么是|如何|为什么|原理|底层|区别|总结)"
)

# 识别代码块的启发式: 含分号/花括号/常见关键字密度高的连续行
CODE_KEYWORDS = re.compile(
    r"\b(public|private|protected|class|interface|void|static|final|new|return|import|"
    r"package|extends|implements|try|catch|synchronized|@Override|System\.out|"
    r"SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)\b|[{};]"
)


def slugify(text: str) -> str:
    base = re.sub(r"[^\w\u4e00-\u9fff]+", "-", text).strip("-").lower()
    if not base:
        base = "x"
    h = hashlib.md5(text.encode("utf-8")).hexdigest()[:6]
    return f"{base[:40]}-{h}"


def looks_like_code(block_text: str) -> bool:
    lines = [l for l in block_text.splitlines() if l.strip()]
    if not lines:
        return False
    hits = sum(1 for l in lines if CODE_KEYWORDS.search(l))
    return hits / len(lines) >= 0.4 and len(lines) >= 2


def guess_lang(filename: str, code: str) -> str:
    if re.search(r"\b(SELECT|INSERT|UPDATE|DELETE|CREATE TABLE)\b", code, re.I):
        return "sql"
    if "Redis" in filename or re.search(r"\b(SET|GET|HSET|LPUSH|EXPIRE)\b", code):
        return "redis"
    return "java"


def new_unit(chapter, module, title):
    return {
        "id": slugify(f"{chapter}-{title}"),
        "module": module,
        "chapter": chapter,
        "title": title,
        "concept_md": "",
        "code_samples": [],
        "interview_qa": [],
        "images": [],
        "tags": [],
    }


def parse_pdf(path: str, assets_dir: str):
    """解析单个 PDF, 返回 (units, markdown, image_count)。"""
    doc = fitz.open(path)
    stem = os.path.splitext(os.path.basename(path))[0]
    module = MODULE_MAP.get(stem, "其他")

    units = []
    md_parts = [f"# {stem}\n\n> 模块: {module}  ·  共 {doc.page_count} 页\n"]
    img_count = 0
    current = None

    def flush():
        nonlocal current
        if current and (current["concept_md"].strip() or current["code_samples"]):
            units.append(current)
        current = None

    for pno in range(doc.page_count):
        page = doc[pno]

        # ---- 文本块 ----
        for block in page.get_text("blocks"):
            text = (block[4] or "").strip()
            if not text:
                continue
            if looks_like_code(text):
                if current is None:
                    current = new_unit(stem, module, f"{stem} 片段")
                lang = guess_lang(stem, text)
                current["code_samples"].append({
                    "lang": lang,
                    "runnable": lang == "java",
                    "code": text,
                })
                md_parts.append(f"\n```{lang}\n{text}\n```\n")
            else:
                first_line = text.splitlines()[0].strip()
                if len(first_line) <= 40 and TITLE_HINTS.search(first_line):
                    flush()
                    current = new_unit(stem, module, first_line)
                    md_parts.append(f"\n## {first_line}\n")
                    rest = "\n".join(text.splitlines()[1:]).strip()
                    if rest:
                        current["concept_md"] += rest + "\n"
                        md_parts.append(rest + "\n")
                else:
                    if current is None:
                        current = new_unit(stem, module, f"{stem} 概述")
                    current["concept_md"] += text + "\n"
                    md_parts.append(text + "\n")

        # ---- 图片 ----
        for i, img in enumerate(page.get_images(full=True)):
            xref = img[0]
            try:
                pix = fitz.Pixmap(doc, xref)
                if pix.n - pix.alpha >= 4:  # CMYK -> RGB
                    pix = fitz.Pixmap(fitz.csRGB, pix)
                fn = f"{slugify(stem)}-p{pno}-{i}.png"
                pix.save(os.path.join(assets_dir, fn))
                img_count += 1
                if current is not None:
                    current["images"].append(f"assets/{fn}")
                md_parts.append(f"\n![{stem} 图]({'assets/'+fn})\n")
            except Exception:
                pass

    flush()
    doc.close()
    return units, "\n".join(md_parts), img_count


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default=r"C:\AI_Test\learn", help="PDF 所在目录")
    ap.add_argument("--out", default=r"C:\AI_Test\javapath\output", help="输出目录")
    args = ap.parse_args()

    assets_dir = os.path.join(args.out, "assets")
    md_dir = os.path.join(args.out, "markdown")
    os.makedirs(assets_dir, exist_ok=True)
    os.makedirs(md_dir, exist_ok=True)

    all_units = []
    summary = []

    pdfs = sorted(f for f in os.listdir(args.src) if f.lower().endswith(".pdf"))
    if not pdfs:
        raise SystemExit(f"在 {args.src} 未找到 PDF 文件")

    for fn in pdfs:
        path = os.path.join(args.src, fn)
        print(f"解析中: {fn} ...")
        units, md, img_count = parse_pdf(path, assets_dir)
        all_units.extend(units)

        stem = os.path.splitext(fn)[0]
        with open(os.path.join(md_dir, stem + ".md"), "w", encoding="utf-8") as f:
            f.write(md)

        summary.append({
            "file": fn,
            "module": MODULE_MAP.get(stem, "其他"),
            "units": len(units),
            "images": img_count,
        })
        print(f"  -> {len(units)} 个知识点单元, {img_count} 张图片")

    # 1) 标准 JSON（程序/接口消费）
    with open(os.path.join(args.out, "knowledge.json"), "w", encoding="utf-8") as f:
        json.dump({"units": all_units}, f, ensure_ascii=False, indent=2)

    with open(os.path.join(args.out, "summary.json"), "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)

    # 2) JSONP 形式的 knowledge.js（关键！）
    #    浏览器用 file:// 直接双击打开 index.html 时, fetch 受 CORS 限制无法读
    #    本地 .json 文件。改为输出一个把数据挂到 window 的 .js, 用 <script> 引入即可,
    #    从而实现"双击 index.html 就能看到全部 11 个章节"的全自动效果。
    js_path = os.path.join(args.out, "knowledge.js")
    with open(js_path, "w", encoding="utf-8") as f:
        f.write("/* 由 parse_pdfs.py 自动生成, 请勿手动编辑 */\n")
        f.write("window.KNOWLEDGE_DATA = ")
        json.dump({"units": all_units}, f, ensure_ascii=False, indent=2)
        f.write(";\n")
    print(f"JSONP:    {js_path}")

    print("\n========== 完成 ==========")
    print(f"知识点单元总数: {len(all_units)}")
    print(f"JSON:     {os.path.join(args.out, 'knowledge.json')}")
    print(f"Markdown: {md_dir}")
    print(f"图片:     {assets_dir}")
    print("\n提示: 解析为粗粒度自动拆分, 建议人工校对 markdown/ 后再导入网站。")


if __name__ == "__main__":
    main()
