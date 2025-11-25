import React, { PropsWithChildren, createContext, useContext, useMemo } from "react";
import { AsyncStorageUserLocalDataSource } from "../../data/datasources/impl/AsyncStorageUserLocalDataSource";
import { UserRepositoryImpl } from "../../data/repositories/UserRepositoryImpl";
import { HttpThriftStoreRemoteDataSource } from "../../data/datasources/impl/HttpThriftStoreRemoteDataSource";
import { HttpGuideContentRemoteDataSource } from "../../data/datasources/impl/HttpGuideContentRemoteDataSource";
import { HttpCategoryRemoteDataSource } from "../../data/datasources/impl/HttpCategoryRemoteDataSource";
import { HttpProfileRemoteDataSource } from "../../data/datasources/impl/HttpProfileRemoteDataSource";
import { AsyncStorageProfileLocalDataSource } from "../../data/datasources/impl/AsyncStorageProfileLocalDataSource";
import { ThriftStoreRepositoryJson } from "../../data/repositories/ThriftStoreRepositoryJson";
import { GuideContentRepositoryJson } from "../../data/repositories/GuideContentRepositoryJson";
import { CategoryRepositoryJson } from "../../data/repositories/CategoryRepositoryJson";
import { ProfileRepositoryJson } from "../../data/repositories/ProfileRepositoryJson";
import { GetCurrentUserUseCase } from "../../domain/usecases/GetCurrentUserUseCase";
import { GetFeaturedThriftStoresUseCase } from "../../domain/usecases/GetFeaturedThriftStoresUseCase";
import { GetNearbyThriftStoresUseCase } from "../../domain/usecases/GetNearbyThriftStoresUseCase";
import { GetGuideContentUseCase } from "../../domain/usecases/GetGuideContentUseCase";
import { GetFavoriteThriftStoresUseCase } from "../../domain/usecases/GetFavoriteThriftStoresUseCase";
import { GetCategoriesUseCase } from "../../domain/usecases/GetCategoriesUseCase";
import { GetThriftStoreByIdUseCase } from "../../domain/usecases/GetThriftStoreByIdUseCase";
import { GetStoresByCategoryUseCase } from "../../domain/usecases/GetStoresByCategoryUseCase";
import { SearchThriftStoresUseCase } from "../../domain/usecases/SearchThriftStoresUseCase";
import { GetProfileUseCase } from "../../domain/usecases/GetProfileUseCase";
import { UpdateProfileUseCase } from "../../domain/usecases/UpdateProfileUseCase";
import { FavoriteRepositoryHybrid } from "../../data/repositories/FavoriteRepositoryHybrid";
import { HttpFavoriteRemoteDataSource } from "../../data/datasources/impl/HttpFavoriteRemoteDataSource";
import { ToggleFavoriteThriftStoreUseCase } from "../../domain/usecases/ToggleFavoriteThriftStoreUseCase";
import { IsFavoriteThriftStoreUseCase } from "../../domain/usecases/IsFavoriteThriftStoreUseCase";
import type { FavoriteRepository } from "../../domain/repositories/FavoriteRepository";
import { GetHomeUseCase } from "../../domain/usecases/GetHomeUseCase";
import { GetNearbyPaginatedUseCase } from "../../domain/usecases/GetNearbyPaginatedUseCase";
import { HttpFeedbackRemoteDataSource } from "../../data/datasources/impl/HttpFeedbackRemoteDataSource";
import { FeedbackRepositoryImpl } from "../../data/repositories/FeedbackRepositoryImpl";
import { GetMyFeedbackUseCase } from "../../domain/usecases/GetMyFeedbackUseCase";
import { UpsertFeedbackUseCase } from "../../domain/usecases/UpsertFeedbackUseCase";
import { DeleteMyFeedbackUseCase } from "../../domain/usecases/DeleteMyFeedbackUseCase";
import { DeleteAccountUseCase } from "../../domain/usecases/DeleteAccountUseCase";
import { CreateOrUpdateStoreUseCase } from "../../domain/usecases/CreateOrUpdateStoreUseCase";

