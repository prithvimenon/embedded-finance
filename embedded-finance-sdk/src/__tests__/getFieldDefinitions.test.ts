import { getFieldDefinitions } from "../utils/getFieldDefinitions";

describe("getFieldDefinitions", () => {
  it("returns field definitions array for 'UK'", () => {
    const result = getFieldDefinitions("UK");

    expect(result).not.toBeNull();
    expect(Array.isArray(result)).toBe(true);
    expect(result!.length).toBeGreaterThan(0);
  });

  it("returns field definitions array for 'HK'", () => {
    const result = getFieldDefinitions("HK");

    expect(result).not.toBeNull();
    expect(Array.isArray(result)).toBe(true);
    expect(result!.length).toBeGreaterThan(0);
  });

  it("returns null for an invalid/unsupported country key", () => {
    // @ts-ignore
    const result = getFieldDefinitions("XX");

    expect(result).toBeNull();
  });

  it("each returned definition has required shape properties", () => {
    const result = getFieldDefinitions("UK");

    expect(result).not.toBeNull();
    result!.forEach((definition) => {
      expect(definition).toHaveProperty("name");
      expect(definition).toHaveProperty("type");
      expect(definition).toHaveProperty("label");
      expect(definition).toHaveProperty("description");
      expect(definition).toHaveProperty("required");
      expect(definition).toHaveProperty("options");
      expect(definition).toHaveProperty("examples");
    });
  });
});
