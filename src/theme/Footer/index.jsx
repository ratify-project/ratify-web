import React from 'react';
import Footer from '@theme-original/Footer';
import styles from './styles.module.css';
import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Link from '@docusaurus/Link';

export default function FooterWrapper(props) {
  return (
    <>
      <section className={[styles.footer_section, styles.section_padding].join(' ')}>
        <h4>We are a <Link href="https://www.cncf.io/" target="_blank">Cloud Native Computing Foundation</Link> Sandbox Project.</h4>
        {/* The logo image can be obtained from https://www.cncf.io/brand-guidelines/#logo */}
        <ThemedImage
          alt="Docusaurus themed image"
          width="300px"
          sources={{
            light: useBaseUrl('/img/cncf_light.svg'),
            dark: useBaseUrl('/img/cncf_dark.svg'),
          }}
        />
      </section>
      <Footer {...props} />
    </>
  );
}
