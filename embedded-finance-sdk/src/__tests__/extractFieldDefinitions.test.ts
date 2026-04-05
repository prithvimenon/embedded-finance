import { extractFieldDefinitions } from "../utils/extractFieldDefinitions";
import { ukSchema } from "../schemas/unitedKingdom.schema";

describe("extractFieldDefinitions", () => {
  it("extracts basic string field as type 'text'", () => {
    const schema = {
      properties: { name: { type: "string", title: "Name" } },
      required: ["name"],
    };

    const result = extractFieldDefinitions(schema);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      name: "name",
      type: "text",
      label: "Name",
      required: true,
    });
  });

  it("maps string with format 'email' to type 'email'", () => {
    const schema = {
      properties: { email: { type: "string", format: "email", title: "Email" } },
    };

    const result = extractFieldDefinitions(schema);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      name: "email",
      type: "email",
      label: "Email",
    });
  });

  it("maps string with format 'date-time' to type 'datetime-local'", () => {
    const schema = {
      properties: { createdAt: { type: "string", format: "date-time", title: "Created At" } },
    };

    const result = extractFieldDefinitions(schema);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      name: "createdAt",
      type: "datetime-local",
      label: "Created At",
    });
  });

  it("maps string with enum to type 'select' and populates options", () => {
    const schema = {
      properties: { method: { type: "string", enum: ["A", "B"], title: "Method" } },
    };

    const result = extractFieldDefinitions(schema);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      name: "method",
      type: "select",
      label: "Method",
      options: ["A", "B"],
    });
  });

  it("maps integer type to 'number'", () => {
    const schema = {
      properties: { age: { type: "integer", title: "Age" } },
    };

    const result = extractFieldDefinitions(schema);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      name: "age",
      type: "number",
      label: "Age",
    });
  });

  it("maps number type to 'number'", () => {
    const schema = {
      properties: { amount: { type: "number", title: "Amount" } },
    };

    const result = extractFieldDefinitions(schema);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      name: "amount",
      type: "number",
      label: "Amount",
    });
  });

  it("marks required fields correctly", () => {
    const schema = {
      properties: {
        a: { type: "string", title: "A" },
        b: { type: "string", title: "B" },
      },
      required: ["a"],
    };

    const result = extractFieldDefinitions(schema);

    expect(result).toHaveLength(2);
    const fieldA = result.find((f: any) => f.name === "a");
    const fieldB = result.find((f: any) => f.name === "b");
    expect(fieldA?.required).toBe(true);
    expect(fieldB?.required).toBe(false);
  });

  it("uses empty string defaults for missing title/description", () => {
    const schema = {
      properties: { field: { type: "string" } },
    };

    const result = extractFieldDefinitions(schema);

    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("");
    expect(result[0].description).toBe("");
  });

  it("populates examples from schema", () => {
    const schema = {
      properties: { code: { type: "string", title: "Code", examples: ["ABC", "DEF"] } },
    };

    const result = extractFieldDefinitions(schema);

    expect(result).toHaveLength(1);
    expect(result[0].examples).toEqual(["ABC", "DEF"]);
  });

  it("returns empty array for schema with no properties", () => {
    const result = extractFieldDefinitions({});

    expect(result).toEqual([]);
  });

  it("works with a real schema (ukSchema)", () => {
    const result = extractFieldDefinitions(ukSchema);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    const fieldNames = result.map((f: any) => f.name);
    expect(fieldNames).toContain("beneficiaryBankBIC");
    expect(fieldNames).toContain("paymentMethod");
    expect(fieldNames).toContain("originatorName");
  });
});
