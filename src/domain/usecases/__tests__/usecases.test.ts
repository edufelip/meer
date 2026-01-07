import { ConfirmStorePhotosUseCase } from "../ConfirmStorePhotosUseCase";
import { CreateContentUseCase } from "../CreateContentUseCase";
import { CreateContentCommentUseCase } from "../CreateContentCommentUseCase";
import { CreateOrUpdateStoreUseCase } from "../CreateOrUpdateStoreUseCase";
import { DeleteAccountUseCase } from "../DeleteAccountUseCase";
import { DeleteContentCommentUseCase } from "../DeleteContentCommentUseCase";
import { DeleteContentUseCase } from "../DeleteContentUseCase";
import { DeleteMyFeedbackUseCase } from "../DeleteMyFeedbackUseCase";
import { GetCachedCategoriesUseCase } from "../GetCachedCategoriesUseCase";
import { GetCachedProfileUseCase } from "../GetCachedProfileUseCase";
import { GetCategoriesUseCase } from "../GetCategoriesUseCase";
import { GetContentCommentsUseCase } from "../GetContentCommentsUseCase";
import { GetCurrentUserUseCase } from "../GetCurrentUserUseCase";
import { GetFavoriteThriftStoresUseCase } from "../GetFavoriteThriftStoresUseCase";
import { GetFeaturedThriftStoresUseCase } from "../GetFeaturedThriftStoresUseCase";
import { GetGuideContentByIdUseCase } from "../GetGuideContentByIdUseCase";
import { GetGuideContentUseCase } from "../GetGuideContentUseCase";
import { GetHomeUseCase } from "../GetHomeUseCase";
import { GetMyFeedbackUseCase } from "../GetMyFeedbackUseCase";
import { GetNearbyPaginatedUseCase } from "../GetNearbyPaginatedUseCase";
import { GetNearbyThriftStoresUseCase } from "../GetNearbyThriftStoresUseCase";
import { GetProfileUseCase } from "../GetProfileUseCase";
import { GetStoreRatingsUseCase } from "../GetStoreRatingsUseCase";
import { GetStoresByCategoryUseCase } from "../GetStoresByCategoryUseCase";
import { GetThriftStoreByIdUseCase } from "../GetThriftStoreByIdUseCase";
import { IsFavoriteThriftStoreUseCase } from "../IsFavoriteThriftStoreUseCase";
import { LikeContentUseCase } from "../LikeContentUseCase";
import { RequestAvatarUploadSlotUseCase } from "../RequestAvatarUploadSlotUseCase";
import { RequestContentImageUploadUseCase } from "../RequestContentImageUploadUseCase";
import { RequestStorePhotoUploadsUseCase } from "../RequestStorePhotoUploadsUseCase";
import { SearchThriftStoresUseCase } from "../SearchThriftStoresUseCase";
import { SendSupportMessageUseCase } from "../SendSupportMessageUseCase";
import { ToggleFavoriteThriftStoreUseCase } from "../ToggleFavoriteThriftStoreUseCase";
import { UnlikeContentUseCase } from "../UnlikeContentUseCase";
import { UnregisterPushTokenUseCase } from "../UnregisterPushTokenUseCase";
import { UpdateContentUseCase } from "../UpdateContentUseCase";
import { UpdateContentCommentUseCase } from "../UpdateContentCommentUseCase";
import { UpdateProfileUseCase } from "../UpdateProfileUseCase";
import { UpsertFeedbackUseCase } from "../UpsertFeedbackUseCase";

