import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../../src/utils/jwt";

const payload = { id: 1, role: "owner" as const };

describe("JWT Utils", () => {

  describe("generateAccessToken", () => {
    it("should generate a string token", () => {
      const token = generateAccessToken(payload);
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3);
    });
  });

  describe("verifyAccessToken", () => {
    it("should decode a valid access token", () => {
      const token   = generateAccessToken(payload);
      const decoded = verifyAccessToken(token);
      expect(decoded.id).toBe(1);
      expect(decoded.role).toBe("owner");
    });

    it("should throw on tampered token", () => {
      expect(() => verifyAccessToken("bad.token.here")).toThrow();
    });

    it("should throw on token signed with wrong secret", () => {
      const jwt      = require("jsonwebtoken");
      const badToken = jwt.sign(payload, "wrong_secret");
      expect(() => verifyAccessToken(badToken)).toThrow();
    });
  });

  describe("generateRefreshToken", () => {
    it("should generate a token different from access token", () => {
      const access  = generateAccessToken(payload);
      const refresh = generateRefreshToken(payload);
      expect(access).not.toBe(refresh);
    });
  });

  describe("verifyRefreshToken", () => {
    it("should decode a valid refresh token", () => {
      const token   = generateRefreshToken(payload);
      const decoded = verifyRefreshToken(token);
      expect(decoded.id).toBe(1);
      expect(decoded.role).toBe("owner");
    });

    it("should reject an access token used as refresh token", () => {
      const accessToken = generateAccessToken(payload);
      expect(() => verifyRefreshToken(accessToken)).toThrow();
    });
  });

});