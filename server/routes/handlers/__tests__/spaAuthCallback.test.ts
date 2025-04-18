import { describe, it, expect, vi } from 'vitest';
import { handleSpaAuthCallback } from '../spaAuthCallback';

describe('handleSpaAuthCallback', () => {
    it('redirects to login if code is missing', () => {
        const req: any = { query: {} };
        const res: any = { redirect: vi.fn() };
        handleSpaAuthCallback(req, res);
        expect(res.redirect).toHaveBeenCalledWith('/login?error=No_authorization_code_received');
    });

    it('sends HTML if code is present', () => {
        const req: any = { query: { code: 'abc123' } };
        const res: any = { send: vi.fn() };
        handleSpaAuthCallback(req, res);
        expect(res.send).toHaveBeenCalledWith(expect.stringContaining('sessionStorage.setItem'));
        expect(res.send).toHaveBeenCalledWith(expect.stringContaining('abc123'));
    });
}); 