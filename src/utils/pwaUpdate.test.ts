import { describe, expect, it } from "vitest";
import { decidePwaUpdateAction } from "./pwaUpdate";

describe("decidePwaUpdateAction", () => {
    it("reloads immediately while the page is hidden", () => {
        expect(decidePwaUpdateAction("hidden")).toBe("reload-now");
    });

    it("defers the reload until the page is hidden again", () => {
        expect(decidePwaUpdateAction("visible")).toBe("reload-on-next-hide");
    });
});
