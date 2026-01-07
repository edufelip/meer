export const endpoints = {
  thriftStores: {
    list: () => `/thrift-stores`,
    detail: (id: string) => `/thrift-stores/${id}`,
    search: (q: string) => `/thrift-stores/search?q=${encodeURIComponent(q)}`
  },
  articles: {
    listByStore: (storeId: string) => `/stores/${storeId}/articles`,
    detail: (id: string) => `/articles/${id}`,
    create: (storeId: string) => `/stores/${storeId}/articles`,
    update: (id: string) => `/articles/${id}`,
    delete: (id: string) => `/articles/${id}`
  },
  auth: {
    login: () => `/auth/login`,
    signup: () => `/auth/signup`,
    refresh: () => `/auth/refresh`
  },
  pushTokens: {
    register: () => `/push-tokens`,
    unregister: (deviceId: string) => `/push-tokens/${deviceId}`
  }
};
