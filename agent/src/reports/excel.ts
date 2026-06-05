import fs from "node:fs";
import path from "node:path";
import type { LeadData, QaIssue, RunContext } from "../shared/types.js";

type CellValue = string | number | boolean;
type Row = Record<string, CellValue>;

interface SheetImage {
  path: string;
  rowIndex: number;
  columnIndex: number;
}

interface Sheet {
  name: string;
  rows: Row[];
  images?: SheetImage[];
}

function issueRows(issues: QaIssue[]): Row[] {
  return issues.map((issue) => ({
    Module: issue.area,
    Issue: conciseText(issue.title),
    Description: clearText(issue.description),
    Priority: issue.severity,
    Status: issue.status || "Open",
    Steps: clearText(issue.steps || ""),
    Expected: clearText(issue.expected || ""),
    Actual: clearText(issue.actual || issue.evidence || ""),
    Screenshot: issue.screenshot || "",
    "Developer Note": clearText(issue.developerNote || issue.suggestedFix || "")
  }));
}

function issueMatrixRows(context: RunContext): Row[] {
  const rows = [...context.bugs, ...context.uxIssues, ...context.missingValidations].map((issue) => ({
    Module: issue.area,
    Issue: conciseText(issue.title),
    Description: clearText(issue.description),
    Priority: issue.severity,
    Status: context.finalStatus === "Fail" ? "Blocked" : "Open"
  }));
  return rows.length ? rows : [{
    Module: "Lead Module",
    Issue: "No issue found",
    Description: "No bugs were detected during this run.",
    Priority: "Low",
    Status: "Pass"
  }];
}

function leadRows(leads: LeadData[]): Row[] {
  return leads.map((lead) => ({
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    company: lead.company,
    city: lead.city,
    source: lead.source,
    status: lead.status,
    requirement: lead.requirement,
    notes: lead.notes
  }));
}

function listRows(values: string[], key: string): Row[] {
  return values.map((value, index) => ({ index: index + 1, [key]: clearText(value) }));
}

function checklistRows(checklist?: Record<string, string>): Row[] {
  return Object.entries(checklist || {}).map(([check, status], index) => ({
    index: index + 1,
    check,
    status
  }));
}

function browserStateRows(context: RunContext): Row[] {
  const state = context.browserState;
  if (!state) return [{ key: "state", value: "No browser state captured." }];
  return [
    { key: "url", value: state.url },
    { key: "title", value: state.title },
    { key: "savedAt", value: state.savedAt },
    { key: "screenshotPath", value: state.screenshotPath || "" },
    { key: "clickableElements", value: state.clickableElements.length },
    { key: "forms", value: state.forms.length },
    { key: "tables", value: state.tables.length },
    { key: "buttons", value: state.buttons.join(" | ") },
    { key: "inputs", value: state.inputs.join(" | ") },
    { key: "links", value: state.links.slice(0, 30).join(" | ") },
    { key: "errors", value: state.errorMessages.join(" | ") },
    { key: "textSample", value: state.textSample }
  ];
}

export function writeExcelReport(context: RunContext, filePath: string): void {
  const sheets: Sheet[] = [
    {
      name: "Summary",
      rows: [{
        websiteUrl: context.task.websiteUrl,
        task: context.task.task,
        qaProfile: context.task.qaProfile,
        dateTime: context.startedAt,
        mode: context.mode,
        browserMode: context.headed ? "headed" : "headless",
        loginResult: context.loginResult,
        finalStatus: context.finalStatus,
        totalTests: Object.keys(context.qaChecklist || {}).length,
        passed: Object.values(context.qaChecklist || {}).filter((status) => status === "Pass").length,
        failed: Object.values(context.qaChecklist || {}).filter((status) => status === "Fail").length,
        blocked: [...context.bugs, ...context.uxIssues, ...context.missingValidations].filter((issue) => issue.status === "Blocked").length,
        criticalBugs: [...context.bugs, ...context.uxIssues, ...context.missingValidations].filter((issue) => issue.severity === "Critical").length,
        highBugs: [...context.bugs, ...context.uxIssues, ...context.missingValidations].filter((issue) => issue.severity === "High").length,
        mediumBugs: [...context.bugs, ...context.uxIssues, ...context.missingValidations].filter((issue) => issue.severity === "Medium").length,
        lowBugs: [...context.bugs, ...context.uxIssues, ...context.missingValidations].filter((issue) => issue.severity === "Low").length,
        bugsFound: context.bugs.length,
        uxIssues: context.uxIssues.length,
        missingValidations: context.missingValidations.length,
        consoleErrors: context.consoleErrors.length,
        networkErrors: context.networkErrors.length,
        screenshots: context.screenshots.length,
        generatedLeads: context.generatedLeads.length
      }]
    },
    { name: "Bugs", rows: issueRows([...context.bugs, ...context.uxIssues, ...context.missingValidations]) },
    { name: "Test Steps", rows: listRows(context.stepsPerformed, "step") },
    { name: "Issue Matrix", rows: issueMatrixRows(context) },
    { name: "Test Data", rows: leadRows(context.generatedLeads) },
    { name: "UX Issues", rows: issueRows(context.uxIssues) },
    { name: "Missing Validations", rows: issueRows(context.missingValidations) },
    { name: "Console Errors", rows: listRows(context.consoleErrors, "error") },
    { name: "Network Errors", rows: listRows(context.networkErrors, "error") },
    { name: "Browser State", rows: browserStateRows(context) },
    { name: "QA Checklist", rows: checklistRows(context.qaChecklist) },
    { name: "Memory Notes", rows: listRows(context.memoryNotes || [], "note") },
    {
      name: "Screenshots",
      rows: context.screenshots.length
        ? context.screenshots.map((screenshotPath, index) => ({
          index: index + 1,
          path: screenshotPath,
          image: "embedded"
        }))
        : [{ index: 1, path: "No screenshots captured.", image: "" }],
      images: context.screenshots.map((screenshotPath, index) => ({
        path: screenshotPath,
        rowIndex: index + 1,
        columnIndex: 2
      }))
    }
  ];

  const files = buildXlsxFiles(sheets);
  fs.writeFileSync(filePath, zipStore(files));
}

