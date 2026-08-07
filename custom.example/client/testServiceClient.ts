import { useCustomServiceClient, type CustomServiceClient } from '@unified-ui/custom-api';

export interface RemoteTodoResponse {
  id: string;
  title: string;
  completed: boolean;
}

export class TestServiceClient {
  private readonly client: CustomServiceClient;

  constructor(client: CustomServiceClient) {
    this.client = client;
  }

  async listTodos(signal?: AbortSignal): Promise<RemoteTodoResponse[]> {
    return this.client.request<RemoteTodoResponse[]>('/todos', { tenantScoped: true, signal });
  }
}

export const useTestServiceClient = (): TestServiceClient => {
  const client = useCustomServiceClient({
    baseURL: import.meta.env.VITE_CUSTOM_TEST_API_URL || '/api/v1/test-service',
  });
  return new TestServiceClient(client);
};
