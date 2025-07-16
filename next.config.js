/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
        // Ignore keyv adapters that aren't needed
        config.plugins.push(
            new webpack.IgnorePlugin({
                resourceRegExp: /^(@keyv\/(redis|mongo|sqlite|postgres|mysql|etcd|offline|tiered))$/,
            })
        );

        // Additional fallbacks for browser
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
                crypto: false,
            };
        }

        return config;
    },
    transpilePackages: [
        '@aptos-labs/wallet-adapter-react',
        '@aptos-labs/wallet-adapter-core',
        '@aptos-labs/ts-sdk',
    ],
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'www.lou1s.fun',
            },
        ],
    },
};

module.exports = nextConfig;
