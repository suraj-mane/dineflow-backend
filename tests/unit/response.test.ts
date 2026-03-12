import { successResponse, errorResponse } from "../../src/utils/response";

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

describe("Response Helpers", () => {

  describe("successResponse", () => {
    it("returns 200 with correct shape by default", () => {
      const res = mockRes();
      successResponse(res, "OK", { id: 1 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "OK",
        data:    { id: 1 },
      });
    });

    it("accepts a custom status code", () => {
      const res = mockRes();
      successResponse(res, "Created", {}, 201);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("works without data param", () => {
      const res = mockRes();
      successResponse(res, "Done");
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Done",
        data:    undefined,
      });
    });
  });

  describe("errorResponse", () => {
    it("returns 500 by default", () => {
      const res = mockRes();
      errorResponse(res, "Something went wrong");
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Something went wrong",
      });
    });

    it("accepts a custom status code", () => {
      const res = mockRes();
      errorResponse(res, "Not found", 404);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

});