const mockSaveProfile = jest.fn().mockResolvedValue(undefined);
const mockGetProfile = jest.fn().mockResolvedValue({ id: "existing", ownedThriftStore: { id: "store-1" }, bio: "old bio" });

jest.mock("../../data/datasources/impl/AsyncStorageProfileLocalDataSource", () => ({
  AsyncStorageProfileLocalDataSource: jest.fn().mockImplementation(() => ({
    getProfile: mockGetProfile,
    saveProfile: mockSaveProfile
  }))
}));

describe("profileCache", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("normalizes and merges cached profile", async () => {
    const { cacheProfile } = jest.requireActual("../profileCache");

    await cacheProfile({ id: 123, notifyNewStores: undefined, notifyPromos: true } as any);

    expect(mockGetProfile).toHaveBeenCalledTimes(1);
    expect(mockSaveProfile).toHaveBeenCalledWith({
      id: "123",
      notifyNewStores: false,
      notifyPromos: true,
      ownedThriftStore: { id: "store-1" },
      bio: "old bio"
    });
  });

  it("overwrites ownedThriftStore and bio when explicitly provided", async () => {
    const { cacheProfile } = jest.requireActual("../profileCache");

    await cacheProfile({ id: "user-2", ownedThriftStore: null, bio: null, notifyNewStores: false, notifyPromos: false } as any);

    expect(mockSaveProfile).toHaveBeenCalledWith({
      id: "user-2",
      ownedThriftStore: null,
      bio: null,
      notifyNewStores: false,
      notifyPromos: false
    });
  });
});
