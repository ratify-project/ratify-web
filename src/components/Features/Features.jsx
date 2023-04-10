import React from 'react';
import styles from './styles.module.css';

const features = [
    {
        title: 'Comprehensive Verification',
        content: (
            <>
               Ratify offers a comprehensive verification framework that allows you to ensure that all of your reference artifacts meet your security and compliance standards. With Ratify, you can verify signatures, validate checksums, and ensure that your artifacts are up-to-date and free of known vulnerabilities.
            </>
        ),
    },
    {
        title: 'Flexible Configuration',
        content: (
            <>
                Ratify offers a flexible configuration system that allows you to customize your verification policies to meet your specific needs. You can easily define your own policies for signature validation, artifact verification, and more, and Ratify will automatically enforce these policies across your Kubernetes environment.
            </>
        ),
    },
    {
        title: 'Easy Integration',
        content: (
            <>
                Ratify is designed to integrate seamlessly with your existing Kubernetes environment. With just a few simple steps, you can install Ratify and begin verifying your reference artifacts with ease. Plus, Ratify offers a set of interfaces that can be consumed by various systems, making it easy to integrate Ratify into your existing toolchain.
            </>
        ),
    },
    // {
    //     title: 'Open Source Driven',
    //     content: (
    //         <>
    //           Ratify is an open source project that is driven by a vibrant community of contributors. This means that you can benefit from the collective knowledge and experience of a diverse group of developers and users who are committed to making Ratify the best it can be.
    //         </>
    //     ),
    // }
];

export default function Features() {
    return (
        <div className={[styles.features, styles.section_padding].join(' ')}>
            <div className={styles.features_r}>
                <h1>Features of RATIFY</h1>
            </div>
            {features.map(({ title, content }, index) => (
                <div className={styles.feature_card} key={index}>
                    <div />
                    <h3>{title}</h3>
                    <p className={styles.info}>{content}</p>
                </div>
            ))}
        </div>
    );
}
