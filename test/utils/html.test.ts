import { escapeHtml, plaintextToHtml } from "@/utils/html";

describe("escapeHtml", () => {
  it("escapes ampersands", () => {
    expect(escapeHtml("Tom & Jerry")).toBe("Tom &amp; Jerry");
  });

  it("escapes angle brackets", () => {
    expect(escapeHtml("<script>alert('xss')</script>")).toBe("&lt;script&gt;alert(&#x27;xss&#x27;)&lt;/script&gt;");
  });

  it("escapes double quotes", () => {
    expect(escapeHtml('value="test"')).toBe("value=&quot;test&quot;");
  });

  it("escapes single quotes", () => {
    expect(escapeHtml("it's")).toBe("it&#x27;s");
  });

  it("escapes all five characters in one string", () => {
    expect(escapeHtml(`<a href="x" onclick='y'>&`)).toBe("&lt;a href=&quot;x&quot; onclick=&#x27;y&#x27;&gt;&amp;");
  });

  it("returns empty string unchanged", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("returns safe string unchanged", () => {
    expect(escapeHtml("Hello World 123")).toBe("Hello World 123");
  });

  it("handles img onerror XSS payload", () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
  });
});

describe("plaintextToHtml", () => {
  it("wraps single paragraph in p tag", () => {
    expect(plaintextToHtml("Hello world")).toBe('<p style="margin: 0 0 16px;">Hello world</p>');
  });

  it("converts double newlines to separate paragraphs", () => {
    const result = plaintextToHtml("First paragraph.\n\nSecond paragraph.");
    expect(result).toBe(
      '<p style="margin: 0 0 16px;">First paragraph.</p><p style="margin: 0 0 16px;">Second paragraph.</p>',
    );
  });

  it("converts single newlines to br tags within a paragraph", () => {
    const result = plaintextToHtml("Line one.\nLine two.");
    expect(result).toBe('<p style="margin: 0 0 16px;">Line one.<br>Line two.</p>');
  });

  it("escapes HTML in input", () => {
    const result = plaintextToHtml("<script>alert(1)</script>");
    expect(result).toContain("&lt;script&gt;");
    expect(result).not.toContain("<script>");
  });
});
