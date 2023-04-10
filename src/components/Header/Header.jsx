import React from 'react';
// import ORAScubes from '@site/static/img/oras_cubes.svg';
import styles from './styles.module.css';

export default function Header() {
    return (
        <div className={[styles.header, styles.section_padding].join(' ')}>
            <div className={styles.header_content}>
                <h1>RATIFY</h1>
                <h3>Lorem ipsum dolor sit amet consectetur adipisicing elit. </h3>
                <div className={styles.header_content_input}>
                    <a class="button  button--lg" href="docs/1.0.0/intro">Get Started</a>
                </div>
            </div>
            <div className={styles.header_image}>
                {/* <ORAScubes title="ORAS Cubes" width="100%" /> */}
            </div>
        </div>
    );
}
