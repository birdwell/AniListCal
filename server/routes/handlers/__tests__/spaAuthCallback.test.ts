import { describe, it, expect, vi } from 'vitest';
import { handleSpaAuthCallback } from '../spaAuthCallback';
import { createMockReqResNext } from './mockUtils';

describe('handleSpaAuthCallback', () => {
    it('redirects to login if code is missing', () => {
        const { req, res, resSpies } = createMockReqResNext();
        handleSpaAuthCallback(req, res);
        expect(resSpies.redirect).toHaveBeenCalledWith('/login?error=No_authorization_code_received');
    });

    it('sends HTML if code is present', () => {
        const { req, res, reqSpies, resSpies } = createMockReqResNext();
        req.query.code = 'abc123';
        reqSpies.get.mockReturnValue('localhost:3000');

        handleSpaAuthCallback(req, res);

        expect(reqSpies.get).toHaveBeenCalledWith('host');
        expect(resSpies.send).toHaveBeenCalledWith(expect.stringContaining('sessionStorage.setItem'));
        expect(resSpies.send).toHaveBeenCalledWith(expect.stringContaining('abc123'));
    });
}); 