import logfire
from pypdf import PdfReader


def parse_pdf(file_path: str) -> str:
    """
    Extract text from a PDF locally with robust multi-engine fallback:
    1. Primary: pypdf (fast and light)
    2. Secondary: pdfplumber (handles tables and complex text blocks)
    3. Tertiary: pypdfium2 (handles low-level PDF stream extraction)
    """
    with logfire.span("PDF Parsing (local)", filename=file_path):
        text_parts: list[str] = []

        # 1. Primary extraction with pypdf
        try:
            reader = PdfReader(file_path)
            total_pages = len(reader.pages)
            logfire.info(f"PDF has {total_pages} pages (via pypdf).")

            blank_pages: list[int] = []
            for i, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                if len(page_text.strip()) > 10:
                    text_parts.append(f"--- Page {i + 1} ---\n{page_text.strip()}")
                else:
                    blank_pages.append(i + 1)

            # If some pages yielded no text, attempt pdfplumber on those pages
            if blank_pages:
                logfire.info(f"Pages {blank_pages} had low text. Attempting pdfplumber fallback.")
                try:
                    import pdfplumber
                    with pdfplumber.open(file_path) as pdf:
                        for page_num in blank_pages:
                            if page_num <= len(pdf.pages):
                                plumber_text = pdf.pages[page_num - 1].extract_text() or ""
                                if len(plumber_text.strip()) > 10:
                                    text_parts.append(f"--- Page {page_num} ---\n{plumber_text.strip()}")
                except Exception as plumber_err:
                    logfire.warning(f"pdfplumber fallback error: {plumber_err}")

        except Exception as pypdf_err:
            logfire.warning(f"pypdf extraction failed or crashed: {pypdf_err}. Trying pdfplumber entirely.")

        # 2. If text_parts is still empty, try full pdfplumber extraction
        if not text_parts or sum(len(t) for t in text_parts) < 30:
            logfire.info("Retrying full PDF parsing with pdfplumber.")
            try:
                import pdfplumber
                text_parts = []
                with pdfplumber.open(file_path) as pdf:
                    for i, page in enumerate(pdf.pages):
                        page_text = page.extract_text() or ""
                        if page_text.strip():
                            text_parts.append(f"--- Page {i + 1} ---\n{page_text.strip()}")
            except Exception as plumber_err:
                logfire.warning(f"Full pdfplumber parsing failed: {plumber_err}")

        # 3. Tertiary fallback: pypdfium2 (extracts text directly from PDFium engine)
        if not text_parts or sum(len(t) for t in text_parts) < 30:
            logfire.info("Retrying PDF parsing with pypdfium2 engine.")
            try:
                import pypdfium2 as pdfium
                pdf = pdfium.PdfDocument(file_path)
                text_parts = []
                for i, page in enumerate(pdf):
                    textpage = page.get_textpage()
                    page_text = textpage.get_text_range() or ""
                    if page_text.strip():
                        text_parts.append(f"--- Page {i + 1} ---\n{page_text.strip()}")
            except Exception as pdfium_err:
                logfire.warning(f"pypdfium2 parsing failed: {pdfium_err}")

        full_text = "\n\n".join(text_parts).strip()

        if not full_text:
            logfire.warning(f"No text extracted from {file_path}. File may be scanned image-only.")
        else:
            logfire.info(f"Successfully extracted {len(full_text)} characters from {file_path}.")

        return full_text
