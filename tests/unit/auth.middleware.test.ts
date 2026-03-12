import { authenticate } from "../../src/middleware/auth.middleware";
import { generateAccessToken } from "../../src/utils/jwt";

const mockNext = jest.fn();

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

describe("authenticate middleware", () => {

  beforeEach(() => mockNext.mockClear());

  it("calls next() with a valid Bearer token", () => {
    const token = generateAccessToken({ id: 1, role: "owner" });
    const req: any = {
      headers: { authorization: `Bearer ${token}` },
    };
    authenticate(req, mockRes(), mockNext);
    expect(mockNext).toHaveBeenCalled();
    expect(req.user.id).toBe(1);
    expect(req.user.role).toBe("owner");
  });

  it("returns 401 when no authorization header", () => {
    const req: any = { headers: {} };
    const res = mockRes();
    authenticate(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("returns 401 for an invalid token", () => {
    const req: any = {
      headers: { authorization: "Bearer bad.token.value" },
    };
    const res = mockRes();
    authenticate(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("returns 401 when header has no Bearer prefix", () => {
    const req: any = {
      headers: { authorization: "justtoken" },
    };
    const res = mockRes();
    authenticate(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("sets correct role on req.user", () => {
    const token = generateAccessToken({ id: 5, role: "kitchen" });
    const req: any = {
      headers: { authorization: `Bearer ${token}` },
    };
    authenticate(req, mockRes(), mockNext);
    expect(req.user.role).toBe("kitchen");
    expect(req.user.id).toBe(5);
  });

});