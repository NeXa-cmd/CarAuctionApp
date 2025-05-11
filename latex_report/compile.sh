#!/bin/bash

echo "Compiling LaTeX document with XeLaTeX..."
cd "$(dirname "$0")"

# Clean up any previous compilation artifacts
rm -f main.aux main.log main.out main.toc main.lof main.lot main.bcf main.run.xml

# Full compilation cycle
xelatex -interaction=nonstopmode main.tex
biber main || true  # Run biber if references exist, but continue if it fails
xelatex -interaction=nonstopmode main.tex
xelatex -interaction=nonstopmode main.tex

# Verify the PDF was created properly
if [ -f main.pdf ]; then
    echo "PDF file successfully created."
    
    # Try to repair the PDF
    if command -v gs &> /dev/null; then
        echo "Attempting to repair PDF with Ghostscript..."
        gs -q -dNOPAUSE -dBATCH -sDEVICE=pdfwrite -sOutputFile=main_repaired.pdf main.pdf
        if [ -f main_repaired.pdf ]; then
            mv main_repaired.pdf main.pdf
            echo "PDF has been repaired."
        fi
    fi
else
    echo "Error: Failed to create PDF file."
fi

echo "Compilation complete." 