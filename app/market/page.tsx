"use client";

export default function MarketPage() {
    return (
        <div className="bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                            Market
                        </h1>

                        <div className="text-center py-12">
                            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
                                NFT Marketplace
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-8">
                                Discover, buy, and sell unique digital assets.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                        Browse Collections
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                                        Explore featured NFT collections from top creators
                                    </p>
                                    <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors">
                                        Coming Soon
                                    </button>
                                </div>

                                <div className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-lg p-6">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                        Create & Mint
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                                        Create your own NFTs and mint them on the blockchain
                                    </p>
                                    <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors">
                                        Coming Soon
                                    </button>
                                </div>

                                <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg p-6">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                        Trade & Auction
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                                        Buy, sell, and auction NFTs with other collectors
                                    </p>
                                    <button className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition-colors">
                                        Coming Soon
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
