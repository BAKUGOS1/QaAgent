import fs from "node:fs";
import type { LeadData, QaIssue, RunContext } from "../shared/types.js";

type CellValue = string | number | boolean;
type Row = Record<string, CellValue>;

interface Sheet {
  name: string;
  rows: Row[];
}

function issueRows(issues: QaIssue[]): Row[] {
  return issues.map((issue) => ({
    severity: issue.severity,
    title: issue.title,
    area: issue.area,
    description: issue.description,
    evidence: issue.evidence || "",
    suggestedFix: issue.suggestedFix || ""
  }));
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
  return values.map((value, index) => ({ index: index + 1, [key]: value }));
}

export function writeExcelReport(context: RunContext, filePath: string): void {
  const sheets: Sheet[] = [
    {
      name: "Summary",
      rows: [{
        websiteUrl: context.task.websiteUrl,
        task: context.task.task,
        dateTime: context.startedAt,
        mode: context.mode,
        browserMode: context.headed ? "headed" : "headless",
        loginResult: context.loginResult,
        finalStatus: context.finalStatus,
        bugsFound: context.bugs.length,
        uxIssues: context.uxIssues.length,
        missingValidations: context.missingValidations.length,
        consoleErrors: context.consoleErrors.length,
        networkErrors: context.networkErrors.length,
        screenshots: context.screenshots.length,
        generatedLeads: context.generatedLeads.length
      }]
    },
    { name: "Steps", rows: listRows(context.stepsPerformed, "step") },
    { name: "Test Data", rows: leadRows(context.generatedLeads) },
    { name: "Bugs", rows: issueRows(context.bugs) },
    { name: "UX Issues", rows: issueRows(context.uxIssues) },
    { name: "Missing Validations", rows: issueRows(context.missingValidations) },
    { name: "Console Errors", rows: listRows(context.consoleErrors, "error") },
    { name: "Network Errors", rows: listRows(context.networkErrors, "error") },
    { name: "Screenshots", rows: listRows(context.screenshots, "path") }
  ];

  const files = buildXlsxFiles(sheets);
  fs.writeFileSync(filePath, zipStore(files));
}

function buildXlsxFiles(sheets: Sheet[]): Record<string, Buffer> {
  const workbookSheets = sheets.map((sheet, index) =>
    `<sheet name="${escapeXml(sheet.name.slice(0, 31))}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`
  ).join("");
  const workbookRels = sheets.map((_, index) =>
    `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`
  ).join("");
  const overrides = sheets.map((_, index) =>
    `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
  ).join("");

  const files: Record<string, Buffer> = {
    "[Content_Types].xml": xmlBuffer(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
${overrides}
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
    files[`xl/worksheets/sheet${index + 1}.xml`] = xmlBuffer(sheetXml(sheet.rows));
  });
  return files;
}

function sheetXml(rows: Row[]): string {
  const actualRows = rows.length ? rows : [{ note: "None" }];
  const headers = Array.from(new Set(actualRows.flatMap((row) => Object.keys(row))));
  const xmlRows = [headers, ...actualRows.map((row) => headers.map((header) => row[header] ?? ""))]
    .map((values, rowIndex) => {
      const cells = values.map((value, columnIndex) => cellXml(value, columnIndex, rowIndex)).join("");
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    }).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetData>${xmlRows}</sheetData>
</worksheet>`;
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
