import { asyncHandler } from "../../src/utils/asyncHandler";

const mockNext = jest.fn();

const mockReq = () => ({} as any);
const mockRes = () => ({} as any);

describe("asyncHandler", () => {

    beforeEach(() => mockNext.mockClear());

    it("calls the handler function", async () => {
        const handler = jest.fn().mockResolvedValue(undefined);
        const wrapped = asyncHandler(handler);
        await wrapped(mockReq(), mockRes(), mockNext);
        expect(handler).toHaveBeenCalled();
    });

    it("passes errors to next()", async () => {
        const error = new Error("Something broke");
        const handler = jest.fn().mockRejectedValue(error);
        const wrapped = asyncHandler(handler);
        await wrapped(mockReq(), mockRes(), mockNext);
        expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("does not call next() on success", async () => {
        const handler = jest.fn().mockResolvedValue("ok");
        const wrapped = asyncHandler(handler);
        await wrapped(mockReq(), mockRes(), mockNext);
        expect(mockNext).not.toHaveBeenCalled();
    });

});