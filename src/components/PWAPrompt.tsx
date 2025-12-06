import { useRegisterSW } from 'virtual:pwa-register/react';
import { useEffect, useRef } from 'react';
import { Button } from './TerminalUI';
import type { useTranslation } from '../utils/i18n';
import { HOURLY_CHECK_INTERVAL_MS } from '../constants';

interface PWAPromptProps {
    t: ReturnType<typeof useTranslation>;
}

export function PWAPrompt({ t }: PWAPromptProps) {
    // 使用 Ref 存储 SW 注册实例，避免重复去 navigator 里查
    const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
    const intervalRef = useRef<number | null>(null);

    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        // 注册成功的回调
        onRegistered(r) {
            if (r) {
                registrationRef.current = r;
                
                // 立即检查一次
                r.update();
                console.log('[PWA] Registered & Initial check fired');

                // 设置轮询 (每小时)
                // 先清理可能存在的旧定时器（防止多次注册）
                if (intervalRef.current) clearInterval(intervalRef.current);
                
                intervalRef.current = window.setInterval(() => {
                    // 闭包直接使用 r
                    console.log('[PWA] Hourly check fired');
                    r.update();
                }, HOURLY_CHECK_INTERVAL_MS);
            }
        },
        onRegisterError(error) {
            console.error('[PWA] Registration error:', error);
        },
    });

    // 处理可见性变化监听与组件卸载清理
    useEffect(() => {
        const handleVisibilityChange = () => {
            // 只有当页面可见，且我们手里已经拿到了 SW 注册实例时，才去检查
            if (document.visibilityState === 'visible' && registrationRef.current) {
                console.log('[PWA] Visibility visible, checking update...');
                registrationRef.current.update();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // 返回一个清理函数，在组件卸载时执行
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []); // 这里的依赖项为空是安全的，因为要的是 ref.current 的实时值

    // 如果不需要刷新，不渲染任何 DOM
    if (!needRefresh) return null;

    return (
        <div
            className="fixed bottom-4 right-4 z-[9999] p-4 bg-theme-surface border border-theme-primary clip-path-slant shadow-lg max-w-xs animate-in slide-in-from-bottom-2 duration-300"
            role="status"
            aria-live="polite"
        >
            <div className="flex items-start gap-3">
                <i className="ri-refresh-line text-theme-primary text-xl flex-shrink-0 mt-0.5 animate-spin-slow" />
                <div className="flex-1 min-w-0">
                    <p className="text-theme-text font-mono text-sm mb-3 font-bold">
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
                            className="text-xs py-1 px-3 hover:bg-theme-primary/10"
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