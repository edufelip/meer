import React, { PropsWithChildren, createContext, useContext, useMemo } from "react";
import { AsyncStorageUserLocalDataSource } from "../../data/datasources/impl/AsyncStorageUserLocalDataSource";
import { UserRepositoryImpl } from "../../data/repositories/UserRepositoryImpl";
import { JsonThriftStoreRemoteDataSource } from "../../data/datasources/impl/JsonThriftStoreRemoteDataSource";
import { JsonGuideContentRemoteDataSource } from "../../data/datasources/impl/JsonGuideContentRemoteDataSource";
import { JsonCategoryRemoteDataSource } from "../../data/datasources/impl/JsonCategoryRemoteDataSource";
import { JsonProfileRemoteDataSource } from "../../data/datasources/impl/JsonProfileRemoteDataSource";
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
import { SearchThriftStoresUseCase } from "../../domain/usecases/SearchThriftStoresUseCase";
import { GetProfileUseCase } from "../../domain/usecases/GetProfileUseCase";
import { UpdateProfileUseCase } from "../../domain/usecases/UpdateProfileUseCase";
import { FavoriteRepositoryAsyncStorage } from "../../data/repositories/FavoriteRepositoryAsyncStorage";
import { ToggleFavoriteThriftStoreUseCase } from "../../domain/usecases/ToggleFavoriteThriftStoreUseCase";
import { IsFavoriteThriftStoreUseCase } from "../../domain/usecases/IsFavoriteThriftStoreUseCase";

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
  getProfileUseCase: GetProfileUseCase;
  updateProfileUseCase: UpdateProfileUseCase;
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
    const thriftStoreRemote = new JsonThriftStoreRemoteDataSource();
    const guideContentRemote = new JsonGuideContentRemoteDataSource();
    const categoryRemote = new JsonCategoryRemoteDataSource();
    const profileRemote = new JsonProfileRemoteDataSource();
    const favoriteRepository = new FavoriteRepositoryAsyncStorage();

    const thriftStoreRepository = new ThriftStoreRepositoryJson(thriftStoreRemote);
    const guideContentRepository = new GuideContentRepositoryJson(guideContentRemote);
    const categoryRepository = new CategoryRepositoryJson(categoryRemote);
    const profileRepository = new ProfileRepositoryJson(profileRemote);

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
    const getProfileUseCase = new GetProfileUseCase(profileRepository);
    const updateProfileUseCase = new UpdateProfileUseCase(profileRepository);

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
      getProfileUseCase,
      updateProfileUseCase
    };
  }, []);

  return <DependenciesContext.Provider value={value}>{children}</DependenciesContext.Provider>;
}
