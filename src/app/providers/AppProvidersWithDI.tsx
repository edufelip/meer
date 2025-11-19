import React, { PropsWithChildren, createContext, useContext, useMemo } from "react";
import { AsyncStorageUserLocalDataSource } from "../../data/datasources/impl/AsyncStorageUserLocalDataSource";
import { UserRepositoryImpl } from "../../data/repositories/UserRepositoryImpl";
import { InMemoryThriftStoreRepository } from "../../data/repositories/InMemoryThriftStoreRepository";
import { GetCurrentUserUseCase } from "../../domain/usecases/GetCurrentUserUseCase";
import { GetFeaturedThriftStoresUseCase } from "../../domain/usecases/GetFeaturedThriftStoresUseCase";
import { GetNearbyThriftStoresUseCase } from "../../domain/usecases/GetNearbyThriftStoresUseCase";

interface Dependencies {
  getCurrentUserUseCase: GetCurrentUserUseCase;
  getFeaturedThriftStoresUseCase: GetFeaturedThriftStoresUseCase;
  getNearbyThriftStoresUseCase: GetNearbyThriftStoresUseCase;
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
    const thriftStoreRepository = new InMemoryThriftStoreRepository();

    const getCurrentUserUseCase = new GetCurrentUserUseCase(userRepository);
    const getFeaturedThriftStoresUseCase = new GetFeaturedThriftStoresUseCase(thriftStoreRepository);
    const getNearbyThriftStoresUseCase = new GetNearbyThriftStoresUseCase(thriftStoreRepository);

    return {
      getCurrentUserUseCase,
      getFeaturedThriftStoresUseCase,
      getNearbyThriftStoresUseCase
    };
  }, []);

  return <DependenciesContext.Provider value={value}>{children}</DependenciesContext.Provider>;
}
