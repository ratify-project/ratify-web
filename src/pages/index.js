import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Header from '../components/Header/Header';
import What from '../components/What/What';
import Features from '../components/Features/Features';

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="Verification engine for software supply chain security <head />">
      <main>
        <Header/>
        <What/>
        <Features/>
      </main>
    </Layout>
  );
}
