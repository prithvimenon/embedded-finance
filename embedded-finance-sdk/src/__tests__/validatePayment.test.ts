import { validatePayment } from "../utils/validatePayment";

describe("validatePayment", () => {
  // --- UK Schema Tests ---
  describe("UK", () => {
    it("returns valid: true for a complete valid UK payment", () => {
      const result = validatePayment("UK", {
        beneficiaryBankBIC: "BKENGB2LCON",
        paymentMethod: "TRF",
        beneficiaryBankRoutingCode: "123456789",
        beneficiaryName: "Ben E",
        beneficiaryAccountNumber: "123456",
        originatorName: "John Doe",
        originatorAddress: "123 Road",
        originatorAccountNumber: "123456",
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toStrictEqual({});
    });

    it("returns valid: false with field errors when required fields are missing", () => {
      const result = validatePayment("UK", {});

      expect(result.valid).toBe(false);
      expect(result.errors.paymentMethod).toBeDefined();
      expect(result.errors.beneficiaryBankBIC).toBeDefined();
      expect(result.errors.beneficiaryBankRoutingCode).toBeDefined();
      expect(result.errors.beneficiaryName).toBeDefined();
      expect(result.errors.beneficiaryAccountNumber).toBeDefined();
      expect(result.errors.originatorName).toBeDefined();
      expect(result.errors.originatorAddress).toBeDefined();
      expect(result.errors.originatorAccountNumber).toBeDefined();
    });

    it("returns field error for invalid paymentMethod", () => {
      const result = validatePayment("UK", {
        beneficiaryBankBIC: "BKENGB2LCON",
        paymentMethod: "ABC",
        beneficiaryBankRoutingCode: "123456789",
        beneficiaryName: "Ben E",
        beneficiaryAccountNumber: "123456",
        originatorName: "John Doe",
        originatorAddress: "123 Road",
        originatorAccountNumber: "123456",
      });

      expect(result.valid).toBe(false);
      expect(result.errors.paymentMethod).toBeDefined();
    });

    it("returns field error for invalid BIC format", () => {
      const result = validatePayment("UK", {
        beneficiaryBankBIC: "INVALID",
        paymentMethod: "TRF",
        beneficiaryBankRoutingCode: "123456789",
        beneficiaryName: "Ben E",
        beneficiaryAccountNumber: "123456",
        originatorName: "John Doe",
        originatorAddress: "123 Road",
        originatorAccountNumber: "123456",
      });

      expect(result.valid).toBe(false);
      expect(result.errors.beneficiaryBankBIC).toBeDefined();
    });

    it("returns field error for invalid routing code format", () => {
      const result = validatePayment("UK", {
        beneficiaryBankBIC: "BKENGB2LCON",
        paymentMethod: "TRF",
        beneficiaryBankRoutingCode: "12",
        beneficiaryName: "Ben E",
        beneficiaryAccountNumber: "123456",
        originatorName: "John Doe",
        originatorAddress: "123 Road",
        originatorAccountNumber: "123456",
      });

      expect(result.valid).toBe(false);
      expect(result.errors.beneficiaryBankRoutingCode).toBeDefined();
    });

    it("strips empty strings before validation", () => {
      const result = validatePayment("UK", {
        beneficiaryBankBIC: "BKENGB2LCON",
        paymentMethod: "TRF",
        beneficiaryBankRoutingCode: "123456789",
        beneficiaryName: "Ben E",
        beneficiaryAccountNumber: "123456",
        originatorName: "John Doe",
        originatorAddress: "123 Road",
        originatorAccountNumber: "123456",
        purposeOfPayment: "",
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toStrictEqual({});
    });

    it("requires beneficiaryBankName and beneficiaryBankAddress when BIC is 8 characters", () => {
      const result = validatePayment("UK", {
        beneficiaryBankBIC: "BKENGB2L",
        paymentMethod: "TRF",
        beneficiaryBankRoutingCode: "123456789",
        beneficiaryName: "Ben E",
        beneficiaryAccountNumber: "123456",
        originatorName: "John Doe",
        originatorAddress: "123 Road",
        originatorAccountNumber: "123456",
      });

      expect(result.valid).toBe(false);
      expect(result.errors.beneficiaryBankName).toBeDefined();
      expect(result.errors.beneficiaryBankAddress).toBeDefined();
    });
  });

  // --- HK Schema Tests ---
  describe("HK", () => {
    it("returns valid: true for a complete valid HK payment", () => {
      const result = validatePayment("HK", {
        beneficiaryBankBIC: "HSBCHKHHHKH",
        paymentMethod: "TRF",
        beneficiaryBankRoutingCode: "123456",
        beneficiaryName: "Jane Doe",
        beneficiaryAccountNumber: "123456789",
        originatorName: "John Doe",
        originatorAddress: "456 Ave",
        originatorAccountNumber: "987654",
        purposeOfPayment: "Trade",
        initiatingPartyName: "Initiator",
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toStrictEqual({});
    });

    it("returns valid: false when required fields are missing", () => {
      const result = validatePayment("HK", {});

      expect(result.valid).toBe(false);
      expect(result.errors.paymentMethod).toBeDefined();
      expect(result.errors.beneficiaryBankBIC).toBeDefined();
      expect(result.errors.beneficiaryBankRoutingCode).toBeDefined();
      expect(result.errors.beneficiaryName).toBeDefined();
      expect(result.errors.beneficiaryAccountNumber).toBeDefined();
      expect(result.errors.originatorName).toBeDefined();
      expect(result.errors.originatorAddress).toBeDefined();
      expect(result.errors.originatorAccountNumber).toBeDefined();
      expect(result.errors.purposeOfPayment).toBeDefined();
    });

    it("returns field error for invalid HK routing code (must be 6 digits)", () => {
      const result = validatePayment("HK", {
        beneficiaryBankBIC: "HSBCHKHHHKH",
        paymentMethod: "TRF",
        beneficiaryBankRoutingCode: "12345",
        beneficiaryName: "Jane Doe",
        beneficiaryAccountNumber: "123456789",
        originatorName: "John Doe",
        originatorAddress: "456 Ave",
        originatorAccountNumber: "987654",
        purposeOfPayment: "Trade",
        initiatingPartyName: "Initiator",
      });

      expect(result.valid).toBe(false);
      expect(result.errors.beneficiaryBankRoutingCode).toBeDefined();
    });

    it("returns field error for invalid HK account number (must be 6-9 digits)", () => {
      const result = validatePayment("HK", {
        beneficiaryBankBIC: "HSBCHKHHHKH",
        paymentMethod: "TRF",
        beneficiaryBankRoutingCode: "123456",
        beneficiaryName: "Jane Doe",
        beneficiaryAccountNumber: "12345",
        originatorName: "John Doe",
        originatorAddress: "456 Ave",
        originatorAccountNumber: "987654",
        purposeOfPayment: "Trade",
        initiatingPartyName: "Initiator",
      });

      expect(result.valid).toBe(false);
      expect(result.errors.beneficiaryAccountNumber).toBeDefined();
    });

    it("requires beneficiaryBankName and beneficiaryBankAddress when BIC is 8 characters", () => {
      const result = validatePayment("HK", {
        beneficiaryBankBIC: "HSBCHKHH",
        paymentMethod: "TRF",
        beneficiaryBankRoutingCode: "123456",
        beneficiaryName: "Jane Doe",
        beneficiaryAccountNumber: "123456789",
        originatorName: "John Doe",
        originatorAddress: "456 Ave",
        originatorAccountNumber: "987654",
        purposeOfPayment: "Trade",
        initiatingPartyName: "Initiator",
      });

      expect(result.valid).toBe(false);
      expect(result.errors.beneficiaryBankName).toBeDefined();
      expect(result.errors.beneficiaryBankAddress).toBeDefined();
    });
  });

  // --- Invalid Country ---
  describe("invalid country", () => {
    it("returns valid: false with _global error for unknown country key", () => {
      // @ts-ignore
      const result = validatePayment("XX", {});

      expect(result.valid).toBe(false);
      expect(result.errors._global).toBe("Invalid country: XX");
    });
  });
});
