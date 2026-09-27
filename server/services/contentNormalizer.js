// Problem it solves: when the AI returns code as a JSON string (inside { code: "..." }), certain characters get double-escaped. So your actual source code ends up with garbage like:

// \\n instead of actual newlines

// \" instead of regular quotes

// \\\\ instead of \


// Fix double-escaped newlines/quotes from AI JSON string output
export function normalizeContent(content) {
    if (!content) return "";

    // Remove BOM if present. BOM is "Byte Order Mark":  the character \uFEFF (Unicode code point 0xFEFF)
    // Some AI models and text editors prepend this invisible character to strings. 
    // It's invisible in editors but breaks parsing — often the source of "unexpected token" errors in weird places.
    if (content.charCodeAt(0) === 0xfeff) {
        content = content.slice(1);
    }

    // Normalize \r\n to \n. Normalize line endings
    // converts Windows (\r\n) and old Mac (\r) line endings to Unix (\n).
    content = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    //detect escape-heavy content
    //decides whether the content is double-escaped and needs unescaping.
    const realNewlines = (content.match(/\n/g) || []).length;  //counts actual new line characters (\n)
    const literalBackslashN = (content.match(/\\n/g) || []).length; //literalBackslashN — counts literal backslash-n pairs 
    // (\n as text, i.e. the two characters \ and n)
    //if the file has more literal \n than real newlines, it must be double-escaped.

    // consider two cases:
   //  Normal code: many real \n (from JSON parsing), few literal \n → skip unescaping 

   // Double-escaped code: almost no real \n (whole file is one line), many literal \n (the JSON kept them as text) → unescape
    if (literalBackslashN > realNewlines) {
        // Triple-escaped first: \\\\n → \\n (leave as literal), then \\n → \n
        //Goal: unescape the common sequences, but preserve cases where \n was legitimately meant to be the two characters \ and n.
        content = content
            .replace(/\\\\n/g, "%%PRESERVED_ESCAPED_N%%")
            .replace(/\\n/g, "\n")
            .replace(/%%PRESERVED_ESCAPED_N%%/g, "\\n")
            .replace(/\\t/g, "\t")
            .replace(/\\r/g, "")
            .replace(/\\\\/g, "\\");
    }

    // Always clean up backslash-escaped quotes (e.g. className=\"relative\") in code.
    // This is safe because "contains escaped quotes" is always invalid syntax in JSX/React.
    // what it fixes: className=\"relative\" → className="relative"
    content = content.replace(/(\w+)=\\"([^"]*?)\\"/g, '$1="$2"');

    return content;
}
