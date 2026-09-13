import type { MetadataRoute } from "next";

/** Keep the app out of search engines: disallow everything. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
