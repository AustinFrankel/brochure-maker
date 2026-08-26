/**
 * The sanitizer is the one piece of this app where a mistake is a security bug
 * rather than a layout bug: there is no sign-in, so a document saved by one
 * person is opened by another, and a stored script would run in their browser.
 *
 *   npm test
 */
import { execSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Transpiled rather than imported, so the test exercises the real module.
const out = join(mkdtempSync(join(tmpdir(), 'sanitize-')), 'sanitize.mjs');
execSync(`npx --yes esbuild@0.25.0 src/lib/sanitize.ts --format=esm --outfile=${out} --log-level=error`,
  { stdio: 'inherit' });
const { clean } = await import(out);

let pass = 0, fail = 0;
const bad = [];

/** Anything that could execute, navigate, or leak must not survive. */
const DANGER = /<script|<iframe|<object|<embed|<svg|onerror|onload|onclick|onfocus|onmouse|javascript:|data:text\/html|<style|expression\(|url\(|srcdoc|<form|<input|<meta|<link|<base/i;

const TAB = String.fromCharCode(9);
const NUL = String.fromCharCode(0);
const NL = String.fromCharCode(10);

const attacks = [
  `<script>alert(1)</script>`,
  `<img src=x onerror=alert(1)>`,
  `<p onclick="alert(1)">hi</p>`,
  `<a href="javascript:alert(1)">x</a>`,
  `<a href="jav&#x09;ascript:alert(1)">x</a>`,
  `<a href="java${TAB}script:alert(1)">x</a>`,
  `<a href="java${NUL}script:alert(1)">x</a>`,
  `<a href="java${NL}script:alert(1)">x</a>`,
  `<a href="  javascript:alert(1)">x</a>`,
  `<a href="JaVaScRiPt:alert(1)">x</a>`,
  `<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">x</a>`,
  `<svg/onload=alert(1)>`,
  `<svg><script>alert(1)</script></svg>`,
  `<iframe src="javascript:alert(1)"></iframe>`,
  `<span style="background:url(javascript:alert(1))">x</span>`,
  `<span style="width:expression(alert(1))">x</span>`,
  `<span style="color:red;background-image:url('x')">x</span>`,
  `<style>body{background:url(javascript:alert(1))}</style>`,
  `<p style="color:red" onmouseover="alert(1)">t</p>`,
  `<<script>script>alert(1)<</script>/script>`,
  `<scr<script>ipt>alert(1)</scr</script>ipt>`,
  `<SCRIPT SRC=//x.ss/x.js></SCRIPT>`,
  `<p>a</p><script>alert(1)</script><p>b</p>`,
  `<!--<script>alert(1)</script>-->`,
  `<![CDATA[<script>alert(1)</script>]]>`,
  `<math><mtext><script>alert(1)</script></mtext></math>`,
  `<template><script>alert(1)</script></template>`,
  `<noscript><p title="</noscript><script>alert(1)</script>">`,
  `<form action="javascript:alert(1)"><input></form>`,
  `<meta http-equiv="refresh" content="0;url=javascript:alert(1)">`,
  `<base href="javascript:alert(1)//">`,
  `<p title="x" style="color:red;" onx=1>ok</p>`,
  `<a href="/ok" target="_blank">ok</a>`,
  `<a href="/ok" target="_blank" rel="opener">ok</a>`,
  `<p style="color:#a349a4;font-size:14pt">styled</p>`,
  `<span class="x">y</span>`,
  `<p>unclosed <strong>bold`,
  `</p></strong>stray closers`,
  `<p>a & b < c > d</p>`,
  `<script>`.repeat(500),
  `<p>` + 'x'.repeat(50000) + `</p>`,
  `<p ` + 'a'.repeat(5000) + `>t</p>`,
  ``,
  null,
  undefined,
];

for (const input of attacks) {
  let out;
  try { out = clean(input); }
  catch (e) { fail++; bad.push([String(input).slice(0, 60), 'THREW: ' + e.message]); continue; }
  if (typeof out !== 'string') { fail++; bad.push([String(input).slice(0, 60), 'not a string']); continue; }
  if (DANGER.test(out)) { fail++; bad.push([String(input).slice(0, 60), 'LEAKED: ' + out.slice(0, 90)]); continue; }
  pass++;
}

// Content that must be preserved.
const keeps = [
  [`<p>Hello <strong>world</strong></p>`, 'Hello', '<strong>'],
  [`<p style="color:#a349a4">c</p>`, 'color: #a349a4'],
  [`<span style="font-size:14pt;font-weight:700">s</span>`, 'font-size: 14pt', 'font-weight: 700'],
  [`<a href="https://ryebrookny.gov">link</a>`, 'href="https://ryebrookny.gov"'],
  [`<a href="mailto:a@b.com">m</a>`, 'mailto:a@b.com'],
  [`<p>a<br>b</p>`, '<br>'],
  [`<p>x</p><p>y</p>`, '<p>x</p><p>y</p>'],
  [`<em><u>both</u></em>`, '<em>', '<u>'],
  [`<a href="/ok" target="_blank">ok</a>`, 'rel="noopener noreferrer"'],
];
for (const [input, ...needles] of keeps) {
  const out = clean(input);
  const missing = needles.filter((n) => !out.includes(n));
  if (missing.length) { fail++; bad.push([input, 'DROPPED ' + missing.join(', ') + ' -> ' + out]); }
  else pass++;
}

// Cleaning twice must equal cleaning once, or repeated saves would drift.
for (const input of attacks.filter((a) => typeof a === 'string')) {
  const once = clean(input);
  if (clean(once) !== once) { fail++; bad.push([input.slice(0, 50), 'NOT IDEMPOTENT']); }
  else pass++;
}

console.log(`\n${pass} passed, ${fail} failed`);
for (const [i, why] of bad) console.log(`  FAIL  ${JSON.stringify(i).slice(0, 70)}\n        ${why}`);
process.exit(fail ? 1 : 0);
