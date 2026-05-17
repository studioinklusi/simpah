import os
try:
    import PyPDF2
except ImportError:
    os.system('pip install PyPDF2')
    import PyPDF2

def read_pdf():
    reader = PyPDF2.PdfReader(r"u:\Project\simpah-rilis v1\docs\Buku Panduan Krenova dan Penjaringan.pdf")
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    print(text)

read_pdf()
