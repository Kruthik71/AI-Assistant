export const extractUrlInfo = (url) => {
  if (!url) return null;

  const normalizedUrl = url
    // Convert SSH form `git@github.com:user/repo.git` to HTTPS
    .replace(/^git@([^:]+):/, "https://$1/")
    // Convert `ssh://git@github.com/user/repo.git` to HTTPS
    .replace(/^ssh:\/\/git@([^/]+)\//, "https://$1/")
    // Remove `.git` at the end if present
    .replace(/\.git$/, "")
    // Remove trailing slash if any
    .replace(/\/+$/, "");

  const match = normalizedUrl.match(
    /^https:\/\/github\.com\/([^/]+)\/([^/]+)$/
  );

  if (match) {
    return {
      owner: match[1],
      repo: match[2],
    };
  }

  return null;
};

export const isValidGitHubUrl = (url) => {
  const regex = /^https:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+\/?$/;
  return regex.test(url.trim());
};

export const getFileAndFolderCountFromTree = (tree = []) => {
  const fileCount = tree.filter((item) => item.type === "blob").length;
  const folderCount = tree.filter((item) => item.type === "tree").length;
  return { fileCount, folderCount };
};

export function formatSizes(bytes, decimals = 2) {
  if (!bytes || bytes === 0) return "0 KB"; // Avoid showing "Bytes"

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["KB", "MB", "GB"];

  // Force minimum index to be 0 (KB)
  const i = Math.max(0, Math.floor(Math.log(bytes) / Math.log(k)) - 1);
  const value = parseFloat((bytes / Math.pow(k, i + 1)).toFixed(dm));

  return `${value} ${sizes[i]}`;
}

export function parseMarkdownWithCodeBlocks(text) {
  const lines = text.replace(/\\n/g, "\n").split("\n");
  let inCodeBlock = false;
  let html = "";

  for (let line of lines) {
    if (line.trim().startsWith("```")) {
      if (!inCodeBlock) {
        html += "<pre><code>";
        inCodeBlock = true;
      } else {
        html += "</code></pre>";
        inCodeBlock = false;
      }
    } else {
      if (inCodeBlock) {
        // Escape HTML characters inside code blocks
        const escapedLine = line
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        html += escapedLine + "\n";
      } else {
        html += line + "<br/>";
      }
    }
  }

  if (inCodeBlock) {
    html += "</code></pre>";
  }

  return html;
}

export function extractCodeBlocks(markdown) {
  if (!markdown) return "";

  // Match ```language(optional)\n ...code... \n```
  const regex = /```[a-zA-Z]*\n([\s\S]*?)```/g;
  let mergedCode = "";
  let match;

  while ((match = regex.exec(markdown)) !== null) {
    mergedCode += match[1].trim() + "\n\n"; // separate with double newlines
  }

  return mergedCode.trim(); // remove trailing spaces/newlines
}

export function getMarkdownBlocks(text = "", isEditing = false, onChange) {
  // Use safe text for splitting
  const safeText = text?.replace?.(/\\n/g, "\n") ?? "";
  const lines = safeText.split("\n");

  let blocks = [];
  let inCodeBlock = false;
  let buffer = [];

  const flushText = (key) => {
    if (buffer.length) {
      blocks.push(
        <div
          key={`text-${key}`}
          dangerouslySetInnerHTML={{
            __html: buffer.join("<br/>"),
          }}
        />
      );
      buffer = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith("```")) {
      if (!inCodeBlock) {
        flushText(index);
        inCodeBlock = true;
      } else {
        const codeContent = buffer.join("\n");
        blocks.push(
          <pre
            key={`code-${index}`}
            style={{
              backgroundColor: isEditing ? "#ffffff" : "#1a1a1a",
              color: isEditing ? "#000000" : "#d4d4d4",
              borderRadius: "8px",
              fontSize: "0.875rem",
              display: "block",
              overflowX: "auto",
              fontFamily: "monospace",
            }}
          >
            <code
              contentEditable={!!isEditing}
              suppressContentEditableWarning
              onInput={
                isEditing && typeof onChange === "function"
                  ? (e) => onChange(e.currentTarget.innerText ?? "")
                  : undefined
              }
              style={{
                whiteSpace: "pre-wrap",
                cursor: isEditing ? "text" : "default",
                backgroundColor: "transparent",
                color: isEditing ? "#000000" : "#d4d4d4",
              }}
              dangerouslySetInnerHTML={{
                __html: isEditing
                  ? codeContent // raw text during edit
                  : (codeContent ?? "").replace(/\n/g, "<br/>"),
              }}
            />
          </pre>
        );
        buffer = [];
        inCodeBlock = false;
      }
    } else {
      buffer.push(line);
    }
  });

  // Handle leftover buffer
  if (buffer.length) {
    if (inCodeBlock) {
      blocks.push(
        <pre
          key="last-code"
          style={{
            backgroundColor: isEditing ? "#ffffff" : "#1a1a1a",
            color: isEditing ? "#000000" : "#d4d4d4",
            borderRadius: "8px",
            fontSize: "0.875rem",
            display: "block",
            overflowX: "auto",
            fontFamily: "monospace",
          }}
        >
          <code
            contentEditable={!!isEditing}
            suppressContentEditableWarning
            onInput={
              isEditing && typeof onChange === "function"
                ? (e) => onChange(e.currentTarget.innerText ?? "")
                : undefined
            }
            style={{
              whiteSpace: "pre-wrap",
              cursor: isEditing ? "text" : "default",
              backgroundColor: "transparent",
              color: isEditing ? "#000000" : "#d4d4d4",
            }}
            dangerouslySetInnerHTML={{
              __html: (buffer.join("\n") ?? "").replace(/\n/g, "<br/>"),
            }}
          />
        </pre>
      );
    } else {
      flushText("last");
    }
  }

  return blocks;
}
