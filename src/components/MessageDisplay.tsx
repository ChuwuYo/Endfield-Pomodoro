import React from 'react';
import { useTranslation } from '../utils/i18n';
import { Language } from '../types';

// 从 useTranslation 的返回类型中提取键类型
type TranslationKey = Parameters<ReturnType<typeof useTranslation>>[0];

interface MessageDisplayProps {
    messageKey: TranslationKey;
    language: Language;
    actionButton?: {
        textKey: TranslationKey;
        onClick: () => void;
    };
}

const MessageDisplay: React.FC<MessageDisplayProps> = ({ messageKey, language, actionButton }) => {
    const t = useTranslation(language);

    return (
        <div className="flex flex-col items-center justify-center">
            <div className="relative text-xs font-mono text-theme-primary">
                <div className="absolute inset-0 data-flow-bg"></div>
                <div className="relative animate-pulse">{t(messageKey)}</div>
            </div>
            {actionButton && (
                <button
                    onClick={actionButton.onClick}
                    className="mt-1 text-[10px] font-mono text-theme-dim hover:text-theme-primary transition-colors"
                >
                    {t(actionButton.textKey)}
                </button>
            )}
        </div>
    );
};

export default MessageDisplay;
