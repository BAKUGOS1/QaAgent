import fs from "node:fs";
import path from "node:path";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { ensureDir } from "../../shared/utils.js";
import type { QaIssue } from "../../shared/types.js";

/**
 * Detects visual differences between current screenshot and baseline screenshot.
 * If baseline doesn't exist, it creates one.
 */
export async function detectVisualRegression(
  currentScreenshotPath: string,
  url: string,
  moduleName = "default"
): Promise<QaIssue[]> {
  const issues: QaIssue[] = [];
  if (!currentScreenshotPath || !fs.existsSync(currentScreenshotPath)) {
    return issues;
  }

  // Create baseline directory
  const baselineDir = path.join(process.cwd(), "agent", "artifacts", "baselines");
  ensureDir(baselineDir);

  // Create diff directory
  const diffDir = path.join(process.cwd(), "agent", "artifacts", "visual-diffs");
  ensureDir(diffDir);

  // Normalize URL to a safe filename
  const safeUrl = url.replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 100);
  const baselineFilename = `${safeUrl}-${moduleName}.png`;
  const baselinePath = path.join(baselineDir, baselineFilename);

  // If baseline doesn't exist, save current screenshot as baseline and return empty issues
  if (!fs.existsSync(baselinePath)) {
    try {
      fs.copyFileSync(currentScreenshotPath, baselinePath);
    } catch {
      // Ignore copy error
    }
    return issues;
  }

  try {
    const img1 = PNG.sync.read(fs.readFileSync(baselinePath));
    const img2 = PNG.sync.read(fs.readFileSync(currentScreenshotPath));

    const { width, height } = img1;
    // Handle size mismatches
    if (img2.width !== width || img2.height !== height) {
      issues.push({
        title: "Visual baseline size mismatch",
        severity: "Low",
        area: "Visual Regression",
        description: `Current screenshot size (${img2.width}x${img2.height}) does not match baseline screenshot size (${width}x${height}).`,
        suggestedFix: "Run tests under identical viewport dimensions, or update the visual baseline if the page layout has changed."
      });
      return issues;
    }

    const diff = new PNG({ width, height });
    const diffPixels = pixelmatch(img1.data, img2.data, diff.data, width, height, { threshold: 0.1 });

    // If there is a meaningful difference (e.g. > 500 pixels)
    if (diffPixels > 500) {
      const diffPath = path.join(diffDir, `diff-${baselineFilename}`);
      fs.writeFileSync(diffPath, PNG.sync.write(diff));

      issues.push({
        title: "Visual regression detected",
        severity: "Medium",
        area: "Visual Regression",
        description: `Visual difference of ${diffPixels} pixels detected compared to baseline screenshot. Diff saved to visual-diffs/diff-${baselineFilename}`,
        evidence: diffPath,
        suggestedFix: "Compare the screenshot with the diff file to see layout/style regressions, and update baseline if correct."
      });
    }
  } catch (err: any) {
    // Fail silently on image parse issues
  }

  return issues;
}
