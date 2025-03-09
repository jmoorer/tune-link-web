export type Fetcher = ReturnType<typeof createFetcher>;

export const createFetcher = (baseUrl: string, accessToken?: string) => {
  const fetcher = async <T>(
    path: string,
    {
      method,
      body,
      query,
      options,
      token,
      headers,
    }: {
      token?: string;
      method: "GET" | "POST" | "PUT" | "DELETE";

      body?: any;
      query?: Record<string, string>;
      headers?: Record<string, string>;
      options?: RequestInit;
    }
  ) => {
    let response: Response;
    let url = `${baseUrl}${path}`;
    if (query) {
      url += `?${new URLSearchParams(query).toString()}`;
    }
    const _token = accessToken ?? token;

    try {
      response = await fetch(url, {
        ...options,
        method,
        body: body ? JSON.stringify(body) : undefined,
        headers: {
          ...headers,
          ...(_token
            ? {
                Authorization: `Bearer ${_token}`,
              }
            : options?.headers),
        },
      });

      if (!response.ok) {
        const text = await response.text();
        console.log(
          "failed response:",
          JSON.stringify(
            {
              url,
              method,
              body,
              response: text,
            },
            null,
            2
          )
        );
        throw new HTTPError(
          `HTTP error! status: ${response.status}`,
          response.status
        );
      }
      const text = await response.text();
      console.log("response:", text);
      try {
        return JSON.parse(text) as T;
      } catch (parseError) {
        console.log("Raw response:", text);
        return {} as T;
      }

      // const data = await response.json();

      // return data as T;
    } catch (error) {
      console.error(error);

      if (error instanceof HTTPError) {
        throw error;
      }
      throw new HTTPError("Unknown error", 500);
    }
  };
  return fetcher;
};

export class HTTPError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}
