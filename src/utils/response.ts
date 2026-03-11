import { Response } from "express";
import { success } from "zod";

export const successResponse = (
    res: Response,
    message: string,
    data?: unknown,
    status = 200
) => {
    res.status(status).json({ success: true, message, data });
};


export const errorResponse = (
    res: Response,
    message: string,
    status = 500,
    error?: unknown
) => {
    res.status(status).json({ success: false, message, error });
};