import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import App from "./App";

describe("Frontend scaffold", () => {
  it("renders the CampusBites shell and the initial health-check state", () => {
    const html = renderToStaticMarkup(<App />);

    expect(html).toContain("CampusBites");
    expect(html).toContain("Online Food Ordering Platform");
    expect(html).toContain("Checking API health...");
  });
});
