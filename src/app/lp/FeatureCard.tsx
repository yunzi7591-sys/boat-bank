import styles from "./lp.module.css";

interface FeatureCardProps {
    number: string;
    title: string;
    description?: string;
    tag?: string;
}

export function FeatureCard({ number, title, description, tag }: FeatureCardProps) {
    return (
        <article className={`${styles.featureCard} ${styles.scrollReveal}`}>
            <div className={styles.featureCardHeadRow}>
                <div className={styles.featureNumber}>{number}</div>
                {tag && <div className={styles.featureTag}>{tag}</div>}
            </div>
            <h3 className={styles.featureTitle}>{title}</h3>
            {description && <p className={styles.featureDesc}>{description}</p>}
        </article>
    );
}
