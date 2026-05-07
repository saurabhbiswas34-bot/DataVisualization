import { ReactNode, useState } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
    },
  });
}

interface WrapperProps {
  children: ReactNode;
  initialRoute?: string;
}

export function Wrapper({ children, initialRoute = '/' }: WrapperProps) {
  // useState initializer prevents new client on every re-render
  const [queryClient] = useState(() => createTestQueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
}

export function renderWithProviders(
  ui: React.ReactElement,
  options?: RenderOptions & { initialRoute?: string }
) {
  const { initialRoute, ...rest } = options ?? {};
  return render(ui, {
    wrapper: ({ children }) => (
      <Wrapper initialRoute={initialRoute}>{children}</Wrapper>
    ),
    ...rest,
  });
}