function conciseText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function clearText(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/\s*([.!?])\s*/g, "$1 ")
    .trim();
}

function buildXlsxFiles(sheets: Sheet[]): Record<string, Buffer> {
  const imageParts = collectImages(sheets);
  const workbookSheets = sheets.map((sheet, index) =>
    `<sheet name="${escapeXml(sheet.name.slice(0, 31))}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`
  ).join("");
  const workbookRels = sheets.map((_, index) =>
    `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`
  ).join("");
  const overrides = sheets.map((_, index) =>
    `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
  ).join("");
  const drawingOverrides = imageParts.drawings.map((_, index) =>
    `<Override PartName="/xl/drawings/drawing${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>`
  ).join("");

  const files: Record<string, Buffer> = {
    "[Content_Types].xml": xmlBuffer(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
${imageParts.hasPng ? '<Default Extension="png" ContentType="image/png"/>' : ""}
${imageParts.hasJpg ? '<Default Extension="jpg" ContentType="image/jpeg"/><Default Extension="jpeg" ContentType="image/jpeg"/>' : ""}
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
${overrides}
${drawingOverrides}
</Types>`),
    "_rels/.rels": xmlBuffer(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`),
    "xl/workbook.xml": xmlBuffer(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets>${workbookSheets}</sheets>
</workbook>`),
    "xl/_rels/workbook.xml.rels": xmlBuffer(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${workbookRels}
</Relationships>`)
  };

  sheets.forEach((sheet, index) => {
    const drawing = imageParts.drawings.find((item) => item.sheetIndex === index);
    files[`xl/worksheets/sheet${index + 1}.xml`] = xmlBuffer(sheetXml(sheet.rows, Boolean(drawing), sheet.images?.length ? 130 : undefined));
    if (drawing) {
      files[`xl/worksheets/_rels/sheet${index + 1}.xml.rels`] = xmlBuffer(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing${drawing.drawingIndex}.xml"/>
</Relationships>`);
      files[`xl/drawings/drawing${drawing.drawingIndex}.xml`] = xmlBuffer(drawingXml(drawing.images));
      files[`xl/drawings/_rels/drawing${drawing.drawingIndex}.xml.rels`] = xmlBuffer(drawingRelsXml(drawing.images));
    }
  });
  imageParts.media.forEach((image) => {
    files[`xl/media/image${image.mediaIndex}.${image.extension}`] = image.data;
  });
  return files;
}

function sheetXml(rows: Row[], hasDrawing: boolean, bodyRowHeight?: number): string {
  const actualRows = rows.length ? rows : [{ note: "None" }];
  const headers = Array.from(new Set(actualRows.flatMap((row) => Object.keys(row))));
  const xmlRows = [headers, ...actualRows.map((row) => headers.map((header) => row[header] ?? ""))]
    .map((values, rowIndex) => {
      const cells = values.map((value, columnIndex) => cellXml(value, columnIndex, rowIndex)).join("");
      const height = bodyRowHeight && rowIndex > 0 ? ` ht="${bodyRowHeight}" customHeight="1"` : "";
      return `<row r="${rowIndex + 1}"${height}>${cells}</row>`;
    }).join("");
  const cols = hasDrawing ? `<cols><col min="1" max="1" width="10" customWidth="1"/><col min="2" max="2" width="70" customWidth="1"/><col min="3" max="3" width="36" customWidth="1"/></cols>` : "";
  const drawing = hasDrawing ? '<drawing r:id="rId1"/>' : "";
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
${cols}
<sheetData>${xmlRows}</sheetData>
${drawing}
</worksheet>`;
}

interface CollectedImage {
  drawingRid: number;
  mediaIndex: number;
  extension: "png" | "jpg" | "jpeg";
  data: Buffer;
  rowIndex: number;
  columnIndex: number;
  widthPx: number;
  heightPx: number;
}

interface DrawingPart {
  sheetIndex: number;
  drawingIndex: number;
  images: CollectedImage[];
}

function collectImages(sheets: Sheet[]): {
  drawings: DrawingPart[];
  media: CollectedImage[];
  hasPng: boolean;
  hasJpg: boolean;
} {
  const drawings: DrawingPart[] = [];
  const media: CollectedImage[] = [];
  let mediaIndex = 1;
  let drawingIndex = 1;
  sheets.forEach((sheet, sheetIndex) => {
    const images: CollectedImage[] = [];
    (sheet.images || []).forEach((image, imageIndex) => {
      const resolvedPath = path.isAbsolute(image.path) ? image.path : path.join(process.cwd(), image.path);
      if (!fs.existsSync(resolvedPath)) return;
      const extension = imageExtension(resolvedPath);
      if (!extension) return;
      const data = fs.readFileSync(resolvedPath);
      const size = imageSize(data, extension);
      if (!size) return;
      const fitted = fitSize(size.width, size.height, 260, 145);
      const collected: CollectedImage = {
        drawingRid: imageIndex + 1,
        mediaIndex,
        extension,
        data,
        rowIndex: image.rowIndex,
        columnIndex: image.columnIndex,
        widthPx: fitted.width,
        heightPx: fitted.height
      };
      images.push(collected);
      media.push(collected);
      mediaIndex += 1;
    });
    if (images.length) {
      drawings.push({ sheetIndex, drawingIndex, images });
      drawingIndex += 1;
    }
  });
  return {
    drawings,
    media,
    hasPng: media.some((image) => image.extension === "png"),
    hasJpg: media.some((image) => image.extension === "jpg" || image.extension === "jpeg")
  };
}

function imageExtension(filePath: string): "png" | "jpg" | "jpeg" | undefined {
  const extension = path.extname(filePath).toLowerCase().replace(".", "");
  if (extension === "png" || extension === "jpg" || extension === "jpeg") return extension;
  return undefined;
}

function imageSize(data: Buffer, extension: "png" | "jpg" | "jpeg"): { width: number; height: number } | undefined {
  if (extension === "png" && data.length > 24) {
    return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
  }
  if ((extension === "jpg" || extension === "jpeg") && data.length > 4) {
    let offset = 2;
    while (offset < data.length) {
      if (data[offset] !== 0xff) return undefined;
      const marker = data[offset + 1];
      const length = data.readUInt16BE(offset + 2);
      if (marker >= 0xc0 && marker <= 0xc3) {
        return { height: data.readUInt16BE(offset + 5), width: data.readUInt16BE(offset + 7) };
      }
      offset += 2 + length;
    }
  }
  return undefined;
}

function fitSize(width: number, height: number, maxWidth: number, maxHeight: number): { width: number; height: number } {
  const scale = Math.min(maxWidth / width, maxHeight / height, 1);
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

function drawingXml(images: CollectedImage[]): string {
  const anchors = images.map((image, index) => {
    const id = index + 1;
    return `<xdr:oneCellAnchor>
<xdr:from><xdr:col>${image.columnIndex}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${image.rowIndex}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from>
<xdr:ext cx="${image.widthPx * 9525}" cy="${image.heightPx * 9525}"/>
<xdr:pic>
<xdr:nvPicPr><xdr:cNvPr id="${id}" name="Screenshot ${id}"/><xdr:cNvPicPr/></xdr:nvPicPr>
<xdr:blipFill><a:blip r:embed="rId${image.drawingRid}"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill>
<xdr:spPr><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr>
</xdr:pic>
<xdr:clientData/>
</xdr:oneCellAnchor>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
${anchors}
</xdr:wsDr>`;
}

function drawingRelsXml(images: CollectedImage[]): string {
  const rels = images.map((image) =>
    `<Relationship Id="rId${image.drawingRid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image${image.mediaIndex}.${image.extension}"/>`
  ).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${rels}
</Relationships>`;
}

function cellXml(value: CellValue, columnIndex: number, rowIndex: number): string {
  const ref = `${columnName(columnIndex)}${rowIndex + 1}`;
  if (typeof value === "number") return `<c r="${ref}"><v>${value}</v></c>`;
  if (typeof value === "boolean") return `<c r="${ref}" t="b"><v>${value ? 1 : 0}</v></c>`;
  return `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(String(value))}</t></is></c>`;
}

function columnName(index: number): string {
  let name = "";
  let n = index + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    name = String.fromCharCode(65 + rem) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
}

function xmlBuffer(xml: string): Buffer {
  return Buffer.from(xml.trim(), "utf8");
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function zipStore(files: Record<string, Buffer>): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const [name, data] of Object.entries(files)) {
    const nameBuffer = Buffer.from(name, "utf8");
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuffer.length, 26);
    local.writeUInt16LE(0, 28);
    localParts.push(local, nameBuffer, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuffer.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, nameBuffer);
    offset += local.length + nameBuffer.length + data.length;
  }

  const centralOffset = offset;
  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(Object.keys(files).length, 8);
  end.writeUInt16LE(Object.keys(files).length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(centralOffset, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...localParts, centralDirectory, end]);
}

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const crcTable = Array.from({ length: 256 }, (_, tableIndex) => {
  let c = tableIndex;
  for (let k = 0; k < 8; k += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return c >>> 0;
});
