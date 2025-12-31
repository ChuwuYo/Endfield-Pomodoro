import { useRegisterSW } from 'virtual:pwa-register/react';
import { useEffect, useRef, useState } from 'react';
import { Button } from './ui';
import type { useTranslation } from '../utils/i18n';
import { HOURLY_CHECK_INTERVAL_MS } from '../constants';

interface PWAPromptProps {
    t: ReturnType<typeof useTranslation>;
}

/**
 * 检测是否以 PWA 模式运行（已安装）
 * standalone 或 fullscreen 模式表示用户已安装 PWA
 */
const isPWAInstalled = (): boolean => {
    // 检查 display-mode 媒体查询
    if (window.matchMedia('(display-mode: standalone)').matches) return true;
    if (window.matchMedia('(display-mode: fullscreen)').matches) return true;
    // iOS Safari 的特殊检测
    if ((navigator as { standalone?: boolean }).standalone === true) return true;
    return false;
};

export function PWAPrompt({ t }: PWAPromptProps) {
    // 使用 Ref 存储 SW 注册实例，避免重复去 navigator 里查
    const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
    const intervalRef = useRef<number | null>(null);
    const [updating, setUpdating] = useState(false);
    
    // 检测是否为已安装的 PWA
    const [isInstalled, setIsInstalled] = useState(() => isPWAInstalled());

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

    // 监听 display-mode 变化（用户可能在运行时安装 PWA）
    useEffect(() => {
        const standaloneMql = window.matchMedia('(display-mode: standalone)');
        const fullscreenMql = window.matchMedia('(display-mode: fullscreen)');
        
        // 重新调用 isPWAInstalled() 完整检查当前状态
        const handler = () => setIsInstalled(isPWAInstalled());
        
        standaloneMql.addEventListener('change', handler);
        fullscreenMql.addEventListener('change', handler);
        
        return () => {
            standaloneMql.removeEventListener('change', handler);
            fullscreenMql.removeEventListener('change', handler);
        };
    }, []);

    // 监听 controllerchange 事件，一旦新 SW 接管，立即刷新
    useEffect(() => {
        // 防御性判断：确保环境支持 Service Worker
        if (!('serviceWorker' in navigator)) return;

        const handleControllerChange = () => {
            console.log('[PWA] Controller changed, reloading page...');
            window.location.reload();
        };

        navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

        return () => {
            navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
        };
    }, []);

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

    // 点击更新时的处理函数
    const handleUpdate = async () => {
        setUpdating(true);
        console.log('[PWA] User clicked update, sending skipWaiting...');
        try {
            await updateServiceWorker(true);
        } catch (error) {
            console.error('[PWA] Update failed:', error);
            setUpdating(false);
        }
    };

    // 只有在 PWA 已安装且需要刷新时才显示更新提示
    // 普通浏览器用户自动更新，无需手动确认
    useEffect(() => {
        if (needRefresh && !isInstalled) {
            console.log('[PWA] Browser user, auto-updating...');
            updateServiceWorker(true);
        }
    }, [needRefresh, isInstalled, updateServiceWorker]);

    // 非 PWA 用户不显示 UI（自动更新）
    if (!needRefresh || !isInstalled) return null;

    return (
        <div
            className="fixed bottom-4 right-4 z-[9999] p-4 bg-theme-surface border border-theme-primary clip-path-slant shadow-lg max-w-xs animate-in slide-in-from-bottom-2 duration-300"
            role="status"
            aria-live="polite"
        >
            <div className="flex items-start gap-3">
                <i className={`ri-refresh-line text-theme-primary text-xl flex-shrink-0 mt-0.5 ${updating ? 'animate-spin' : 'animate-spin-slow'}`} />
                <div className="flex-1 min-w-0">
                    <p className="text-theme-text font-mono text-sm mb-3 font-bold">
                        {t('pwa_update_available')}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            onClick={handleUpdate}
                            disabled={updating}
                            variant="primary"
                            className="text-xs py-1 px-3"
                        >
                            {updating ? t('pwa_updating') : t('pwa_update_now')}
                        </Button>
                        <Button
                            onClick={() => setNeedRefresh(false)}
                            disabled={updating}
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