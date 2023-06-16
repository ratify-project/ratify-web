import React from 'react';
// import ORAScubes from '@site/static/img/oras_cubes.svg';
import styles from './styles.module.css';

export default function Header() {
    return (
        <div className={[styles.header, styles.section_padding].join(' ')}>
            <div className={styles.header_content}>
                {/* <h1>RATIFY</h1> */}
                <h3>The project provides a <span style={{color:"#3FB1E5"}}>framework</span> to <span style={{color:"#3FB1E5"}}>integrate</span> scenarios that require <span style={{color:"#3FB1E5"}}>verification</span> of reference <span style={{color:"#3FB1E5"}}>artifacts</span> </h3>
                <div className={styles.header_content_input}>
                    <a class="button  button--lg" href="docs/1.0.0/quick-start">Get Started</a>
                </div>
            </div>
            <div className={styles.video}>
            <iframe width="560" height="315" src="https://www.youtube.com/embed/pj8Q8nnMQWM" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
            </div>
        </div>
    );
}
