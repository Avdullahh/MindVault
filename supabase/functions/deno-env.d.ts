declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

declare module 'https://esm.sh/@supabase/supabase-js@2' {
  export function createClient(
    supabaseUrl: string,
    supabaseKey: string,
    options?: {
      global?: {
        headers?: Record<string, string>;
      };
    },
  ): {
    auth: {
      getUser(jwt?: string): Promise<{
        data: { user: { id: string } | null };
        error: unknown;
      }>;
    };
    from(table: string): {
      select(columns?: string): any;
      insert(values: unknown): any;
      update(values: unknown): any;
      delete(): any;
    };
  };
}
