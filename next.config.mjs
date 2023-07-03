/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./src/env.mjs");
// https://uploadthing.com/f/3801a193-6852-48d4-a8ce-a1cf21c18ef9_1500684.jpg
/** @type {import("next").NextConfig} */
const config = {
    reactStrictMode: true,
    images: {
        domains: ["cdn.discordapp.com", "uploadthing.com", 'images.unsplash.com', 'ivo-demo-bucket.s3.eu-central-1.amazonaws.com'],
        remotePatterns: [{
            protocol: "https",
            hostname: "uploadthing.com",
            port: "",
            pathname: "*",
        },
        ],
    },
    experimental: {
        esmExternals: false,
    },
    // async redirects() {
    //   return [
    //     {
    //       source: "/CreateArticle",
    //       destination: "/",
    //       permanent: true,
    //     },
    //   ];
    // },

    /**
     * If you have `experimental: { appDir: true }` set, then you must comment the below `i18n` config
     * out.
     *
     * @see https://github.com/vercel/next.js/issues/41980
     */
    i18n: {
        locales: ["en"],
        defaultLocale: "en",
    },
};
export default config;