describe("domain use cases", () => {
  it("ConfirmStorePhotosUseCase delegates to repository", async () => {
    const confirmPhotos = jest.fn().mockResolvedValue({ id: "store-1" });
    const useCase = new ConfirmStorePhotosUseCase({ confirmPhotos } as any);

    const result = await useCase.execute({
      storeId: "store-1",
      photos: [{ position: 0, fileKey: "file-1" }],
      deletePhotoIds: ["photo-1"]
    });

    expect(confirmPhotos).toHaveBeenCalledWith("store-1", [{ position: 0, fileKey: "file-1" }], ["photo-1"]);
    expect(result).toEqual({ id: "store-1" });
  });

  it("CreateContentUseCase delegates to repository", async () => {
    const createContent = jest.fn().mockResolvedValue({ id: "content-1" });
    const useCase = new CreateContentUseCase({ createContent } as any);

    const payload = { title: "Title", description: "Desc", storeId: "store-1" };
    const result = await useCase.execute(payload);

    expect(createContent).toHaveBeenCalledWith(payload);
    expect(result).toEqual({ id: "content-1" });
  });

  it("CreateContentCommentUseCase validates and delegates", async () => {
    const create = jest.fn().mockResolvedValue({ id: "comment-1" });
    const useCase = new CreateContentCommentUseCase({ create } as any);

    const result = await useCase.execute({ contentId: "content-1", body: "Oi" });

    expect(create).toHaveBeenCalledWith("content-1", "Oi");
    expect(result).toEqual({ id: "comment-1" });
  });

  it("CreateContentCommentUseCase rejects empty body", async () => {
    const create = jest.fn();
    const useCase = new CreateContentCommentUseCase({ create } as any);

    await expect(useCase.execute({ contentId: "content-1", body: "   " })).rejects.toThrow(
      "Comentário não pode ser vazio."
    );
    expect(create).not.toHaveBeenCalled();
  });

  it("CreateOrUpdateStoreUseCase delegates create and update", async () => {
    const createStore = jest.fn().mockResolvedValue({ id: "store-1" });
    const updateStore = jest.fn().mockResolvedValue({ id: "store-1", name: "Updated" });
    const useCase = new CreateOrUpdateStoreUseCase({ createStore, updateStore } as any);

    const createPayload = { name: "Store" } as any;
    const updatePayload = { name: "Updated" } as any;

    const created = await useCase.executeCreate(createPayload);
    const updated = await useCase.executeUpdate("store-1", updatePayload);

    expect(createStore).toHaveBeenCalledWith(createPayload);
    expect(updateStore).toHaveBeenCalledWith("store-1", updatePayload);
    expect(created).toEqual({ id: "store-1" });
    expect(updated).toEqual({ id: "store-1", name: "Updated" });
  });

  it("DeleteAccountUseCase delegates to repository", async () => {
    const deleteAccount = jest.fn().mockResolvedValue(undefined);
    const useCase = new DeleteAccountUseCase({ deleteAccount } as any);

    await useCase.execute("user@example.com");

    expect(deleteAccount).toHaveBeenCalledWith("user@example.com");
  });

  it("DeleteContentCommentUseCase delegates to repository", async () => {
    const deleteComment = jest.fn().mockResolvedValue(undefined);
    const useCase = new DeleteContentCommentUseCase({ delete: deleteComment } as any);

    await useCase.execute({ contentId: "content-1", commentId: "comment-1" });

    expect(deleteComment).toHaveBeenCalledWith("content-1", "comment-1");
  });

  it("DeleteContentUseCase delegates to repository", async () => {
    const deleteContent = jest.fn().mockResolvedValue(undefined);
    const useCase = new DeleteContentUseCase({ deleteContent } as any);

    await useCase.execute("content-1");

    expect(deleteContent).toHaveBeenCalledWith("content-1");
  });

  it("DeleteMyFeedbackUseCase delegates to repository", async () => {
    const deleteFeedback = jest.fn().mockResolvedValue(undefined);
    const useCase = new DeleteMyFeedbackUseCase({ delete: deleteFeedback } as any);

    await useCase.execute("store-1");

    expect(deleteFeedback).toHaveBeenCalledWith("store-1");
  });

  it("GetCachedCategoriesUseCase delegates to repository", async () => {
    const getCached = jest.fn().mockResolvedValue([{ id: "cat-1" }]);
    const useCase = new GetCachedCategoriesUseCase({ getCached } as any);

    const result = await useCase.execute();

    expect(getCached).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ id: "cat-1" }]);
  });

  it("GetCachedProfileUseCase delegates to repository", async () => {
    const getCachedProfile = jest.fn().mockResolvedValue({ id: "user-1" });
    const useCase = new GetCachedProfileUseCase({ getCachedProfile } as any);

    const result = await useCase.execute();

    expect(getCachedProfile).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ id: "user-1" });
  });

  it("GetCategoriesUseCase delegates to repository", async () => {
    const list = jest.fn().mockResolvedValue([{ id: "cat-1" }]);
    const useCase = new GetCategoriesUseCase({ list } as any);

    const result = await useCase.execute();

    expect(list).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ id: "cat-1" }]);
  });

  it("GetContentCommentsUseCase delegates to repository", async () => {
    const list = jest.fn().mockResolvedValue({ items: [], page: 0, hasNext: false });
    const useCase = new GetContentCommentsUseCase({ list } as any);

    const params = { contentId: "content-1", page: 0, pageSize: 20 };
    const result = await useCase.execute(params);

    expect(list).toHaveBeenCalledWith(params);
    expect(result).toEqual({ items: [], page: 0, hasNext: false });
  });

  it("GetCurrentUserUseCase delegates to repository", async () => {
    const getCurrentUser = jest.fn().mockResolvedValue({ id: "user-1" });
    const useCase = new GetCurrentUserUseCase({ getCurrentUser } as any);

    const result = await useCase.execute();

    expect(getCurrentUser).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ id: "user-1" });
  });

  it("GetFavoriteThriftStoresUseCase delegates to repository", async () => {
    const getAll = jest.fn().mockResolvedValue([{ id: "store-1" }]);
    const useCase = new GetFavoriteThriftStoresUseCase({ getAll } as any);

    const result = await useCase.execute();

    expect(getAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ id: "store-1" }]);
  });

  it("GetFeaturedThriftStoresUseCase delegates to repository", async () => {
    const getFeatured = jest.fn().mockResolvedValue([{ id: "store-1" }]);
    const useCase = new GetFeaturedThriftStoresUseCase({ getFeatured } as any);

    const params = { lat: 1, lng: 2, forceRefresh: true };
    const result = await useCase.execute(params);

    expect(getFeatured).toHaveBeenCalledWith(params);
    expect(result).toEqual([{ id: "store-1" }]);
  });

  it("GetGuideContentUseCase delegates to repository", async () => {
    const listLatest = jest.fn().mockResolvedValue({ items: [{ id: "content-1" }] });
    const useCase = new GetGuideContentUseCase({ listLatest } as any);

    const params = { page: 1, pageSize: 5 };
    const result = await useCase.execute(params as any);

    expect(listLatest).toHaveBeenCalledWith(params);
    expect(result).toEqual({ items: [{ id: "content-1" }] });
  });

  it("GetGuideContentByIdUseCase delegates to repository", async () => {
    const getById = jest.fn().mockResolvedValue({ id: "content-1" });
    const useCase = new GetGuideContentByIdUseCase({ getById } as any);

    const result = await useCase.execute("content-1");

    expect(getById).toHaveBeenCalledWith("content-1");
    expect(result).toEqual({ id: "content-1" });
  });

  it("GetHomeUseCase aggregates content and defaults to empty arrays", async () => {
    const getFeatured = jest.fn().mockResolvedValue(undefined);
    const listNearbyPaginated = jest.fn().mockResolvedValue({ items: undefined });
    const listLatest = jest.fn().mockResolvedValue({ items: undefined });

    const useCase = new GetHomeUseCase(
      { getFeatured, listNearbyPaginated } as any,
      { listLatest } as any
    );

    const result = await useCase.execute({ lat: 10, lng: 20 });

    expect(getFeatured).toHaveBeenCalledWith({ lat: 10, lng: 20 });
    expect(listNearbyPaginated).toHaveBeenCalledWith({ page: 1, pageSize: 10, lat: 10, lng: 20 });
    expect(listLatest).toHaveBeenCalledWith({ page: 0, pageSize: 10 });
    expect(result).toEqual({ featured: [], nearby: [], content: [] });
  });

  it("GetMyFeedbackUseCase delegates to repository", async () => {
    const getMine = jest.fn().mockResolvedValue({ id: "feedback-1" });
    const useCase = new GetMyFeedbackUseCase({ getMine } as any);

    const result = await useCase.execute("store-1");

    expect(getMine).toHaveBeenCalledWith("store-1");
    expect(result).toEqual({ id: "feedback-1" });
  });

  it("GetStoreRatingsUseCase delegates to repository", async () => {
    const listStoreRatings = jest.fn().mockResolvedValue({ items: [], page: 1, hasNext: false });
    const useCase = new GetStoreRatingsUseCase({ listStoreRatings } as any);

    const params = { storeId: "store-1", page: 2, pageSize: 5 };
    const result = await useCase.execute(params);

    expect(listStoreRatings).toHaveBeenCalledWith(params);
    expect(result).toEqual({ items: [], page: 1, hasNext: false });
  });

  it("GetNearbyPaginatedUseCase delegates to repository", async () => {
    const listNearbyPaginated = jest.fn().mockResolvedValue({ items: [{ id: "store-1" }], page: 1, hasNext: false });
    const useCase = new GetNearbyPaginatedUseCase({ listNearbyPaginated } as any);

    const params = { page: 2, pageSize: 3, lat: 1, lng: 2 };
    const result = await useCase.execute(params);

    expect(listNearbyPaginated).toHaveBeenCalledWith(params);
    expect(result).toEqual({ items: [{ id: "store-1" }], page: 1, hasNext: false });
  });

  it("GetNearbyThriftStoresUseCase returns items or empty array", async () => {
    const getNearby = jest.fn().mockResolvedValue({ items: undefined });
    const useCase = new GetNearbyThriftStoresUseCase({ getNearby } as any);

    const result = await useCase.execute({ lat: 1, lng: 2 });

    expect(getNearby).toHaveBeenCalledWith({ lat: 1, lng: 2 });
    expect(result).toEqual([]);
  });

  it("GetProfileUseCase delegates to repository", async () => {
    const getProfile = jest.fn().mockResolvedValue({ id: "user-1" });
    const useCase = new GetProfileUseCase({ getProfile } as any);

    const result = await useCase.execute();

    expect(getProfile).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ id: "user-1" });
  });

  it("GetStoresByCategoryUseCase delegates to repository", async () => {
    const listByCategory = jest.fn().mockResolvedValue({ items: [{ id: "store-1" }], page: 1, hasNext: true });
    const useCase = new GetStoresByCategoryUseCase({ listByCategory } as any);

    const params = { categoryId: "cat-1", page: 2, pageSize: 5 };
    const result = await useCase.execute(params);

    expect(listByCategory).toHaveBeenCalledWith(params);
    expect(result).toEqual({ items: [{ id: "store-1" }], page: 1, hasNext: true });
  });

  it("GetThriftStoreByIdUseCase delegates to repository", async () => {
    const getById = jest.fn().mockResolvedValue({ id: "store-1" });
    const useCase = new GetThriftStoreByIdUseCase({ getById } as any);

    const result = await useCase.execute("store-1");

    expect(getById).toHaveBeenCalledWith("store-1");
    expect(result).toEqual({ id: "store-1" });
  });

  it("IsFavoriteThriftStoreUseCase delegates to repository", async () => {
    const isFavorite = jest.fn().mockResolvedValue(true);
    const useCase = new IsFavoriteThriftStoreUseCase({ isFavorite } as any);

    const result = await useCase.execute("store-1");

    expect(isFavorite).toHaveBeenCalledWith("store-1");
    expect(result).toBe(true);
  });

  it("LikeContentUseCase delegates to repository", async () => {
    const like = jest.fn().mockResolvedValue(undefined);
    const useCase = new LikeContentUseCase({ like } as any);

    await useCase.execute("content-1");

    expect(like).toHaveBeenCalledWith("content-1");
  });

  it("UnlikeContentUseCase delegates to repository", async () => {
    const unlike = jest.fn().mockResolvedValue(undefined);
    const useCase = new UnlikeContentUseCase({ unlike } as any);

    await useCase.execute("content-1");

    expect(unlike).toHaveBeenCalledWith("content-1");
  });

  it("RequestAvatarUploadSlotUseCase delegates to repository", async () => {
    const requestAvatarUploadSlot = jest.fn().mockResolvedValue({ uploadUrl: "url", fileKey: "key", contentType: "image/jpeg" });
    const useCase = new RequestAvatarUploadSlotUseCase({ requestAvatarUploadSlot } as any);

    const result = await useCase.execute("image/jpeg");

    expect(requestAvatarUploadSlot).toHaveBeenCalledWith("image/jpeg");
    expect(result).toEqual({ uploadUrl: "url", fileKey: "key", contentType: "image/jpeg" });
  });

  it("RequestContentImageUploadUseCase delegates to repository", async () => {
    const requestImageUpload = jest.fn().mockResolvedValue({ uploadUrl: "url" });
    const useCase = new RequestContentImageUploadUseCase({ requestImageUpload } as any);

    const result = await useCase.execute("content-1", "image/png");

    expect(requestImageUpload).toHaveBeenCalledWith("content-1", "image/png");
    expect(result).toEqual({ uploadUrl: "url" });
  });

  it("RequestStorePhotoUploadsUseCase delegates to repository", async () => {
    const requestPhotoUploads = jest.fn().mockResolvedValue([{ uploadUrl: "url", fileKey: "key" }]);
    const useCase = new RequestStorePhotoUploadsUseCase({ requestPhotoUploads } as any);

    const result = await useCase.execute({ storeId: "store-1", count: 2, contentTypes: ["image/png"] });

    expect(requestPhotoUploads).toHaveBeenCalledWith("store-1", { count: 2, contentTypes: ["image/png"] });
    expect(result).toEqual([{ uploadUrl: "url", fileKey: "key" }]);
  });

  it("SearchThriftStoresUseCase delegates to repository", async () => {
    const search = jest.fn().mockResolvedValue([{ id: "store-1" }]);
    const useCase = new SearchThriftStoresUseCase({ search } as any);

    const result = await useCase.execute("query");

    expect(search).toHaveBeenCalledWith("query");
    expect(result).toEqual([{ id: "store-1" }]);
  });

  it("SendSupportMessageUseCase delegates to repository", async () => {
    const sendMessage = jest.fn().mockResolvedValue(undefined);
    const useCase = new SendSupportMessageUseCase({ sendMessage } as any);

    await useCase.execute({ message: "help" } as any);

    expect(sendMessage).toHaveBeenCalledWith({ message: "help" });
  });

  it("ToggleFavoriteThriftStoreUseCase delegates to repository", async () => {
    const toggle = jest.fn().mockResolvedValue(true);
    const useCase = new ToggleFavoriteThriftStoreUseCase({ toggle } as any);

    const result = await useCase.execute({ id: "store-1" } as any);

    expect(toggle).toHaveBeenCalledWith({ id: "store-1" });
    expect(result).toBe(true);
  });

  it("UpdateContentUseCase delegates to repository", async () => {
    const updateContent = jest.fn().mockResolvedValue({ id: "content-1" });
    const useCase = new UpdateContentUseCase({ updateContent } as any);

    const payload = { title: "New" };
    const result = await useCase.execute("content-1", payload);

    expect(updateContent).toHaveBeenCalledWith("content-1", payload);
    expect(result).toEqual({ id: "content-1" });
  });

  it("UpdateContentCommentUseCase validates and delegates", async () => {
    const update = jest.fn().mockResolvedValue({ id: "comment-1" });
    const useCase = new UpdateContentCommentUseCase({ update } as any);

    const result = await useCase.execute({ contentId: "content-1", commentId: "comment-1", body: "Oi" });

    expect(update).toHaveBeenCalledWith("content-1", "comment-1", "Oi");
    expect(result).toEqual({ id: "comment-1" });
  });

  it("UpdateProfileUseCase delegates to repository", async () => {
    const updateProfile = jest.fn().mockResolvedValue({ id: "user-1" });
    const useCase = new UpdateProfileUseCase({ updateProfile } as any);

    const payload = { name: "New Name" } as any;
    const result = await useCase.execute(payload);

    expect(updateProfile).toHaveBeenCalledWith(payload);
    expect(result).toEqual({ id: "user-1" });
  });

  it("UnregisterPushTokenUseCase uses stored environment when available", async () => {
    const unregisterToken = jest.fn().mockResolvedValue(undefined);
    const getLastEnvironment = jest.fn().mockResolvedValue("staging");
    const useCase = new UnregisterPushTokenUseCase({ unregisterToken, getLastEnvironment } as any);

    await useCase.execute("prod");

    expect(getLastEnvironment).toHaveBeenCalled();
    expect(unregisterToken).toHaveBeenCalledWith("staging");
  });

  it("UnregisterPushTokenUseCase falls back to provided environment", async () => {
    const unregisterToken = jest.fn().mockResolvedValue(undefined);
    const getLastEnvironment = jest.fn().mockResolvedValue(null);
    const useCase = new UnregisterPushTokenUseCase({ unregisterToken, getLastEnvironment } as any);

    await useCase.execute("prod");

    expect(unregisterToken).toHaveBeenCalledWith("prod");
  });

  it("UpsertFeedbackUseCase delegates to repository", async () => {
    const upsert = jest.fn().mockResolvedValue(undefined);
    const useCase = new UpsertFeedbackUseCase({ upsert } as any);

    await useCase.execute({ id: "feedback-1" } as any);

    expect(upsert).toHaveBeenCalledWith({ id: "feedback-1" });
  });
});
