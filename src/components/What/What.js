import React from 'react';
import styles from './styles.module.css';

export default function What() {
    return (
        <div className={[styles.what, styles.section_padding].join(' ')}>
            <div className={styles.what_heading}>
                <h1>What is Ratify?</h1>
            </div>
            <div className={styles.what_content}>
                <p> The project provides a framework to integrate scenarios that require verification of reference artifacts and provides a set of interfaces that can be consumed by various systems that can participate in artifact ratification.
                </p>
            </div>
            
        </div>
    );
}