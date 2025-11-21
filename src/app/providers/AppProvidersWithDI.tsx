import React, { PropsWithChildren, createContext, useContext, useMemo } from "react";
import { AsyncStorageUserLocalDataSource } from "../../data/datasources/impl/AsyncStorageUserLocalDataSource";
import { UserRepositoryImpl } from "../../data/repositories/UserRepositoryImpl";
import { JsonThriftStoreRemoteDataSource } from "../../data/datasources/impl/JsonThriftStoreRemoteDataSource";
import { JsonGuideContentRemoteDataSource } from "../../data/datasources/impl/JsonGuideContentRemoteDataSource";
import { JsonCategoryRemoteDataSource } from "../../data/datasources/impl/JsonCategoryRemoteDataSource";
import { ThriftStoreRepositoryJson } from "../../data/repositories/ThriftStoreRepositoryJson";
import { GuideContentRepositoryJson } from "../../data/repositories/GuideContentRepositoryJson";
import { CategoryRepositoryJson } from "../../data/repositories/CategoryRepositoryJson";
import { GetCurrentUserUseCase } from "../../domain/usecases/GetCurrentUserUseCase";
import { GetFeaturedThriftStoresUseCase } from "../../domain/usecases/GetFeaturedThriftStoresUseCase";
import { GetNearbyThriftStoresUseCase } from "../../domain/usecases/GetNearbyThriftStoresUseCase";
import { GetGuideContentUseCase } from "../../domain/usecases/GetGuideContentUseCase";
import { GetFavoriteThriftStoresUseCase } from "../../domain/usecases/GetFavoriteThriftStoresUseCase";
import { GetCategoriesUseCase } from "../../domain/usecases/GetCategoriesUseCase";
import { GetThriftStoreByIdUseCase } from "../../domain/usecases/GetThriftStoreByIdUseCase";

interface Dependencies {
  getCurrentUserUseCase: GetCurrentUserUseCase;
  getFeaturedThriftStoresUseCase: GetFeaturedThriftStoresUseCase;
  getNearbyThriftStoresUseCase: GetNearbyThriftStoresUseCase;
  getGuideContentUseCase: GetGuideContentUseCase;
  getFavoriteThriftStoresUseCase: GetFavoriteThriftStoresUseCase;
  getCategoriesUseCase: GetCategoriesUseCase;
  getThriftStoreByIdUseCase: GetThriftStoreByIdUseCase;
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

    const thriftStoreRepository = new ThriftStoreRepositoryJson(thriftStoreRemote);
    const guideContentRepository = new GuideContentRepositoryJson(guideContentRemote);
    const categoryRepository = new CategoryRepositoryJson(categoryRemote);

    const getCurrentUserUseCase = new GetCurrentUserUseCase(userRepository);
    const getFeaturedThriftStoresUseCase = new GetFeaturedThriftStoresUseCase(thriftStoreRepository);
    const getNearbyThriftStoresUseCase = new GetNearbyThriftStoresUseCase(thriftStoreRepository);
    const getGuideContentUseCase = new GetGuideContentUseCase(guideContentRepository);
    const getFavoriteThriftStoresUseCase = new GetFavoriteThriftStoresUseCase(thriftStoreRepository);
    const getCategoriesUseCase = new GetCategoriesUseCase(categoryRepository);
    const getThriftStoreByIdUseCase = new GetThriftStoreByIdUseCase(thriftStoreRepository);

    return {
      getCurrentUserUseCase,
      getFeaturedThriftStoresUseCase,
      getNearbyThriftStoresUseCase,
      getGuideContentUseCase,
      getFavoriteThriftStoresUseCase,
      getCategoriesUseCase,
      getThriftStoreByIdUseCase
    };
  }, []);

  return <DependenciesContext.Provider value={value}>{children}</DependenciesContext.Provider>;
}
