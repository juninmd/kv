import { expect, test } from "bun:test";
import { dashboardHtml } from "../src/dashboard";

const script = dashboardHtml.split("<script>")[1] ?? "";

test("key names and server errors are escaped before innerHTML", () => {
	expect(script).toContain("esc(k.key)");
	expect(script).toContain("esc((await r.json()).error)");
	expect(script).not.toMatch(/'\+k\.key\+'/);
});

test("esc neutralises markup", () => {
	const fn = script.match(/function esc\(s\)\{[^\n]*\}/)?.[0] ?? "";
	const esc = new Function(`${fn};return esc;`)() as (s: string) => string;
	expect(esc(`<img src=x onerror="a">&'`)).toBe("&lt;img src=x onerror=&quot;a&quot;&gt;&amp;&#39;");
});
