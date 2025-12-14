const mockValidateOrigin = jest.fn().mockReturnValue(true);

jest.mock("@/lib/csrf", () => ({
  validateOrigin: mockValidateOrigin,
}));

beforeEach(() => {
  mockValidateOrigin.mockClear();
  mockValidateOrigin.mockReturnValue(true);
});

export { mockValidateOrigin };
