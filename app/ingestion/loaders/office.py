import os
import logfire

def parse_docx(file_path: str) -> str:
    """Extract text and tables from Word (.docx) documents."""
    import docx
    doc = docx.Document(file_path)
    text_parts: list[str] = []

    for p in doc.paragraphs:
        t = p.text.strip()
        if t:
            text_parts.append(t)

    for tbl_idx, table in enumerate(doc.tables, 1):
        tbl_lines = []
        for row in table.rows:
            cells = [cell.text.strip().replace("\n", " ") for cell in row.cells if cell.text.strip()]
            if cells:
                tbl_lines.append(" | ".join(cells))
        if tbl_lines:
            text_parts.append(f"\n[Table {tbl_idx}]\n" + "\n".join(tbl_lines))

    return "\n\n".join(text_parts)


def parse_pptx(file_path: str) -> str:
    """Extract text, shapes, and tables from PowerPoint (.pptx) presentations."""
    import pptx
    prs = pptx.Presentation(file_path)
    slide_parts: list[str] = []

    for idx, slide in enumerate(prs.slides, 1):
        elements: list[str] = []

        # Extract title shape if present
        if slide.shapes.title and slide.shapes.title.text.strip():
            elements.append(f"Title: {slide.shapes.title.text.strip()}")

        for shape in slide.shapes:
            # Avoid repeating title
            if shape == slide.shapes.title:
                continue

            if shape.has_text_frame:
                for p in shape.text_frame.paragraphs:
                    t = p.text.strip()
                    if t:
                        elements.append(t)

            if shape.has_table:
                for row in shape.table.rows:
                    row_cells = [c.text.strip().replace("\n", " ") for c in row.cells if c.text.strip()]
                    if row_cells:
                        elements.append(" | ".join(row_cells))

        if elements:
            slide_parts.append(f"--- Slide {idx} ---\n" + "\n".join(elements))

    return "\n\n".join(slide_parts)


def parse_office(file_path: str) -> str:
    """
    Parses Office documents (.docx, .doc, .pptx, .ppt) with multi-tier extraction:
    1. Direct native parsing via python-docx / python-pptx (fast, high fidelity)
    2. Fallback to Unstructured library
    3. Graceful binary string extraction for legacy .doc/.ppt if external converters are absent
    """
    ext = file_path.lower().rsplit(".", 1)[-1] if "." in file_path else ""

    with logfire.span("Office Document Parsing", filename=file_path, extension=ext):
        # 1. Native Python parser attempts
        if ext == "docx":
            try:
                res = parse_docx(file_path)
                if res and len(res.strip()) > 10:
                    logfire.info(f"Successfully parsed .docx via python-docx ({len(res)} chars)")
                    return res
            except Exception as e:
                logfire.warning(f"python-docx parsing failed, falling back to unstructured: {e}")

        elif ext == "pptx":
            try:
                res = parse_pptx(file_path)
                if res and len(res.strip()) > 10:
                    logfire.info(f"Successfully parsed .pptx via python-pptx ({len(res)} chars)")
                    return res
            except Exception as e:
                logfire.warning(f"python-pptx parsing failed, falling back to unstructured: {e}")

        # 2. Unstructured fallback for .docx, .pptx, .doc, .ppt
        try:
            from unstructured.partition.auto import partition
            elements = partition(filename=file_path)
            full_text = "\n".join([str(el) for el in elements if str(el).strip()])
            if full_text.strip():
                logfire.info(f"Successfully parsed Office file via unstructured ({len(full_text)} chars)")
                return full_text
        except Exception as e:
            logfire.warning(f"Unstructured parsing failed for {file_path}: {e}")

        # 3. Fallback for legacy binary formats (.doc, .ppt) or corrupted containers
        try:
            with open(file_path, "rb") as f:
                raw_bytes = f.read()
            # Extract printable ASCII/UTF-8 strings of 4+ characters
            import re
            extracted_words = re.findall(rb"[\x20-\x7E]{4,}", raw_bytes)
            decoded_text = "\n".join([w.decode("latin-1", errors="ignore") for w in extracted_words])
            if len(decoded_text.strip()) > 20:
                logfire.info(f"Extracted {len(decoded_text)} chars via binary stream fallback")
                return decoded_text
        except Exception as e:
            logfire.error(f"Binary stream fallback failed: {e}")

        raise ValueError(f"Could not extract readable text from Office document: {os.path.basename(file_path)}")

