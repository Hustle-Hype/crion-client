import React from "react";
import { FaTrophy, FaCalendar } from "react-icons/fa";

interface ScoreEntry {
    _id: string;
    issuerId: string;
    scores: {
        key: string;
        raw: number;
        weighted: number;
        note: string;
    }[];
    totalScore: number;
    badge: string;
    recordedAt: string;
    version: number;
    source: string;
}

interface AchievementHistoryProps {
    scoreHistory: ScoreEntry[];
    formatDate: (dateString: string) => string;
}

export default function AchievementHistory({ scoreHistory, formatDate }: AchievementHistoryProps) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <FaTrophy className="w-5 h-5 mr-3 text-yellow-500" />
                Achievement History
            </h3>

            {scoreHistory.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                    {scoreHistory.map((entry) => (
                        <div
                            key={entry._id}
                            className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full">
                                        {entry.badge.replace('_', ' ').toUpperCase()}
                                    </span>
                                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                        +{entry.totalScore}
                                    </span>
                                </div>
                                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                    <FaCalendar className="w-3 h-3 mr-1" />
                                    {formatDate(entry.recordedAt)}
                                </div>
                            </div>
                            <div className="space-y-2">
                                {entry.scores.map((score, scoreIndex) => (
                                    <div key={scoreIndex} className="text-sm">
                                        <p className="text-gray-700 dark:text-gray-300">
                                            {score.note}
                                        </p>
                                        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                                            <span>{score.key}</span>
                                            <span>•</span>
                                            <span>Raw: {score.raw}</span>
                                            <span>•</span>
                                            <span>Weighted: {score.weighted}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8">
                    <FaTrophy className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                        No achievements yet. Start by connecting your social accounts!
                    </p>
                </div>
            )}
        </div>
    );
}
