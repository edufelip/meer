import React, { PropsWithChildren, createContext, useContext, useMemo } from "react";
import { AsyncStorageUserLocalDataSource } from "../../data/datasources/impl/AsyncStorageUserLocalDataSource";
import { UserRepositoryImpl } from "../../data/repositories/UserRepositoryImpl";
import { HttpThriftStoreRemoteDataSource } from "../../data/datasources/impl/HttpThriftStoreRemoteDataSource";
import { HttpGuideContentRemoteDataSource } from "../../data/datasources/impl/HttpGuideContentRemoteDataSource";
import { HttpContentCommentRemoteDataSource } from "../../data/datasources/impl/HttpContentCommentRemoteDataSource";
import { HttpContentLikeRemoteDataSource } from "../../data/datasources/impl/HttpContentLikeRemoteDataSource";
import { HttpCategoryRemoteDataSource } from "../../data/datasources/impl/HttpCategoryRemoteDataSource";
import { AsyncStorageCategoryLocalDataSource } from "../../data/datasources/impl/AsyncStorageCategoryLocalDataSource";
import { HttpProfileRemoteDataSource } from "../../data/datasources/impl/HttpProfileRemoteDataSource";
import { AsyncStorageProfileLocalDataSource } from "../../data/datasources/impl/AsyncStorageProfileLocalDataSource";
import { AsyncStorageFeaturedLocalDataSource } from "../../data/datasources/impl/AsyncStorageFeaturedLocalDataSource";
import { ThriftStoreRepositoryJson } from "../../data/repositories/ThriftStoreRepositoryJson";
import { GuideContentRepositoryJson } from "../../data/repositories/GuideContentRepositoryJson";
import { ContentCommentRepositoryImpl } from "../../data/repositories/ContentCommentRepositoryImpl";
import { ContentLikeRepositoryImpl } from "../../data/repositories/ContentLikeRepositoryImpl";
import { CategoryRepositoryJson } from "../../data/repositories/CategoryRepositoryJson";
import { ProfileRepositoryJson } from "../../data/repositories/ProfileRepositoryJson";
import { GetCurrentUserUseCase } from "../../domain/usecases/GetCurrentUserUseCase";
import { GetFeaturedThriftStoresUseCase } from "../../domain/usecases/GetFeaturedThriftStoresUseCase";
import { GetNearbyThriftStoresUseCase } from "../../domain/usecases/GetNearbyThriftStoresUseCase";
import { GetGuideContentUseCase } from "../../domain/usecases/GetGuideContentUseCase";
import { GetGuideContentByIdUseCase } from "../../domain/usecases/GetGuideContentByIdUseCase";
import { GetContentCommentsUseCase } from "../../domain/usecases/GetContentCommentsUseCase";
import { CreateContentCommentUseCase } from "../../domain/usecases/CreateContentCommentUseCase";
import { UpdateContentCommentUseCase } from "../../domain/usecases/UpdateContentCommentUseCase";
import { DeleteContentCommentUseCase } from "../../domain/usecases/DeleteContentCommentUseCase";
import { LikeContentUseCase } from "../../domain/usecases/LikeContentUseCase";
import { UnlikeContentUseCase } from "../../domain/usecases/UnlikeContentUseCase";
import { CreateContentUseCase } from "../../domain/usecases/CreateContentUseCase";
import { UpdateContentUseCase } from "../../domain/usecases/UpdateContentUseCase";
import { RequestContentImageUploadUseCase } from "../../domain/usecases/RequestContentImageUploadUseCase";
import { DeleteContentUseCase } from "../../domain/usecases/DeleteContentUseCase";
import { GetFavoriteThriftStoresUseCase } from "../../domain/usecases/GetFavoriteThriftStoresUseCase";
import { GetCategoriesUseCase } from "../../domain/usecases/GetCategoriesUseCase";
import { GetCachedCategoriesUseCase } from "../../domain/usecases/GetCachedCategoriesUseCase";
import { GetThriftStoreByIdUseCase } from "../../domain/usecases/GetThriftStoreByIdUseCase";
import { GetStoresByCategoryUseCase } from "../../domain/usecases/GetStoresByCategoryUseCase";
import { SearchThriftStoresUseCase } from "../../domain/usecases/SearchThriftStoresUseCase";
import { GetProfileUseCase } from "../../domain/usecases/GetProfileUseCase";
import { GetCachedProfileUseCase } from "../../domain/usecases/GetCachedProfileUseCase";
import { UpdateProfileUseCase } from "../../domain/usecases/UpdateProfileUseCase";
import { FavoriteRepositoryHybrid } from "../../data/repositories/FavoriteRepositoryHybrid";
import { HttpFavoriteRemoteDataSource } from "../../data/datasources/impl/HttpFavoriteRemoteDataSource";
import { ToggleFavoriteThriftStoreUseCase } from "../../domain/usecases/ToggleFavoriteThriftStoreUseCase";
import { IsFavoriteThriftStoreUseCase } from "../../domain/usecases/IsFavoriteThriftStoreUseCase";
import type { FavoriteRepository } from "../../domain/repositories/FavoriteRepository";
import { GetNearbyPaginatedUseCase } from "../../domain/usecases/GetNearbyPaginatedUseCase";
import { HttpFeedbackRemoteDataSource } from "../../data/datasources/impl/HttpFeedbackRemoteDataSource";
import { FeedbackRepositoryImpl } from "../../data/repositories/FeedbackRepositoryImpl";
import { GetMyFeedbackUseCase } from "../../domain/usecases/GetMyFeedbackUseCase";
import { UpsertFeedbackUseCase } from "../../domain/usecases/UpsertFeedbackUseCase";
import { DeleteMyFeedbackUseCase } from "../../domain/usecases/DeleteMyFeedbackUseCase";
import { GetStoreRatingsUseCase } from "../../domain/usecases/GetStoreRatingsUseCase";
import { DeleteAccountUseCase } from "../../domain/usecases/DeleteAccountUseCase";
import { CreateOrUpdateStoreUseCase } from "../../domain/usecases/CreateOrUpdateStoreUseCase";
import { HttpSupportRemoteDataSource } from "../../data/datasources/impl/HttpSupportRemoteDataSource";
import { SupportRepositoryImpl } from "../../data/repositories/SupportRepositoryImpl";
import { SendSupportMessageUseCase } from "../../domain/usecases/SendSupportMessageUseCase";
import { RequestAvatarUploadSlotUseCase } from "../../domain/usecases/RequestAvatarUploadSlotUseCase";
import { RequestStorePhotoUploadsUseCase } from "../../domain/usecases/RequestStorePhotoUploadsUseCase";
import { ConfirmStorePhotosUseCase } from "../../domain/usecases/ConfirmStorePhotosUseCase";
import { AsyncStoragePushNotificationsLocalDataSource } from "../../data/datasources/impl/AsyncStoragePushNotificationsLocalDataSource";
import { HttpPushNotificationsRemoteDataSource } from "../../data/datasources/impl/HttpPushNotificationsRemoteDataSource";
import { PushNotificationsRepositoryImpl } from "../../data/repositories/PushNotificationsRepositoryImpl";
import { RequestPushPermissionUseCase } from "../../domain/usecases/RequestPushPermissionUseCase";
import { GetPushTokenUseCase } from "../../domain/usecases/GetPushTokenUseCase";
import { RegisterPushTokenUseCase } from "../../domain/usecases/RegisterPushTokenUseCase";
import { UnregisterPushTokenUseCase } from "../../domain/usecases/UnregisterPushTokenUseCase";
import { ObservePushTokenRefreshUseCase } from "../../domain/usecases/ObservePushTokenRefreshUseCase";
import { ObserveNotificationOpenUseCase } from "../../domain/usecases/ObserveNotificationOpenUseCase";
import { GetInitialNotificationUseCase } from "../../domain/usecases/GetInitialNotificationUseCase";
import { SyncPushTopicsUseCase } from "../../domain/usecases/SyncPushTopicsUseCase";

