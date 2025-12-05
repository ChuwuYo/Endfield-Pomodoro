import { useRegisterSW } from 'virtual:pwa-register/react';
import { useEffect, useRef } from 'react';
import { Button } from './TerminalUI';
import type { useTranslation } from '../utils/i18n';

interface PWAPromptProps {
    t: ReturnType<typeof useTranslation>;
}

/**
 * PWA 更新提示组件
 * 当检测到新版本时显示更新提示，让用户选择立即更新或稀后
 */
export function PWAPrompt({ t }: PWAPromptProps) {
    const intervalRef = useRef<number | null>(null);
    
    // 清理定时器的 effect
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);
    
    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r: ServiceWorkerRegistration | undefined) {
            // 每小时检查一次更新
            if (r) {
                // 清除之前的定时器（如果有）
                if (intervalRef.current) clearInterval(intervalRef.current);
                intervalRef.current = window.setInterval(() => {
                    r.update();
                }, 60 * 60 * 1000);
            }
        },
        onRegisterError(error: Error) {
            console.error('SW registration error:', error);
        },
    });

    if (!needRefresh) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[9999] p-4 bg-theme-surface border border-theme-primary clip-path-slant shadow-lg max-w-xs">
            <div className="flex items-start gap-3">
                <i className="ri-refresh-line text-theme-primary text-xl flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                    <p className="text-theme-text font-mono text-sm mb-3">
                        {t('pwa_update_available')}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => updateServiceWorker(true)}
                            variant="primary"
                            className="text-xs py-1 px-3"
                        >
                            {t('pwa_update_now')}
                        </Button>
                        <Button
                            onClick={() => setNeedRefresh(false)}
                            variant="ghost"
                            className="text-xs py-1 px-3"
                        >
                            {t('pwa_update_later')}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PWAPrompt;
