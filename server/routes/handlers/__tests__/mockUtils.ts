import { vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

// Removed spy interfaces

export function createMockReqResNext() {
    // --- Response Mock ---
    const resObj = {
        status: (code: number): Response => resObj as unknown as Response,
        json: (body: any): Response => resObj as unknown as Response,
        redirect: (url: string): void => { },
        send: (body: any): void => { },
        clearCookie: (name: string): Response => resObj as unknown as Response,
    };
    // Create spies, type will be inferred
    const resSpies = {
        status: vi.spyOn(resObj, 'status'),
        json: vi.spyOn(resObj, 'json'),
        redirect: vi.spyOn(resObj, 'redirect'),
        send: vi.spyOn(resObj, 'send'),
        clearCookie: vi.spyOn(resObj, 'clearCookie'),
    };
    resSpies.status.mockImplementation(() => resObj as unknown as Response);

    // --- Request Mock ---
    const sessionObj = {
        destroy: (cb?: (err?: any) => void) => { if (cb) cb(); },
    };
    const reqObj = {
        headers: {} as Record<string, string | string[] | undefined>,
        query: {} as Record<string, any>,
        params: {} as Record<string, any>,
        body: {} as any,
        get: (header: string): string | undefined => undefined,
        isAuthenticated: vi.fn(() => false),
        logout: vi.fn((cb?: (err?: any) => void) => { if (cb) cb(); }),
        session: sessionObj,
        userId: undefined as string | undefined,
        protocol: 'http',
    };
    // Create spies, type will be inferred
    const reqSpies = {
        get: vi.spyOn(reqObj, 'get'),
        isAuthenticated: reqObj.isAuthenticated,
        logout: reqObj.logout,
        session: {
            destroy: vi.spyOn(sessionObj, 'destroy'),
        }
    };

    // --- Next Function Mock ---
    const next: NextFunction = vi.fn();

    return {
        req: reqObj as unknown as Request,
        res: resObj as unknown as Response,
        next: next,
        // Return the inferred-type spy objects
        reqSpies,
        resSpies,
    };
}

// Potentially add other specific mock setups if needed
// e.g., createMockStorage, etc. 