interface Dependencies {
  getCurrentUserUseCase: GetCurrentUserUseCase;
  getFeaturedThriftStoresUseCase: GetFeaturedThriftStoresUseCase;
  getNearbyThriftStoresUseCase: GetNearbyThriftStoresUseCase;
  getGuideContentUseCase: GetGuideContentUseCase;
  getGuideContentByIdUseCase: GetGuideContentByIdUseCase;
  getContentCommentsUseCase: GetContentCommentsUseCase;
  createContentCommentUseCase: CreateContentCommentUseCase;
  updateContentCommentUseCase: UpdateContentCommentUseCase;
  deleteContentCommentUseCase: DeleteContentCommentUseCase;
  likeContentUseCase: LikeContentUseCase;
  unlikeContentUseCase: UnlikeContentUseCase;
  createContentUseCase: CreateContentUseCase;
  updateContentUseCase: UpdateContentUseCase;
  requestContentImageUploadUseCase: RequestContentImageUploadUseCase;
  deleteContentUseCase: DeleteContentUseCase;
  getFavoriteThriftStoresUseCase: GetFavoriteThriftStoresUseCase;
  searchThriftStoresUseCase: SearchThriftStoresUseCase;
  toggleFavoriteThriftStoreUseCase: ToggleFavoriteThriftStoreUseCase;
  isFavoriteThriftStoreUseCase: IsFavoriteThriftStoreUseCase;
  getCategoriesUseCase: GetCategoriesUseCase;
  getCachedCategoriesUseCase: GetCachedCategoriesUseCase;
  getThriftStoreByIdUseCase: GetThriftStoreByIdUseCase;
  getStoresByCategoryUseCase: GetStoresByCategoryUseCase;
  getNearbyPaginatedUseCase: GetNearbyPaginatedUseCase;
  getProfileUseCase: GetProfileUseCase;
  getCachedProfileUseCase: GetCachedProfileUseCase;
  updateProfileUseCase: UpdateProfileUseCase;
  deleteAccountUseCase: DeleteAccountUseCase;
  createOrUpdateStoreUseCase: CreateOrUpdateStoreUseCase;
  requestStorePhotoUploadsUseCase: RequestStorePhotoUploadsUseCase;
  confirmStorePhotosUseCase: ConfirmStorePhotosUseCase;
  requestAvatarUploadSlotUseCase: RequestAvatarUploadSlotUseCase;
  favoriteRepository: FavoriteRepository;
  getMyFeedbackUseCase: GetMyFeedbackUseCase;
  upsertFeedbackUseCase: UpsertFeedbackUseCase;
  deleteMyFeedbackUseCase: DeleteMyFeedbackUseCase;
  getStoreRatingsUseCase: GetStoreRatingsUseCase;
  sendSupportMessageUseCase: SendSupportMessageUseCase;
  requestPushPermissionUseCase: RequestPushPermissionUseCase;
  getPushTokenUseCase: GetPushTokenUseCase;
  registerPushTokenUseCase: RegisterPushTokenUseCase;
  unregisterPushTokenUseCase: UnregisterPushTokenUseCase;
  syncPushTopicsUseCase: SyncPushTopicsUseCase;
  observePushTokenRefreshUseCase: ObservePushTokenRefreshUseCase;
  observeNotificationOpenUseCase: ObserveNotificationOpenUseCase;
  getInitialNotificationUseCase: GetInitialNotificationUseCase;
}

