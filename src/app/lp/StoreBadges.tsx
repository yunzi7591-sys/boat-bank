import styles from "./lp.module.css";

const APP_STORE_URL = "https://apps.apple.com/jp/app/boat-bank/id6762543353";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=jp.boatbank.app";

/** LP用: App Store / Google Play へのダウンロードボタン */
export function StoreBadges() {
    return (
        <div className={styles.storeBadges}>
            <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.storeBadge}
                aria-label="App Storeでダウンロード"
            >
                <svg className={styles.storeBadgeIcon} viewBox="0 0 384 512" aria-hidden="true">
                    <path
                        fill="currentColor"
                        d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zM262.1 104.5c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"
                    />
                </svg>
                <span className={styles.storeBadgeText}>
                    <span className={styles.storeBadgeSmall}>Download on the</span>
                    <span className={styles.storeBadgeBig}>App Store</span>
                </span>
            </a>

            <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.storeBadge}
                aria-label="Google Playでダウンロード"
            >
                <svg className={styles.storeBadgeIcon} viewBox="0 0 24 24" aria-hidden="true">
                    <path
                        fill="currentColor"
                        d="M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 0 1 0 2.594zM1.337.924a1.486 1.486 0 0 0-.112.568v21.017c0 .217.045.419.124.6l11.155-11.087L1.337.924zm12.207 10.065l3.258-3.238L3.45.195a1.466 1.466 0 0 0-.946-.117l11.04 10.911zm0 2.022l-11 10.929c.298.088.63.06.94-.114l13.322-7.543-3.262-3.272z"
                    />
                </svg>
                <span className={styles.storeBadgeText}>
                    <span className={styles.storeBadgeSmall}>GET IT ON</span>
                    <span className={styles.storeBadgeBig}>Google Play</span>
                </span>
            </a>
        </div>
    );
}
