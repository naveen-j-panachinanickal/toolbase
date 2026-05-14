import { XMLBuilder, XMLParser, XMLValidator } from "fast-xml-parser";
import type { FormatAdapter } from "./types";

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  parseTagValue: true,
  parseAttributeValue: true,
  trimValues: true,
});

function buildXmlBuilder(format: boolean) {
  return new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    format,
    indentBy: "  ",
  });
}

export const xmlAdapter: FormatAdapter = {
  id: "xml",
  capabilities: {
    canConvert: true,
    canValidate: true,
    canFormat: true,
    canSortKeys: true,
    canJsonStringTools: false,
  },
  parse(input: string): unknown {
    return xmlParser.parse(input);
  },
  serialize(data, mode): string {
    return buildXmlBuilder(mode === "beautify").build(data);
  },
  validate(input) {
    if (!input.trim()) return { valid: false, errors: ["Input is empty."], warnings: [] };
    const result = XMLValidator.validate(input);
    if (result !== true) {
      return { valid: false, errors: [result.err.msg], warnings: [] };
    }
    return { valid: true, errors: [], warnings: [] };
  },
};
