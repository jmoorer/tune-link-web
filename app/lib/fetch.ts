export const createFetcher = (baseUrl: string) => {
  const fetcher = async <T>(
    path: string,
    {
      token,
      method,
      body,
      query,
      options,
    }: {
      token: string;
      method: "GET" | "POST" | "PUT" | "DELETE";

      body?: any;
      query?: Record<string, string>;

      options?: RequestInit;
    }
  ) => {
    let response: Response;
    let url = `${baseUrl}${path}`;
    if (query) {
      url += `?${new URLSearchParams(query).toString()}`;
    }
    try {
      response = await fetch(url, {
        ...options,
        method,
        body: body ? JSON.stringify(body) : undefined,
        headers: {
          ...options?.headers,
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.log(
          "failed response:",
          JSON.stringify(
            {
              url,
              method,
              body,
              headers: options?.headers,
              response: await response.text(),
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
      const data = await response.json();
      console.log("response data", data);
      return data as T;
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

class HTTPError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}
