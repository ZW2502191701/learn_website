#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
JavaPath PDF 解析管线 v2
========================

功能:
  1. 提取 PDF 文字、代码块、图片、元数据
  2. 按知识点单元做粗粒度拆分 (以标题/分页为界)
  3. 面试题自动抽取 (识别 Q&A 模式)
  4. 标注 confidence 分数和 needsReview 状态
  5. 输出 draft 状态的 JSON, 供人工 review 后 publish
  6. 输出 Markdown 便于人工校对

内容流程: draft -> review -> publish
  - draft:    自动解析结果, confidence < 0.8 的标记 needsReview
  - review:   人工校对后改为 review 状态
  - publish:  通过 validate-data.mjs 验证后发布到 web/data/

依赖: pip install pymupdf

用法:
  python parse_pdfs.py
  python parse_pdfs.py --src ../../learn --out ./output
  python parse_pdfs.py --status draft    # 只输出 draft
  python parse_pdfs.py --status review   # 包含 review 状态的
"""

import os
import re
import json
import argparse
import hashlib
import sys
from datetime import datetime, timezone

try:
    import fitz  # PyMuPDF
except ImportError:
    raise SystemExit("请先安装依赖:  pip install pymupdf")


# ── 配置 ────────────────────────────────────────────────────────────

MODULE_MAP = {
    "常见集合篇": {"area": "语言核心", "importance": 96, "id": "collections"},
    "多线程篇":   {"area": "语言核心", "importance": 98, "id": "threads"},
    "JVM虚拟机篇": {"area": "语言核心", "importance": 95, "id": "jvm"},
    "MySQL":      {"area": "数据存储", "importance": 94, "id": "mysql"},
    "Redis":      {"area": "数据存储", "importance": 91, "id": "redis"},
    "SSM框架":    {"area": "框架应用", "importance": 86, "id": "ssm"},
    "消息中间件篇": {"area": "分布式与中间件", "importance": 88, "id": "mq"},
    "微服务篇":   {"area": "分布式与中间件", "importance": 89, "id": "microservice"},
    "设计模式篇": {"area": "工程素养", "importance": 78, "id": "designpattern"},
    "技术场景篇": {"area": "工程素养", "importance": 93, "id": "scenario"},
    "大厂面经(Java方向)": {"area": "求职冲刺", "importance": 97, "id": "interview"},
}

TITLE_HINTS = re.compile(
    r"^(第[一二三四五六七八九十\d]+[章节篇]|[\d]+[\.、]\s*|面试官|问题[:：]|什么是|如何|为什么|原理|底层|区别|总结)"
)

QA_PATTERNS = [
    re.compile(r"(?:问题|Q|面试官?)[:：]\s*(.+)"),
    re.compile(r"(?:答案|A|回答|解析)[:：]\s*(.+)"),
    re.compile(r"^[\d]+[\.、]\s*(.+\?)$"),
    re.compile(r"^[\d]+[\.、]\s*(.+[？\?])$"),
]

CODE_KEYWORDS = re.compile(
    r"\b(public|private|protected|class|interface|void|static|final|new|return|import|"
    r"package|extends|implements|try|catch|synchronized|@Override|System\.out|"
    r"SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)\b|[{};]"
)

HIGH_FREQ_KEYWORDS = [
    "面试高频", "高频", "必问", "重点", "常考", "大厂", "源码",
    "底层", "原理", "区别", "对比", "优缺点"
]


# ── 工具函数 ─────────────────────────────────────────────────────────

def slugify(text: str) -> str:
    base = re.sub(r"[^\w一-鿿]+", "-", text).strip("-").lower()
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


def compute_confidence(text: str, has_title: bool, has_code: bool, page_count: int) -> float:
    """计算解析置信度: 0.0 ~ 1.0"""
    score = 0.5  # 基准分
    if has_title:
        score += 0.2
    if len(text) > 100:
        score += 0.1
    if has_code:
        score += 0.1
    if len(text) > 300:
        score += 0.1
    return min(1.0, round(score, 2))


def detect_frequency(text: str) -> int:
    """检测面试频率: 0-100"""
    for kw in HIGH_FREQ_KEYWORDS:
        if kw in text:
            return 95
    return 70


def extract_qa_pairs(text: str) -> list:
    """从文本中提取面试 Q&A 对"""
    pairs = []
    lines = text.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        for pattern in QA_PATTERNS:
            m = pattern.match(line)
            if m:
                question = m.group(1).strip()
                # 收集答案: 下一行到下一个问题或空行
                answer_lines = []
                j = i + 1
                while j < len(lines):
                    next_line = lines[j].strip()
                    if not next_line:
                        break
                    if any(p.match(next_line) for p in QA_PATTERNS):
                        break
                    answer_lines.append(next_line)
                    j += 1
                answer = " ".join(answer_lines)
                if question and len(question) > 5:
                    pairs.append({"question": question, "answer": answer})
                i = j
                break
        i += 1
    return pairs


def new_unit(chapter: str, module: str, title: str, page_number: int, source_pdf: str):
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
        "sourcePdf": source_pdf,
        "pageNumber": page_number,
        "confidence": 0.5,
        "needsReview": True,
        "status": "draft",
        "parsedAt": datetime.now(timezone.utc).isoformat(),
    }


# ── 主解析函数 ───────────────────────────────────────────────────────

def parse_pdf(path: str, assets_dir: str):
    """解析单个 PDF, 返回 (units, markdown, metadata)。"""
    doc = fitz.open(path)
    stem = os.path.splitext(os.path.basename(path))[0]
    meta = MODULE_MAP.get(stem, {"area": "其他", "importance": 50, "id": slugify(stem)})

    units = []
    md_parts = [f"# {stem}\n\n> 模块: {meta['area']}  ·  共 {doc.page_count} 页\n"]
    img_count = 0
    current = None
    word_count = 0

    def flush():
        nonlocal current
        if current:
            current["confidence"] = compute_confidence(
                current["concept_md"],
                bool(current["title"] and current["title"] != f"{stem} 片段"),
                bool(current["code_samples"]),
                doc.page_count
            )
            current["needsReview"] = current["confidence"] < 0.8
            if current["concept_md"].strip() or current["code_samples"] or current["interview_qa"]:
                units.append(current)
        current = None

    for pno in range(doc.page_count):
        page = doc[pno]

        for block in page.get_text("blocks"):
            text = (block[4] or "").strip()
            if not text:
                continue

            word_count += len(text)

            # 尝试提取 Q&A
            qa_pairs = extract_qa_pairs(text)
            if qa_pairs and current:
                current["interview_qa"].extend(qa_pairs)

            if looks_like_code(text):
                if current is None:
                    current = new_unit(stem, meta["area"], f"{stem} 片段", pno, os.path.basename(path))
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
                    current = new_unit(stem, meta["area"], first_line, pno, os.path.basename(path))

                    # 自动打标签
                    tags = []
                    for kw in HIGH_FREQ_KEYWORDS:
                        if kw in text:
                            tags.append("面试高频")
                            break
                    current["tags"] = tags

                    md_parts.append(f"\n## {first_line}\n")
                    rest = "\n".join(text.splitlines()[1:]).strip()
                    if rest:
                        current["concept_md"] += rest + "\n"
                        md_parts.append(rest + "\n")
                else:
                    if current is None:
                        current = new_unit(stem, meta["area"], f"{stem} 概述", pno, os.path.basename(path))
                    current["concept_md"] += text + "\n"
                    md_parts.append(text + "\n")

        for i, img in enumerate(page.get_images(full=True)):
            xref = img[0]
            try:
                pix = fitz.Pixmap(doc, xref)
                if pix.n - pix.alpha >= 4:
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

    metadata = {
        "filename": os.path.basename(path),
        "title": stem,
        "module": meta["area"],
        "moduleId": meta["id"],
        "importance": meta["importance"],
        "pageCount": doc.page_count if hasattr(doc, 'page_count') else 0,
        "parsedAt": datetime.now(timezone.utc).isoformat(),
        "wordCount": word_count,
        "unitCount": len(units),
        "imageCount": img_count,
        "draftCount": len([u for u in units if u["status"] == "draft"]),
        "reviewCount": len([u for u in units if u["status"] == "review"]),
        "needsReviewCount": len([u for u in units if u["needsReview"]]),
    }

    return units, "\n".join(md_parts), metadata


# ── 主程序 ───────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser(description="JavaPath PDF 解析管线 v2")
    ap.add_argument("--src", default=r"C:\AI_Test\learn", help="PDF 所在目录")
    ap.add_argument("--out", default=r"C:\AI_Test\javapath\output", help="输出目录")
    ap.add_argument("--status", default="draft", choices=["draft", "review", "published"],
                    help="输出内容的状态过滤")
    args = ap.parse_args()

    assets_dir = os.path.join(args.out, "assets")
    md_dir = os.path.join(args.out, "markdown")
    os.makedirs(assets_dir, exist_ok=True)
    os.makedirs(md_dir, exist_ok=True)

    all_units = []
    all_metadata = []
    summary = []

    pdfs = sorted(f for f in os.listdir(args.src) if f.lower().endswith(".pdf"))
    if not pdfs:
        raise SystemExit(f"在 {args.src} 未找到 PDF 文件")

    for fn in pdfs:
        path = os.path.join(args.src, fn)
        print(f"解析中: {fn} ...")
        units, md, metadata = parse_pdf(path, assets_dir)
        all_units.extend(units)
        all_metadata.append(metadata)

        stem = os.path.splitext(fn)[0]
        with open(os.path.join(md_dir, stem + ".md"), "w", encoding="utf-8") as f:
            f.write(md)

        summary.append(metadata)
        review_pct = f"{metadata['needsReviewCount']}/{metadata['unitCount']}" if metadata['unitCount'] else "0"
        print(f"  -> {metadata['unitCount']} 个知识点, {metadata['imageCount']} 张图, {review_pct} 需审核")

    # 输出: 标准 JSON
    output = {
        "version": 2,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "status": args.status,
        "units": all_units,
        "metadata": all_metadata,
    }

    with open(os.path.join(args.out, "knowledge.json"), "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    with open(os.path.join(args.out, "summary.json"), "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)

    # 输出: JSONP
    js_path = os.path.join(args.out, "knowledge.js")
    with open(js_path, "w", encoding="utf-8") as f:
        f.write("/* 由 parse_pdfs.py v2 自动生成, 请勿手动编辑 */\n")
        f.write("window.KNOWLEDGE_DATA = ")
        json.dump(output, f, ensure_ascii=False, indent=2)
        f.write(";\n")

    # 统计报告
    total = len(all_units)
    drafts = len([u for u in all_units if u["status"] == "draft"])
    needs_review = len([u for u in all_units if u["needsReview"]])

    print(f"\n{'='*50}")
    print(f"解析完成")
    print(f"  PDF 数量:    {len(pdfs)}")
    print(f"  知识点总数:  {total}")
    print(f"  Draft:       {drafts}")
    print(f"  需审核:      {needs_review}")
    print(f"  JSON:        {os.path.join(args.out, 'knowledge.json')}")
    print(f"  Markdown:    {md_dir}")
    print(f"  图片:        {assets_dir}")
    print(f"\n下一步:")
    print(f"  1. 人工校对 markdown/ 目录下的文件")
    print(f"  2. 将校对后的内容导入 web/data/")
    print(f"  3. 运行 npm run validate:data 验证")
    print(f"  4. 运行 npm run build 构建")


if __name__ == "__main__":
    main()