interface Dependencies {
  getCurrentUserUseCase: GetCurrentUserUseCase;
  getFeaturedThriftStoresUseCase: GetFeaturedThriftStoresUseCase;
  getNearbyThriftStoresUseCase: GetNearbyThriftStoresUseCase;
  getGuideContentUseCase: GetGuideContentUseCase;
  getFavoriteThriftStoresUseCase: GetFavoriteThriftStoresUseCase;
  searchThriftStoresUseCase: SearchThriftStoresUseCase;
  toggleFavoriteThriftStoreUseCase: ToggleFavoriteThriftStoreUseCase;
  isFavoriteThriftStoreUseCase: IsFavoriteThriftStoreUseCase;
  getCategoriesUseCase: GetCategoriesUseCase;
  getThriftStoreByIdUseCase: GetThriftStoreByIdUseCase;
  getStoresByCategoryUseCase: GetStoresByCategoryUseCase;
  getHomeUseCase: GetHomeUseCase;
  getNearbyPaginatedUseCase: GetNearbyPaginatedUseCase;
  getProfileUseCase: GetProfileUseCase;
  updateProfileUseCase: UpdateProfileUseCase;
  deleteAccountUseCase: DeleteAccountUseCase;
  createOrUpdateStoreUseCase: CreateOrUpdateStoreUseCase;
  favoriteRepository: FavoriteRepository;
  getMyFeedbackUseCase: GetMyFeedbackUseCase;
  upsertFeedbackUseCase: UpsertFeedbackUseCase;
  deleteMyFeedbackUseCase: DeleteMyFeedbackUseCase;
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
    const guideContentRemote = new HttpGuideContentRemoteDataSource();
    const categoryRemote = new HttpCategoryRemoteDataSource();
    const profileRemote = new HttpProfileRemoteDataSource();
    const profileLocal = new AsyncStorageProfileLocalDataSource();
    const favoriteRepository = new FavoriteRepositoryHybrid(favoriteRemote);
    const feedbackRepository = new FeedbackRepositoryImpl(feedbackRemote);

    const thriftStoreRepository = new ThriftStoreRepositoryJson(thriftStoreRemote);
    const guideContentRepository = new GuideContentRepositoryJson(guideContentRemote);
    const categoryRepository = new CategoryRepositoryJson(categoryRemote);
    const profileRepository = new ProfileRepositoryJson(profileRemote, profileLocal);

    const getCurrentUserUseCase = new GetCurrentUserUseCase(userRepository);
    const getFeaturedThriftStoresUseCase = new GetFeaturedThriftStoresUseCase(thriftStoreRepository);
    const getNearbyThriftStoresUseCase = new GetNearbyThriftStoresUseCase(thriftStoreRepository);
    const getGuideContentUseCase = new GetGuideContentUseCase(guideContentRepository);
    const getFavoriteThriftStoresUseCase = new GetFavoriteThriftStoresUseCase(favoriteRepository);
    const searchThriftStoresUseCase = new SearchThriftStoresUseCase(thriftStoreRepository);
    const toggleFavoriteThriftStoreUseCase = new ToggleFavoriteThriftStoreUseCase(favoriteRepository);
    const isFavoriteThriftStoreUseCase = new IsFavoriteThriftStoreUseCase(favoriteRepository);
    const getCategoriesUseCase = new GetCategoriesUseCase(categoryRepository);
    const getThriftStoreByIdUseCase = new GetThriftStoreByIdUseCase(thriftStoreRepository);
    const getStoresByCategoryUseCase = new GetStoresByCategoryUseCase(thriftStoreRepository);
    const getHomeUseCase = new GetHomeUseCase(thriftStoreRepository);
    const getNearbyPaginatedUseCase = new GetNearbyPaginatedUseCase(thriftStoreRepository);
    const getProfileUseCase = new GetProfileUseCase(profileRepository);
    const updateProfileUseCase = new UpdateProfileUseCase(profileRepository);
    const deleteAccountUseCase = new DeleteAccountUseCase(profileRepository);
    const createOrUpdateStoreUseCase = new CreateOrUpdateStoreUseCase(thriftStoreRepository);
    const getMyFeedbackUseCase = new GetMyFeedbackUseCase(feedbackRepository);
    const upsertFeedbackUseCase = new UpsertFeedbackUseCase(feedbackRepository);
    const deleteMyFeedbackUseCase = new DeleteMyFeedbackUseCase(feedbackRepository);

    return {
      getCurrentUserUseCase,
      getFeaturedThriftStoresUseCase,
      getNearbyThriftStoresUseCase,
      getGuideContentUseCase,
      getFavoriteThriftStoresUseCase,
      searchThriftStoresUseCase,
      toggleFavoriteThriftStoreUseCase,
      isFavoriteThriftStoreUseCase,
      getCategoriesUseCase,
      getThriftStoreByIdUseCase,
      getStoresByCategoryUseCase,
      getHomeUseCase,
      getNearbyPaginatedUseCase,
      getProfileUseCase,
      updateProfileUseCase,
      deleteAccountUseCase,
      createOrUpdateStoreUseCase,
      favoriteRepository,
      getMyFeedbackUseCase,
      upsertFeedbackUseCase,
      deleteMyFeedbackUseCase
    };
  }, []);

  return <DependenciesContext.Provider value={value}>{children}</DependenciesContext.Provider>;
}