const DependenciesContext = createContext<Dependencies | undefined>(undefined);

export function useDependencies(): Dependencies {
  const ctx = useContext(DependenciesContext);
  if (!ctx) {
    throw new Error("useDependencies must be used within DependenciesProvider");
  }
  return ctx;
}

export function DependenciesProvider(props: PropsWithChildren) {
  const { children } = props;

  const value = useMemo<Dependencies>(() => {
    const userLocalDataSource = new AsyncStorageUserLocalDataSource();
    const userRepository = new UserRepositoryImpl(userLocalDataSource);
    const thriftStoreRemote = new HttpThriftStoreRemoteDataSource();
    const favoriteRemote = new HttpFavoriteRemoteDataSource();
    const feedbackRemote = new HttpFeedbackRemoteDataSource();
    const supportRemote = new HttpSupportRemoteDataSource();
    const pushRemote = new HttpPushNotificationsRemoteDataSource();
    const pushLocal = new AsyncStoragePushNotificationsLocalDataSource();
    const guideContentRemote = new HttpGuideContentRemoteDataSource();
    const contentCommentRemote = new HttpContentCommentRemoteDataSource();
    const contentLikeRemote = new HttpContentLikeRemoteDataSource();
    const categoryRemote = new HttpCategoryRemoteDataSource();
    const categoryLocal = new AsyncStorageCategoryLocalDataSource();
    const featuredLocal = new AsyncStorageFeaturedLocalDataSource();
    const profileRemote = new HttpProfileRemoteDataSource();
    const profileLocal = new AsyncStorageProfileLocalDataSource();
    const favoriteRepository = new FavoriteRepositoryHybrid(favoriteRemote);
    const feedbackRepository = new FeedbackRepositoryImpl(feedbackRemote);
    const supportRepository = new SupportRepositoryImpl(supportRemote);
    const pushRepository = new PushNotificationsRepositoryImpl(pushRemote, pushLocal);

    const thriftStoreRepository = new ThriftStoreRepositoryJson(thriftStoreRemote, featuredLocal);
    const guideContentRepository = new GuideContentRepositoryJson(guideContentRemote);
    const contentCommentRepository = new ContentCommentRepositoryImpl(contentCommentRemote);
    const contentLikeRepository = new ContentLikeRepositoryImpl(contentLikeRemote);
    const categoryRepository = new CategoryRepositoryJson(categoryRemote, categoryLocal);
    const profileRepository = new ProfileRepositoryJson(profileRemote, profileLocal);

    const getCurrentUserUseCase = new GetCurrentUserUseCase(userRepository);
    const getFeaturedThriftStoresUseCase = new GetFeaturedThriftStoresUseCase(thriftStoreRepository);
    const getNearbyThriftStoresUseCase = new GetNearbyThriftStoresUseCase(thriftStoreRepository);
    const getGuideContentUseCase = new GetGuideContentUseCase(guideContentRepository);
    const getGuideContentByIdUseCase = new GetGuideContentByIdUseCase(guideContentRepository);
    const getContentCommentsUseCase = new GetContentCommentsUseCase(contentCommentRepository);
    const createContentCommentUseCase = new CreateContentCommentUseCase(contentCommentRepository);
    const updateContentCommentUseCase = new UpdateContentCommentUseCase(contentCommentRepository);
    const deleteContentCommentUseCase = new DeleteContentCommentUseCase(contentCommentRepository);
    const likeContentUseCase = new LikeContentUseCase(contentLikeRepository);
    const unlikeContentUseCase = new UnlikeContentUseCase(contentLikeRepository);
    const createContentUseCase = new CreateContentUseCase(guideContentRepository);
    const updateContentUseCase = new UpdateContentUseCase(guideContentRepository);
    const requestContentImageUploadUseCase = new RequestContentImageUploadUseCase(guideContentRepository);
    const deleteContentUseCase = new DeleteContentUseCase(guideContentRepository);
    const getFavoriteThriftStoresUseCase = new GetFavoriteThriftStoresUseCase(favoriteRepository);
    const searchThriftStoresUseCase = new SearchThriftStoresUseCase(thriftStoreRepository);
    const toggleFavoriteThriftStoreUseCase = new ToggleFavoriteThriftStoreUseCase(favoriteRepository);
    const isFavoriteThriftStoreUseCase = new IsFavoriteThriftStoreUseCase(favoriteRepository);
    const getCategoriesUseCase = new GetCategoriesUseCase(categoryRepository);
    const getCachedCategoriesUseCase = new GetCachedCategoriesUseCase(categoryRepository);
    const getThriftStoreByIdUseCase = new GetThriftStoreByIdUseCase(thriftStoreRepository);
    const getStoresByCategoryUseCase = new GetStoresByCategoryUseCase(thriftStoreRepository);
    const getNearbyPaginatedUseCase = new GetNearbyPaginatedUseCase(thriftStoreRepository);
    const getProfileUseCase = new GetProfileUseCase(profileRepository);
    const getCachedProfileUseCase = new GetCachedProfileUseCase(profileRepository);
    const updateProfileUseCase = new UpdateProfileUseCase(profileRepository);
    const deleteAccountUseCase = new DeleteAccountUseCase(profileRepository);
    const requestAvatarUploadSlotUseCase = new RequestAvatarUploadSlotUseCase(profileRepository);
    const createOrUpdateStoreUseCase = new CreateOrUpdateStoreUseCase(thriftStoreRepository);
    const requestStorePhotoUploadsUseCase = new RequestStorePhotoUploadsUseCase(thriftStoreRepository);
    const confirmStorePhotosUseCase = new ConfirmStorePhotosUseCase(thriftStoreRepository);
    const getMyFeedbackUseCase = new GetMyFeedbackUseCase(feedbackRepository);
    const upsertFeedbackUseCase = new UpsertFeedbackUseCase(feedbackRepository);
    const deleteMyFeedbackUseCase = new DeleteMyFeedbackUseCase(feedbackRepository);
    const getStoreRatingsUseCase = new GetStoreRatingsUseCase(feedbackRepository);
    const sendSupportMessageUseCase = new SendSupportMessageUseCase(supportRepository);
    const requestPushPermissionUseCase = new RequestPushPermissionUseCase(pushRepository);
    const getPushTokenUseCase = new GetPushTokenUseCase(pushRepository);
    const registerPushTokenUseCase = new RegisterPushTokenUseCase(pushRepository);
    const unregisterPushTokenUseCase = new UnregisterPushTokenUseCase(pushRepository);
    const syncPushTopicsUseCase = new SyncPushTopicsUseCase(pushRepository);
    const observePushTokenRefreshUseCase = new ObservePushTokenRefreshUseCase(pushRepository);
    const observeNotificationOpenUseCase = new ObserveNotificationOpenUseCase(pushRepository);
    const getInitialNotificationUseCase = new GetInitialNotificationUseCase(pushRepository);

    return {
      getCurrentUserUseCase,
      getFeaturedThriftStoresUseCase,
      getNearbyThriftStoresUseCase,
      getGuideContentUseCase,
      getGuideContentByIdUseCase,
      getContentCommentsUseCase,
      createContentCommentUseCase,
      updateContentCommentUseCase,
      deleteContentCommentUseCase,
      likeContentUseCase,
      unlikeContentUseCase,
      createContentUseCase,
      updateContentUseCase,
      requestContentImageUploadUseCase,
      deleteContentUseCase,
      getFavoriteThriftStoresUseCase,
      searchThriftStoresUseCase,
      toggleFavoriteThriftStoreUseCase,
      isFavoriteThriftStoreUseCase,
      getCategoriesUseCase,
      getCachedCategoriesUseCase,
      getThriftStoreByIdUseCase,
      getStoresByCategoryUseCase,
      getNearbyPaginatedUseCase,
      getProfileUseCase,
      getCachedProfileUseCase,
      updateProfileUseCase,
      deleteAccountUseCase,
      requestAvatarUploadSlotUseCase,
      createOrUpdateStoreUseCase,
      requestStorePhotoUploadsUseCase,
      confirmStorePhotosUseCase,
      favoriteRepository,
      getMyFeedbackUseCase,
      upsertFeedbackUseCase,
      deleteMyFeedbackUseCase,
      getStoreRatingsUseCase,
      sendSupportMessageUseCase,
      requestPushPermissionUseCase,
      getPushTokenUseCase,
      registerPushTokenUseCase,
      unregisterPushTokenUseCase,
      syncPushTopicsUseCase,
      observePushTokenRefreshUseCase,
      observeNotificationOpenUseCase,
      getInitialNotificationUseCase
    };
  }, []);

  return <DependenciesContext.Provider value={value}>{children}</DependenciesContext.Provider>;
}
