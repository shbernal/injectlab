import { describe, expect, it } from 'vitest';

import { escapeHtml, html, raw, toHtmlString } from '../src/render/html.js';

const s = (node: Parameters<typeof toHtmlString>[0]) => toHtmlString(node);

describe('escapeHtml', () => {
  it('escapes the five characters that matter in content and in attributes', () => {
    expect(escapeHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;');
  });

  it('escapes the ampersand first, so entities are not double built', () => {
    expect(escapeHtml('&lt;')).toBe('&amp;lt;');
  });
});

describe('the html template tag', () => {
  it('escapes every interpolated value', () => {
    const headline = '<script>alert(1)</script>';
    expect(s(html`<h1>${headline}</h1>`)).toBe('<h1>&lt;script&gt;alert(1)&lt;/script&gt;</h1>');
  });

  /** The one that would break the page rather than merely inject an element. */
  it('escapes a headline that tries to close the stylesheet', () => {
    const headline = 'A headline containing </style> for some reason';
    const out = s(html`<title>${headline}</title>`);
    expect(out).not.toContain('</style>');
    expect(out).toContain('&lt;/style&gt;');
  });

  it('escapes quotes, so a value cannot break out of an attribute', () => {
    const src = '" onerror="alert(1)';
    expect(s(html`<img src="${src}" />`)).toBe('<img src="&quot; onerror=&quot;alert(1)" />');
  });

  it('passes raw markup through unescaped', () => {
    expect(s(html`<div>${raw('<b>bold</b>')}</div>`)).toBe('<div><b>bold</b></div>');
  });

  it('nests without double escaping', () => {
    const inner = html`<em>${'a & b'}</em>`;
    expect(s(html`<p>${inner}</p>`)).toBe('<p><em>a &amp; b</em></p>');
  });

  it('joins arrays, which is how a list of paragraphs is written', () => {
    const paragraphs = ['one', 'two & three'].map((text) => html`<p>${text}</p>`);
    expect(s(html`<div>${paragraphs}</div>`)).toBe('<div><p>one</p><p>two &amp; three</p></div>');
  });

  it('renders undefined, null and false as nothing, so conditionals read naturally', () => {
    expect(s(html`<p>${undefined}${null}${false}</p>`)).toBe('<p></p>');
    const show = false;
    expect(s(html`<p>${show && html`<b>x</b>`}</p>`)).toBe('<p></p>');
  });

  it('renders numbers and true, which are not the conditional sentinels', () => {
    expect(s(html`<p>${3}${true}</p>`)).toBe('<p>3true</p>');
  });
});
