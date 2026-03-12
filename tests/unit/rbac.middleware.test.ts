import { authorize } from "../../src/middleware/rbac.middleware";

const mockNext = jest.fn();

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

describe("authorize middleware", () => {

  beforeEach(() => mockNext.mockClear());

  it("calls next() when user has required role", () => {
    const req: any = { user: { id: 1, role: "owner" } };
    authorize(["owner"])(req, mockRes(), mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it("returns 403 when user lacks required role", () => {
    const req: any = { user: { id: 1, role: "customer" } };
    const res = mockRes();
    authorize(["owner"])(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("allows access when one of multiple roles matches", () => {
    const req: any = { user: { id: 1, role: "admin" } };
    authorize(["owner", "admin"])(req, mockRes(), mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it("returns 401 when no user on request", () => {
    const req: any = {};
    const res = mockRes();
    authorize(["owner"])(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 403 for kitchen role on owner-only route", () => {
    const req: any = { user: { id: 2, role: "kitchen" } };
    const res = mockRes();
    authorize(["owner"])(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(403);
  });

});